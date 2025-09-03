"""Tests for agent substrate operations service."""

import pytest
from unittest.mock import AsyncMock, patch
from uuid import uuid4

from src.app.agents.services.substrate_ops import (
    AgentSubstrateService,
    AgentSubstrateRequest,
    SubstrateOperationType,
    AgentMemoryOperations
)


class TestAgentSubstrateService:
    """Test agent substrate operations."""
    
    @pytest.mark.asyncio
    async def test_validate_agent_permissions_orch_agent(self):
        """Test that orch agents have correct permissions."""
        # Should allow orch agents to propose blocks
        await AgentSubstrateService._validate_agent_permissions(
            "orch_interpreter", SubstrateOperationType.PROPOSE_BLOCK
        )
        
        # Should allow orch agents to tag context
        await AgentSubstrateService._validate_agent_permissions(
            "orch_interpreter", SubstrateOperationType.TAG_CONTEXT
        )
        
        # Should allow orch agents to analyze memory
        await AgentSubstrateService._validate_agent_permissions(
            "orch_interpreter", SubstrateOperationType.ANALYZE_MEMORY
        )
    
    @pytest.mark.asyncio
    async def test_validate_agent_permissions_infra_agent(self):
        """Test that infra agents have correct permissions."""
        # Should allow infra agents to flag inconsistencies
        await AgentSubstrateService._validate_agent_permissions(
            "infra_observer", SubstrateOperationType.FLAG_INCONSISTENCY
        )
        
        # Should allow infra agents to analyze memory
        await AgentSubstrateService._validate_agent_permissions(
            "infra_observer", SubstrateOperationType.ANALYZE_MEMORY
        )
    
    @pytest.mark.asyncio
    async def test_validate_agent_permissions_tasks_agent(self):
        """Test that tasks agents have correct permissions."""
        # Should allow tasks agents to analyze memory
        await AgentSubstrateService._validate_agent_permissions(
            "tasks_composer", SubstrateOperationType.ANALYZE_MEMORY
        )
        
        # Should allow tasks agents to suggest relationships
        await AgentSubstrateService._validate_agent_permissions(
            "tasks_composer", SubstrateOperationType.SUGGEST_RELATIONSHIP
        )
    
    @pytest.mark.asyncio
    async def test_validate_agent_permissions_invalid_agent(self):
        """Test that invalid agent types are rejected."""
        with pytest.raises(ValueError, match="Invalid agent type"):
            await AgentSubstrateService._validate_agent_permissions(
                "invalid_agent", SubstrateOperationType.PROPOSE_BLOCK
            )
    
    @pytest.mark.asyncio
    async def test_validate_agent_permissions_unauthorized_operation(self):
        """Test that unauthorized operations are rejected."""
        with pytest.raises(ValueError, match="not permitted"):
            await AgentSubstrateService._validate_agent_permissions(
                "tasks_composer", SubstrateOperationType.PROPOSE_BLOCK
            )
    
    @patch('src.app.agents.services.substrate_ops.BlockProposalService.propose_block')
    @pytest.mark.asyncio
    async def test_handle_propose_block(self, mock_propose_block):
        """Test block proposal operation handling."""
        basket_id = uuid4()
        mock_propose_block.return_value = {"id": str(uuid4()), "state": "PROPOSED"}
        
        request = AgentSubstrateRequest(
            operation_type=SubstrateOperationType.PROPOSE_BLOCK,
            agent_id="test-agent",
            agent_type="orch_interpreter",
            parameters={
                "basket_id": str(basket_id),
                "semantic_type": "insight",
                "content": "Test insight content"
            }
        )
        
        result = await AgentSubstrateService._handle_propose_block(request, "test-workspace")
        
        assert len(result["created_objects"]) == 1
        assert "block_id" in result
        mock_propose_block.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_handle_propose_block_missing_parameters(self):
        """Test block proposal with missing parameters."""
        request = AgentSubstrateRequest(
            operation_type=SubstrateOperationType.PROPOSE_BLOCK,
            agent_id="test-agent",
            agent_type="orch_interpreter",
            parameters={"basket_id": str(uuid4())}  # Missing semantic_type and content
        )
        
        with pytest.raises(ValueError, match="Missing required parameter"):
            await AgentSubstrateService._handle_propose_block(request, "test-workspace")
    
    @patch('src.app.agents.services.substrate_ops.supabase')
    @pytest.mark.asyncio
    async def test_handle_flag_inconsistency(self, mock_supabase):
        """Test inconsistency flagging operation."""
        mock_supabase.table.return_value.insert.return_value.execute.return_value = None
        
        request = AgentSubstrateRequest(
            operation_type=SubstrateOperationType.FLAG_INCONSISTENCY,
            agent_id="test-agent",
            agent_type="infra_observer",
            target_id=uuid4(),
            parameters={
                "basket_id": str(uuid4()),
                "inconsistency_type": "contradiction",
                "description": "Contradictory statements found",
                "severity": "high"
            },
            reasoning="Detected via content analysis"
        )
        
        result = await AgentSubstrateService._handle_flag_inconsistency(request, "test-workspace")
        
        assert "flag_event_id" in result
        assert len(result["audit_events"]) > 0
        mock_supabase.table.return_value.insert.assert_called_once()
    
    @patch('src.app.agents.services.substrate_ops.supabase')
    @pytest.mark.asyncio
    async def test_perform_memory_analysis(self, mock_supabase):
        """Test memory analysis functionality."""
        basket_id = uuid4()
        
        # Mock blocks data with structured ingredients
        mock_blocks = [
            {"id": str(uuid4()), "state": "PROPOSED", "semantic_type": "goal", "content": "Test goal", "metadata": {"knowledge_ingredients": {"goals": [{"title": "Test goal"}], "constraints": [], "metrics": [], "entities": []}}},
            {"id": str(uuid4()), "state": "ACCEPTED", "semantic_type": "insight", "content": "Test insight", "metadata": {"knowledge_ingredients": {"goals": [], "constraints": [], "metrics": [{"name": "Test metric"}], "entities": []}}},
            {"id": str(uuid4()), "state": "LOCKED", "semantic_type": "constraint", "content": "Test constraint", "metadata": {"knowledge_ingredients": {"goals": [], "constraints": [{"title": "Test constraint"}], "metrics": [], "entities": []}}}
        ]
        
        # Mock context items
        mock_context = [
            {"id": str(uuid4()), "block_id": mock_blocks[0]["id"], "type": "goal"}
        ]
        
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = mock_blocks
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = mock_context
        
        analysis = await AgentSubstrateService._perform_memory_analysis(basket_id, "test-workspace")
        
        assert analysis.basket_id == basket_id
        assert analysis.total_blocks == 3
        assert "PROPOSED" in analysis.blocks_by_state
        assert "ACCEPTED" in analysis.blocks_by_state
        assert "LOCKED" in analysis.blocks_by_state
        assert analysis.context_coverage > 0.0  # Should have some context coverage
        
    @patch('src.app.agents.services.substrate_ops.AgentSubstrateService._validate_agent_permissions')
    @patch('src.app.agents.services.substrate_ops.AgentSubstrateService._handle_propose_block')
    @patch('src.app.agents.services.substrate_ops.AgentSubstrateService._log_substrate_operation')
    @pytest.mark.asyncio
    async def test_execute_operation_success(self, mock_log, mock_handle, mock_validate):
        """Test successful operation execution."""
        mock_validate.return_value = None
        mock_handle.return_value = {"created_objects": [{"id": "test"}], "audit_events": []}
        mock_log.return_value = None
        
        request = AgentSubstrateRequest(
            operation_type=SubstrateOperationType.PROPOSE_BLOCK,
            agent_id="test-agent",
            agent_type="orch_interpreter",
            parameters={"test": "data"}
        )
        
        result = await AgentSubstrateService.execute_operation(request, "test-workspace")
        
        assert result.success == True
        assert len(result.created_objects) > 0
        mock_validate.assert_called_once()
        mock_handle.assert_called_once()
        mock_log.assert_called_once()
    
    @patch('src.app.agents.services.substrate_ops.AgentSubstrateService._validate_agent_permissions')
    @pytest.mark.asyncio
    async def test_execute_operation_validation_failure(self, mock_validate):
        """Test operation execution with validation failure."""
        mock_validate.side_effect = ValueError("Invalid agent type")
        
        request = AgentSubstrateRequest(
            operation_type=SubstrateOperationType.PROPOSE_BLOCK,
            agent_id="test-agent",
            agent_type="invalid_agent",
            parameters={}
        )
        
        result = await AgentSubstrateService.execute_operation(request, "test-workspace")
        
        assert result.success == False
        assert "Invalid agent type" in result.error_message


class TestAgentMemoryOperations:
    """Test convenience functions for agent memory operations."""
    
    @patch('src.app.agents.services.substrate_ops.AgentSubstrateService.execute_operation')
    @pytest.mark.asyncio
    async def test_quick_propose_block(self, mock_execute):
        """Test quick block proposal function."""
        mock_execute.return_value.success = True
        mock_execute.return_value.result_data = {"block_id": str(uuid4())}
        
        result = await AgentMemoryOperations.quick_propose_block(
            basket_id=uuid4(),
            content="Test content",
            agent_id="test-agent",
            workspace_id="test-workspace"
        )
        
        assert mock_execute.called
        
    @patch('src.app.agents.services.substrate_ops.AgentSubstrateService.execute_operation')
    @pytest.mark.asyncio
    async def test_quick_tag_context(self, mock_execute):
        """Test quick context tagging function."""
        mock_execute.return_value.success = True
        mock_execute.return_value.result_data = {"context_item_id": str(uuid4())}
        
        result = await AgentMemoryOperations.quick_tag_context(
            target_id=uuid4(),
            target_type="block",
            context_type="theme",
            content="Test theme",
            agent_id="test-agent",
            workspace_id="test-workspace"
        )
        
        assert mock_execute.called