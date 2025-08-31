"""Updated tests for agent substrate operations with governance workflow."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from uuid import uuid4

from src.app.agents.services.substrate_ops import (
    AgentSubstrateService,
    AgentSubstrateRequest,
    SubstrateOperationType,
    AgentMemoryOperations
)


class TestAgentSubstrateServiceGovernance:
    """Test agent substrate operations in governance mode."""
    
    @pytest.fixture
    def mock_governance_enabled(self):
        """Mock governance as enabled."""
        with patch('src.lib.governance.featureFlags.shouldUseGovernance', return_value=True), \
             patch('src.lib.governance.featureFlags.isValidatorRequired', return_value=True):
            yield
    
    @pytest.fixture
    def mock_governance_disabled(self):
        """Mock governance as disabled (legacy mode)."""
        with patch('src.lib.governance.featureFlags.shouldUseGovernance', return_value=False), \
             patch('src.lib.governance.featureFlags.allowDirectSubstrateWrites', return_value=True):
            yield
    
    @pytest.mark.asyncio
    async def test_propose_block_creates_governance_proposal(self, mock_governance_enabled):
        """Test that block proposals create governance proposals when governance enabled."""
        with patch('src.app.agents.services.substrate_ops.supabase') as mock_supabase:
            # Mock proposal creation instead of direct block creation
            mock_supabase.table.return_value.insert.return_value.select.return_value.single.return_value.execute.return_value.data = {
                'id': str(uuid4()),
                'status': 'PROPOSED'
            }
            
            request = AgentSubstrateRequest(
                operation_type=SubstrateOperationType.PROPOSE_BLOCK,
                agent_id="test-agent",
                agent_type="orch_interpreter",
                parameters={
                    "basket_id": str(uuid4()),
                    "semantic_type": "insight",
                    "content": "Test insight content"
                }
            )
            
            result = await AgentSubstrateService._handle_propose_block_governance(request, "test-workspace")
            
            # Should create proposal, not direct block
            assert "proposal_id" in result
            assert result.get("governance_flow") == True
            
            # Verify proposal creation was called
            mock_supabase.table.assert_called_with('proposals')
    
    @pytest.mark.asyncio
    async def test_propose_block_legacy_mode(self, mock_governance_disabled):
        """Test that block proposals work in legacy mode when governance disabled."""
        with patch('src.app.agents.services.substrate_ops.BlockProposalService.propose_block') as mock_propose:
            mock_propose.return_value = {"id": str(uuid4()), "state": "PROPOSED"}
            
            request = AgentSubstrateRequest(
                operation_type=SubstrateOperationType.PROPOSE_BLOCK,
                agent_id="test-agent",
                agent_type="orch_interpreter",
                parameters={
                    "basket_id": str(uuid4()),
                    "semantic_type": "insight",
                    "content": "Test insight content"
                }
            )
            
            result = await AgentSubstrateService._handle_propose_block(request, "test-workspace")
            
            # Should create block directly in legacy mode
            assert "block_id" in result
            assert len(result["created_objects"]) == 1
            mock_propose.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_context_tagging_through_governance(self, mock_governance_enabled):
        """Test context tagging creates governance proposals."""
        with patch('src.app.agents.services.substrate_ops.supabase') as mock_supabase:
            mock_supabase.table.return_value.insert.return_value.select.return_value.single.return_value.execute.return_value.data = {
                'id': str(uuid4()),
                'status': 'PROPOSED'
            }
            
            request = AgentSubstrateRequest(
                operation_type=SubstrateOperationType.TAG_CONTEXT,
                agent_id="test-agent",
                agent_type="orch_interpreter",
                target_id=uuid4(),
                parameters={
                    "basket_id": str(uuid4()),
                    "context_type": "theme",
                    "content": "Strategic theme"
                }
            )
            
            result = await AgentSubstrateService._handle_tag_context_governance(request, "test-workspace")
            
            assert "proposal_id" in result
            assert result.get("governance_flow") == True
    
    @pytest.mark.asyncio
    async def test_agent_permission_validation_governance(self, mock_governance_enabled):
        """Test agent permissions are still validated in governance mode."""
        # Invalid agent type should still be rejected
        with pytest.raises(ValueError, match="Invalid agent type"):
            await AgentSubstrateService._validate_agent_permissions(
                "invalid_agent", SubstrateOperationType.PROPOSE_BLOCK
            )
        
        # Unauthorized operations should still be rejected
        with pytest.raises(ValueError, match="not permitted"):
            await AgentSubstrateService._validate_agent_permissions(
                "tasks_composer", SubstrateOperationType.PROPOSE_BLOCK
            )
    
    @pytest.mark.asyncio
    async def test_memory_analysis_includes_proposals(self, mock_governance_enabled):
        """Test memory analysis includes proposal data in governance mode."""
        with patch('src.app.agents.services.substrate_ops.supabase') as mock_supabase:
            basket_id = uuid4()
            
            # Mock blocks, context items, and proposals
            mock_blocks = [
                {"id": str(uuid4()), "state": "ACCEPTED", "semantic_type": "goal"}
            ]
            mock_context = [
                {"id": str(uuid4()), "type": "theme", "state": "ACTIVE"}
            ]
            mock_proposals = [
                {"id": str(uuid4()), "status": "PROPOSED", "proposal_kind": "Extraction"}
            ]
            
            # Mock database responses
            def mock_table_response(table_name):
                if table_name == 'context_blocks':
                    return MagicMock(data=mock_blocks)
                elif table_name == 'context_items':
                    return MagicMock(data=mock_context)
                elif table_name == 'proposals':
                    return MagicMock(data=mock_proposals)
                return MagicMock(data=[])
            
            mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute = lambda: mock_table_response('context_blocks')
            
            analysis = await AgentSubstrateService._perform_memory_analysis_governance(basket_id, "test-workspace")
            
            assert analysis.basket_id == basket_id
            assert analysis.total_blocks >= 1
            # Should include governance metrics
            assert hasattr(analysis, 'pending_proposals') or 'proposals' in str(analysis)
    
    @patch('src.app.agents.services.substrate_ops.AgentSubstrateService._validate_agent_permissions')
    @patch('src.app.agents.services.substrate_ops.AgentSubstrateService._handle_propose_block_governance')
    @patch('src.app.agents.services.substrate_ops.AgentSubstrateService._log_substrate_operation')
    @pytest.mark.asyncio
    async def test_execute_operation_governance_mode(self, mock_log, mock_handle, mock_validate, mock_governance_enabled):
        """Test operation execution in governance mode."""
        mock_validate.return_value = None
        mock_handle.return_value = {
            "proposal_id": str(uuid4()),
            "governance_flow": True,
            "created_objects": [],
            "audit_events": []
        }
        mock_log.return_value = None
        
        request = AgentSubstrateRequest(
            operation_type=SubstrateOperationType.PROPOSE_BLOCK,
            agent_id="test-agent",
            agent_type="orch_interpreter",
            parameters={"test": "data"}
        )
        
        result = await AgentSubstrateService.execute_operation_governance(request, "test-workspace")
        
        assert result.success == True
        assert "proposal_id" in result.result_data
        assert result.result_data.get("governance_flow") == True
        
        mock_validate.assert_called_once()
        mock_handle.assert_called_once()
        mock_log.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_quick_operations_governance_wrapper(self, mock_governance_enabled):
        """Test quick operation wrappers work with governance."""
        with patch('src.app.agents.services.substrate_ops.AgentSubstrateService.execute_operation_governance') as mock_execute:
            mock_execute.return_value.success = True
            mock_execute.return_value.result_data = {"proposal_id": str(uuid4())}
            
            # Test quick block proposal
            result = await AgentMemoryOperations.quick_propose_block_governance(
                basket_id=uuid4(),
                content="Test content",
                agent_id="test-agent",
                workspace_id="test-workspace"
            )
            
            assert mock_execute.called
            
            # Test quick context tagging
            result = await AgentMemoryOperations.quick_tag_context_governance(
                target_id=uuid4(),
                target_type="block",
                context_type="theme",
                content="Test theme",
                agent_id="test-agent",
                workspace_id="test-workspace"
            )
            
            assert mock_execute.called


class TestGovernanceFeatureFlags:
    """Test governance feature flag behavior."""
    
    def test_governance_status_reporting(self):
        """Test governance status reporting for monitoring."""
        with patch('src.lib.governance.featureFlags.getGovernanceFlags') as mock_flags:
            mock_flags.return_value = {
                'governance_enabled': True,
                'validator_required': True,
                'direct_substrate_writes': False,
                'governance_ui_enabled': True,
                'cascade_events_enabled': True
            }
            
            from src.lib.governance.featureFlags import getGovernanceStatus
            status = getGovernanceStatus()
            
            assert status['status'] == 'full'
            assert status['description'] == 'Full governance - all substrate writes governed'
    
    def test_governance_gradual_migration_flags(self):
        """Test governance flags support gradual migration."""
        # Test various deployment scenarios
        scenarios = [
            # Disabled
            {'governance_enabled': False, 'expected_status': 'disabled'},
            # Testing
            {'governance_enabled': True, 'governance_ui_enabled': False, 'expected_status': 'testing'},
            # Partial
            {'governance_enabled': True, 'governance_ui_enabled': True, 'direct_substrate_writes': True, 'expected_status': 'partial'},
            # Full
            {'governance_enabled': True, 'validator_required': True, 'direct_substrate_writes': False, 'expected_status': 'full'}
        ]
        
        for scenario in scenarios:
            with patch('src.lib.governance.featureFlags.getGovernanceFlags') as mock_flags:
                flags = {
                    'governance_enabled': False,
                    'validator_required': False,
                    'direct_substrate_writes': True,
                    'governance_ui_enabled': False,
                    'cascade_events_enabled': True
                }
                flags.update(scenario)
                mock_flags.return_value = flags
                
                from src.lib.governance.featureFlags import getGovernanceStatus
                status = getGovernanceStatus()
                
                assert status['status'] == scenario['expected_status']