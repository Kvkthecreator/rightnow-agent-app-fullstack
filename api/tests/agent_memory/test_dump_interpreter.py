"""Tests for agent dump interpretation service."""

import pytest
from unittest.mock import AsyncMock, patch
from uuid import uuid4

from src.app.agents.services.dump_interpreter import (
    DumpInterpreterService,
    RawDumpInterpretationRequest,
    InterpretedBlock
)


class TestDumpInterpreterService:
    """Test raw dump interpretation functionality."""
    
    @patch('src.app.agents.services.dump_interpreter.supabase')
    @patch('src.app.agents.services.dump_interpreter.BlockProposalService.propose_block')
    @pytest.mark.asyncio
    async def test_interpret_dump_success(self, mock_propose_block, mock_supabase):
        """Test successful dump interpretation."""
        raw_dump_id = uuid4()
        basket_id = uuid4()
        workspace_id = "test-workspace"
        
        # Mock supabase responses
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.maybe_single.return_value.execute.return_value.data = {
            "id": str(raw_dump_id),
            "body_md": "I want to build a better user experience for mobile users. The current design is too complex.",
            "basket_id": str(basket_id),
            "workspace_id": workspace_id
        }
        
        mock_propose_block.return_value = {"id": str(uuid4()), "state": "PROPOSED"}
        mock_supabase.table.return_value.insert.return_value.execute.return_value = None
        
        # Create request
        request = RawDumpInterpretationRequest(
            raw_dump_id=raw_dump_id,
            interpretation_prompt="Extract key insights",
            max_blocks=5,
            agent_id="test-agent"
        )
        
        # Run interpretation
        result = await DumpInterpreterService.interpret_dump(request, workspace_id)
        
        # Verify results
        assert result.raw_dump_id == raw_dump_id
        assert len(result.proposed_blocks) > 0
        assert result.agent_confidence > 0.0
        assert "interpreted" in result.interpretation_summary.lower()
        
        # Verify block proposal was called
        assert mock_propose_block.called
        
    def test_analyze_content_goal_detection(self):
        """Test content analysis detects goals correctly."""
        content = "I want to improve user engagement. My goal is to increase retention by 20%."
        
        blocks = DumpInterpreterService._analyze_content(content)
        
        # Should detect goal-oriented content
        goal_blocks = [b for b in blocks if b.semantic_type == "goal"]
        assert len(goal_blocks) > 0
        assert any("goal" in block.content.lower() for block in goal_blocks)
        
    def test_analyze_content_insight_detection(self):
        """Test content analysis detects insights correctly."""
        content = "The key insight is that users prefer simple interfaces. This concept could revolutionize our approach."
        
        blocks = DumpInterpreterService._analyze_content(content)
        
        # Should detect insights
        insight_blocks = [b for b in blocks if b.semantic_type == "insight"]
        assert len(insight_blocks) > 0
        assert any("insight" in block.content.lower() for block in insight_blocks)
        
    def test_analyze_content_audience_detection(self):
        """Test content analysis detects audience references."""
        content = "Our users are primarily mobile-first millennials. The customer base includes tech-savvy professionals."
        
        blocks = DumpInterpreterService._analyze_content(content)
        
        # Should detect audience references
        audience_blocks = [b for b in blocks if b.semantic_type == "audience"]
        assert len(audience_blocks) > 0
        
    def test_analyze_content_constraint_detection(self):
        """Test content analysis detects constraints and problems."""
        content = "The main problem is slow loading times. We face technical limitations with the current architecture."
        
        blocks = DumpInterpreterService._analyze_content(content)
        
        # Should detect constraints/problems
        constraint_blocks = [b for b in blocks if b.semantic_type == "constraint"]
        assert len(constraint_blocks) > 0
        
    @pytest.mark.asyncio
    async def test_interpret_dump_empty_content(self):
        """Test handling of empty dump content."""
        raw_dump_id = uuid4()
        workspace_id = "test-workspace"
        
        with patch('src.app.agents.services.dump_interpreter.supabase') as mock_supabase:
            mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.maybe_single.return_value.execute.return_value.data = {
                "id": str(raw_dump_id),
                "body_md": "",  # Empty content
                "basket_id": str(uuid4()),
                "workspace_id": workspace_id
            }
            
            request = RawDumpInterpretationRequest(
                raw_dump_id=raw_dump_id,
                max_blocks=5,
                agent_id="test-agent"
            )
            
            with pytest.raises(ValueError, match="no content to interpret"):
                await DumpInterpreterService.interpret_dump(request, workspace_id)
    
    @pytest.mark.asyncio
    async def test_interpret_dump_not_found(self):
        """Test handling of non-existent dump."""
        raw_dump_id = uuid4()
        workspace_id = "test-workspace"
        
        with patch('src.app.agents.services.dump_interpreter.supabase') as mock_supabase:
            mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.maybe_single.return_value.execute.return_value.data = None
            
            request = RawDumpInterpretationRequest(
                raw_dump_id=raw_dump_id,
                max_blocks=5,
                agent_id="test-agent"
            )
            
            with pytest.raises(ValueError, match="not found"):
                await DumpInterpreterService.interpret_dump(request, workspace_id)
    
    def test_block_confidence_sorting(self):
        """Test that blocks are sorted by confidence."""
        content = "I want to build something. The main problem is complexity. Users need simple solutions."
        
        blocks = DumpInterpreterService._analyze_content(content)
        
        # Blocks should be sorted by confidence (highest first)
        if len(blocks) > 1:
            for i in range(len(blocks) - 1):
                assert blocks[i].confidence >= blocks[i + 1].confidence
                
    def test_max_blocks_limit(self):
        """Test that analysis respects max blocks limit."""
        # Create content that would generate many blocks
        content = " ".join([f"Goal {i}: achieve objective {i}." for i in range(30)])
        
        blocks = DumpInterpreterService._analyze_content(content)
        
        # Should be limited to prevent excessive blocks
        assert len(blocks) <= 20  # Internal limit in _analyze_content