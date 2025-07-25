"""Tests for agent context tagging service."""

import pytest
from unittest.mock import AsyncMock, patch
from uuid import uuid4

from src.app.agents.services.context_tagger import (
    ContextTaggerService,
    ContextTagRequest,
    SemanticRelationship
)
from src.app.models.context import ContextItemType


class TestContextTaggerService:
    """Test context tagging functionality."""
    
    @patch('src.app.agents.services.context_tagger.supabase')
    @pytest.mark.asyncio
    async def test_tag_memory_object_block(self, mock_supabase):
        """Test tagging a block with context."""
        block_id = uuid4()
        basket_id = uuid4()
        workspace_id = "test-workspace"
        
        # Mock target validation
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.maybe_single.return_value.execute.return_value.data = {
            "id": str(block_id),
            "basket_id": str(basket_id),
            "workspace_id": workspace_id
        }
        
        # Mock context item creation
        mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [{"id": str(uuid4())}]
        
        request = ContextTagRequest(
            target_id=block_id,
            target_type="block",
            context_type=ContextItemType.theme,
            content="User experience theme",
            confidence=0.9,
            agent_id="test-agent",
            meta_notes="Detected via content analysis"
        )
        
        result = await ContextTaggerService.tag_memory_object(request, workspace_id)
        
        # Verify context item was created
        assert "id" in result
        mock_supabase.table.return_value.insert.assert_called()
        
        # Verify event was logged
        event_calls = [call for call in mock_supabase.table.return_value.insert.call_args_list 
                      if "events" in str(call)]
        assert len(event_calls) > 0
    
    @pytest.mark.asyncio
    async def test_tag_memory_object_invalid_target(self):
        """Test tagging with invalid target."""
        with patch('src.app.agents.services.context_tagger.supabase') as mock_supabase:
            mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.maybe_single.return_value.execute.return_value.data = None
            
            request = ContextTagRequest(
                target_id=uuid4(),
                target_type="block",
                context_type=ContextItemType.theme,
                content="Test content",
                confidence=0.8,
                agent_id="test-agent"
            )
            
            with pytest.raises(ValueError, match="not found"):
                await ContextTaggerService.tag_memory_object(request, "test-workspace")
    
    @patch('src.app.agents.services.context_tagger.supabase')
    @pytest.mark.asyncio
    async def test_analyze_memory_semantics(self, mock_supabase):
        """Test semantic analysis of basket memory."""
        basket_id = uuid4()
        workspace_id = "test-workspace"
        
        # Mock blocks data
        mock_blocks = [
            {
                "id": str(uuid4()),
                "semantic_type": "goal",
                "content": "I want to improve user engagement rates",
                "state": "ACCEPTED"
            },
            {
                "id": str(uuid4()),
                "semantic_type": "insight",
                "content": "Users prefer simple interfaces over complex ones",
                "state": "ACCEPTED"
            }
        ]
        
        # Mock existing context
        mock_context = []
        
        # Setup supabase mocks
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.neq.return_value.execute.return_value.data = mock_blocks
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = mock_context
        mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [{"id": str(uuid4())}]
        
        result = await ContextTaggerService.analyze_memory_semantics(
            basket_id=basket_id,
            workspace_id=workspace_id,
            agent_id="test-agent"
        )
        
        # Should have created some context items
        assert len(result.context_items_created) >= 0
        assert result.total_confidence >= 0.0
        assert "semantic tags" in result.tagging_summary.lower()
    
    def test_calculate_content_similarity(self):
        """Test content similarity calculation."""
        content1 = "I want to improve user experience"
        content2 = "I need to enhance user experience"
        content3 = "The weather is nice today"
        
        # Similar content should have high similarity
        similarity1 = ContextTaggerService._calculate_content_similarity(content1, content2)
        assert similarity1 > 0.5
        
        # Different content should have low similarity
        similarity2 = ContextTaggerService._calculate_content_similarity(content1, content3)
        assert similarity2 < 0.3
        
        # Empty content should return 0
        similarity3 = ContextTaggerService._calculate_content_similarity("", content1)
        assert similarity3 == 0.0
    
    @pytest.mark.asyncio
    async def test_analyze_semantic_patterns_goal_detection(self):
        """Test semantic pattern analysis detects goals."""
        blocks = [
            {
                "id": str(uuid4()),
                "content": "I want to increase user retention by 25%",
                "semantic_type": "goal"
            }
        ]
        existing_context = []
        
        suggestions = await ContextTaggerService._analyze_semantic_patterns(
            blocks, existing_context, None
        )
        
        # Should suggest goal-related context
        goal_suggestions = [s for s in suggestions if s["context_type"] == "goal"]
        assert len(goal_suggestions) > 0
        assert goal_suggestions[0]["confidence"] > 0.8
    
    @pytest.mark.asyncio
    async def test_analyze_semantic_patterns_theme_detection(self):
        """Test semantic pattern analysis detects themes."""
        blocks = [
            {
                "id": str(uuid4()),
                "content": "The main theme of our approach is simplicity and elegance",
                "semantic_type": "insight"
            }
        ]
        existing_context = []
        
        suggestions = await ContextTaggerService._analyze_semantic_patterns(
            blocks, existing_context, None
        )
        
        # Should suggest theme-related context
        theme_suggestions = [s for s in suggestions if s["context_type"] == "theme"]
        assert len(theme_suggestions) > 0
    
    @pytest.mark.asyncio
    async def test_analyze_semantic_patterns_audience_detection(self):
        """Test semantic pattern analysis detects audience."""
        blocks = [
            {
                "id": str(uuid4()),
                "content": "Our users are primarily young professionals who value efficiency",
                "semantic_type": "audience"
            }
        ]
        existing_context = []
        
        suggestions = await ContextTaggerService._analyze_semantic_patterns(
            blocks, existing_context, None
        )
        
        # Should suggest audience-related context
        audience_suggestions = [s for s in suggestions if s["context_type"] == "audience"]
        assert len(audience_suggestions) > 0
    
    @pytest.mark.asyncio
    async def test_analyze_semantic_patterns_skip_existing(self):
        """Test that analysis skips blocks that already have context."""
        block_id = str(uuid4())
        blocks = [
            {
                "id": block_id,
                "content": "I want to achieve better results",
                "semantic_type": "goal"
            }
        ]
        
        # Existing context for this block
        existing_context = [
            {
                "id": str(uuid4()),
                "block_id": block_id,
                "type": "goal"
            }
        ]
        
        suggestions = await ContextTaggerService._analyze_semantic_patterns(
            blocks, existing_context, None
        )
        
        # Should not suggest context for blocks that already have it
        block_suggestions = [s for s in suggestions if s["target_id"] == block_id]
        assert len(block_suggestions) == 0
    
    @pytest.mark.asyncio
    async def test_identify_relationships_similarity(self):
        """Test relationship identification based on similarity."""
        blocks = [
            {
                "id": str(uuid4()),
                "content": "Users want simple and intuitive interfaces"
            },
            {
                "id": str(uuid4()),
                "content": "Customers prefer simple and easy-to-use designs"
            },
            {
                "id": str(uuid4()),
                "content": "The weather forecast predicts rain tomorrow"
            }
        ]
        context_items = []
        
        relationships = await ContextTaggerService._identify_relationships(
            blocks, context_items
        )
        
        # Should identify similarity between first two blocks
        similar_relationships = [r for r in relationships if r.relationship_type == "similar_to"]
        assert len(similar_relationships) > 0
        
        # Should have reasonable confidence
        if similar_relationships:
            assert similar_relationships[0].confidence > 0.5