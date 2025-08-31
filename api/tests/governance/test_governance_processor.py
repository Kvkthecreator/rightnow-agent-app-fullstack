"""Tests for governance-aware dump processor."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from uuid import uuid4, UUID

from src.app.agents.pipeline.governance_processor import (
    GovernanceDumpProcessor,
    SubstrateCandidate,
    GovernanceProposal
)
from src.app.agents.pipeline.validator_agent import (
    ValidationReport,
    ProposalConflict,
    ProposalOperation
)


class TestGovernanceDumpProcessor:
    """Test governance-aware dump processing."""
    
    @pytest.fixture
    def processor(self):
        """Create governance dump processor."""
        return GovernanceDumpProcessor()
    
    @pytest.fixture
    def sample_dump(self):
        """Sample dump data for testing."""
        return {
            'id': str(uuid4()),
            'text_dump': 'This is a strategic goal.\n\nWe need to improve Customer Experience.\n\nThe market demands Innovation.',
            'file_url': None,
            'source_meta': {}
        }
    
    @pytest.fixture
    def mock_validation_report(self):
        """Mock validation report."""
        return ValidationReport(
            confidence=0.8,
            dupes=[],
            ontology_hits=['strategy', 'customer'],
            suggested_merges=[],
            warnings=[],
            impact_summary="3 CreateBlock operations; no document impact"
        )
    
    @pytest.mark.asyncio
    async def test_extract_candidates_from_text(self, processor, sample_dump):
        """Test extraction of substrate candidates from text dump."""
        candidates = await processor._extract_candidates(sample_dump)
        
        assert len(candidates) > 0
        
        # Should extract blocks from paragraphs
        block_candidates = [c for c in candidates if c.type == 'block']
        assert len(block_candidates) >= 3  # Three paragraphs
        
        # Should extract context items from capitalized phrases
        context_candidates = [c for c in candidates if c.type == 'context_item']
        assert any('Customer Experience' in c.label for c in context_candidates)
        assert any('Innovation' in c.label for c in context_candidates)
    
    @pytest.mark.asyncio
    async def test_extract_candidates_empty_dump(self, processor):
        """Test extraction from empty dump."""
        empty_dump = {
            'id': str(uuid4()),
            'text_dump': '',
            'file_url': None,
            'source_meta': {}
        }
        
        candidates = await processor._extract_candidates(empty_dump)
        assert len(candidates) == 0
    
    def test_candidates_to_operations(self, processor):
        """Test conversion of candidates to proposal operations."""
        candidates = [
            SubstrateCandidate(
                type='block',
                content='Strategic goal content',
                semantic_type='goal',
                confidence=0.7
            ),
            SubstrateCandidate(
                type='context_item',
                label='Customer Experience',
                content='Customer-focused concept',
                confidence=0.6
            )
        ]
        
        operations = processor._candidates_to_operations(candidates)
        
        assert len(operations) == 2
        assert operations[0].type == 'CreateBlock'
        assert operations[1].type == 'CreateContextItem'
        assert operations[0].data['content'] == 'Strategic goal content'
        assert operations[1].data['label'] == 'Customer Experience'
    
    @patch('src.app.agents.pipeline.governance_processor.supabase')
    @pytest.mark.asyncio
    async def test_create_governance_proposal(self, mock_supabase, processor, mock_validation_report):
        """Test governance proposal creation."""
        basket_id = uuid4()
        workspace_id = uuid4()
        operations = [
            ProposalOperation(
                type='CreateBlock',
                data={'content': 'Test content', 'semantic_type': 'note'}
            )
        ]
        provenance = [uuid4()]
        
        # Mock successful proposal creation
        mock_supabase.table.return_value.insert.return_value.select.return_value.single.return_value.execute.return_value.data = {
            'id': str(uuid4())
        }
        mock_supabase.rpc.return_value.execute.return_value = None
        
        proposal_id = await processor._create_governance_proposal(
            basket_id=basket_id,
            workspace_id=workspace_id,
            operations=operations,
            validation_report=mock_validation_report,
            provenance=provenance
        )
        
        assert isinstance(proposal_id, UUID)
        
        # Verify proposal creation call
        mock_supabase.table.assert_called_with('proposals')
        insert_call = mock_supabase.table.return_value.insert.call_args[0][0]
        assert insert_call['proposal_kind'] == 'Extraction'
        assert insert_call['origin'] == 'agent'
        assert insert_call['blast_radius'] == 'Local'
        
        # Verify timeline event emission
        mock_supabase.rpc.assert_called_with('emit_timeline_event', {
            'p_basket_id': str(basket_id),
            'p_event_type': 'proposal.submitted',
            'p_event_data': {
                'proposal_id': insert_call['id'] if 'id' in insert_call else mock_supabase.table.return_value.insert.return_value.select.return_value.single.return_value.execute.return_value.data['id'],
                'proposal_kind': 'Extraction',
                'origin': 'agent',
                'operations_count': 1
            },
            'p_workspace_id': str(workspace_id),
            'p_actor_id': None
        })
    
    @patch('src.app.agents.pipeline.governance_processor.supabase')
    @pytest.mark.asyncio
    async def test_process_dump_success(self, mock_supabase, processor, sample_dump, mock_validation_report):
        """Test successful dump processing through governance."""
        dump_id = UUID(sample_dump['id'])
        basket_id = uuid4()
        workspace_id = uuid4()
        
        # Mock dump retrieval
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = sample_dump
        
        # Mock proposal creation
        proposal_id = str(uuid4())
        mock_supabase.table.return_value.insert.return_value.select.return_value.single.return_value.execute.return_value.data = {
            'id': proposal_id
        }
        mock_supabase.rpc.return_value.execute.return_value = None
        
        # Mock validator
        processor.validator.validate_proposal = AsyncMock(return_value=mock_validation_report)
        
        result = await processor.process_dump(dump_id, basket_id, workspace_id)
        
        assert result['proposals_created'] == 1
        assert result['proposal_id'] == proposal_id
        assert result['status'] == 'proposal_created'
        assert result['operations_count'] > 0
        assert result['confidence'] == 0.8
    
    @patch('src.app.agents.pipeline.governance_processor.supabase')
    @pytest.mark.asyncio
    async def test_process_dump_no_candidates(self, mock_supabase, processor):
        """Test dump processing with no extractable candidates."""
        empty_dump = {
            'id': str(uuid4()),
            'text_dump': 'a',  # Too short for extraction
            'file_url': None,
            'source_meta': {}
        }
        
        dump_id = UUID(empty_dump['id'])
        basket_id = uuid4()
        workspace_id = uuid4()
        
        # Mock dump retrieval
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = empty_dump
        
        result = await processor.process_dump(dump_id, basket_id, workspace_id)
        
        assert result['proposals_created'] == 0
        assert result['status'] == 'no_candidates'
        assert 'No substrate candidates found' in result['message']
    
    @patch('src.app.agents.pipeline.governance_processor.supabase')
    @pytest.mark.asyncio
    async def test_mark_dump_processed(self, mock_supabase, processor):
        """Test marking dump as processed in queue."""
        dump_id = uuid4()
        proposal_id = uuid4()
        
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = None
        
        await processor._mark_dump_processed(dump_id, proposal_id)
        
        mock_supabase.table.assert_called_with('agent_processing_queue')
        update_call = mock_supabase.table.return_value.update.call_args[0][0]
        assert update_call['processing_state'] == 'processed'
        assert update_call['result_data']['proposal_id'] == str(proposal_id)
        assert update_call['result_data']['governance_flow'] == True
    
    @patch('src.app.agents.pipeline.governance_processor.supabase')
    @pytest.mark.asyncio
    async def test_mark_dump_failed(self, mock_supabase, processor):
        """Test marking dump as failed."""
        dump_id = uuid4()
        error_message = "Extraction failed"
        
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = None
        
        await processor._mark_dump_failed(dump_id, error_message)
        
        mock_supabase.table.assert_called_with('agent_processing_queue')
        update_call = mock_supabase.table.return_value.update.call_args[0][0]
        assert update_call['processing_state'] == 'failed'
        assert update_call['error_message'] == error_message
    
    def test_get_agent_info(self, processor):
        """Test agent information retrieval."""
        info = processor.get_agent_info()
        
        assert info['name'] == 'GovernanceDumpProcessor'
        assert info['pipeline'] == 'P1_SUBSTRATE'
        assert info['type'] == 'processor'
        assert info['status'] == 'active'
        assert 'governed proposals' in info['sacred_rule']