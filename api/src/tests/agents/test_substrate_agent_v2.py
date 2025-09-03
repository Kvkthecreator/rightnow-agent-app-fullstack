"""
Tests for P1 Substrate Agent v2 - Concrete LLM Implementation

Tests structured knowledge extraction with provenance tracking and schema validation.
"""

import pytest
import json
from unittest.mock import patch, MagicMock, AsyncMock
from uuid import uuid4

from app.agents.pipeline.substrate_agent_v2 import P1SubstrateAgentV2
from app.schemas.knowledge_extraction import KnowledgeBlockList, KnowledgeBlock, Provenance, ProvenanceSpan


class TestP1SubstrateAgentV2:
    """Test concrete LLM implementation for structured knowledge extraction."""
    
    @pytest.fixture
    def mock_openai_response(self):
        """Mock OpenAI Structured Outputs response."""
        return {
            "blocks": [
                {
                    "semantic_type": "goal",
                    "title": "Improve User Experience",
                    "entities": [
                        {
                            "name": "User Experience",
                            "type": "concept",
                            "description": "Overall satisfaction with the product",
                            "confidence": 0.9,
                            "provenance": {
                                "dump_id": "test-dump-id",
                                "ranges": [{"start": 0, "end": 25, "text": "Improve User Experience"}],
                                "extraction_method": "llm_structured_extraction",
                                "confidence": 0.9
                            }
                        }
                    ],
                    "goals": [
                        {
                            "title": "Improve User Experience",
                            "description": "Make the product more intuitive and user-friendly",
                            "success_criteria": ["Increase satisfaction scores", "Reduce support tickets"],
                            "confidence": 0.9,
                            "provenance": {
                                "dump_id": "test-dump-id",
                                "ranges": [{"start": 0, "end": 25, "text": "Improve User Experience"}],
                                "extraction_method": "llm_structured_extraction",
                                "confidence": 0.9
                            }
                        }
                    ],
                    "constraints": [],
                    "metrics": [],
                    "primary_theme": "user experience improvement",
                    "confidence": 0.9,
                    "provenance": {
                        "dump_id": "test-dump-id",
                        "ranges": [{"start": 0, "end": 100, "text": "Sample text about improving user experience"}],
                        "extraction_method": "llm_structured_extraction",
                        "confidence": 0.9
                    }
                }
            ],
            "extraction_metadata": {
                "confidence": 0.9,
                "processing_time": 1234
            }
        }
    
    @pytest.fixture
    def agent(self):
        """Create agent with mocked OpenAI client."""
        with patch('app.agents.pipeline.substrate_agent_v2.os.getenv') as mock_getenv:
            mock_getenv.side_effect = lambda key, default=None: {
                'OPENAI_API_KEY': 'test-key',
                'LLM_MODEL_P1': 'gpt-4o-mini',
                'LLM_TEMP_P1': '0.0',
                'LLM_MAXTOK_P1': '3000',
                'LLM_SEED_P1': '1'
            }.get(key, default)
            
            return P1SubstrateAgentV2()
    
    def test_initialization_requires_api_key(self):
        """Test that agent initialization requires OPENAI_API_KEY."""
        with patch('app.agents.pipeline.substrate_agent_v2.os.getenv') as mock_getenv:
            mock_getenv.return_value = None  # No API key
            
            with pytest.raises(RuntimeError, match="OPENAI_API_KEY not set"):
                P1SubstrateAgentV2()
    
    def test_response_format_schema(self, agent):
        """Test Structured Outputs schema generation."""
        schema = agent._response_format_schema()
        
        assert schema["type"] == "json_schema"
        assert "json_schema" in schema
        assert schema["json_schema"]["name"] == "knowledge_blocks"
        assert "schema" in schema["json_schema"]
        
        # Verify it matches our KnowledgeBlockList schema
        expected_schema = KnowledgeBlockList.model_json_schema()
        assert schema["json_schema"]["schema"] == expected_schema
    
    @pytest.mark.asyncio
    async def test_extract_with_llm_success(self, agent, mock_openai_response):
        """Test successful LLM extraction with provenance validation."""
        with patch.object(agent, '_client') as mock_client:
            mock_resp = MagicMock()
            mock_resp.choices = [MagicMock()]
            mock_resp.choices[0].message.content = json.dumps(mock_openai_response)
            
            mock_client.return_value.chat.completions.create.return_value = mock_resp
            
            result = await agent._extract_with_llm("Test content", "test-dump-id")
            
            assert "blocks" in result
            assert len(result["blocks"]) == 1
            assert result["blocks"][0]["title"] == "Improve User Experience"
            assert result["blocks"][0]["provenance"]["dump_id"] == "test-dump-id"
            assert len(result["blocks"][0]["provenance"]["ranges"]) > 0
    
    @pytest.mark.asyncio
    async def test_extract_with_llm_provenance_validation_failure(self, agent):
        """Test that extraction fails when provenance is missing or invalid."""
        invalid_response = {
            "blocks": [
                {
                    "semantic_type": "goal",
                    "title": "Test Goal",
                    "entities": [],
                    "goals": [],
                    "constraints": [],
                    "metrics": [],
                    "confidence": 0.8,
                    "provenance": {
                        "dump_id": "wrong-dump-id",  # Mismatch
                        "ranges": [],  # Empty ranges
                        "extraction_method": "llm_structured_extraction",
                        "confidence": 0.8
                    }
                }
            ]
        }
        
        with patch.object(agent, '_client') as mock_client:
            mock_resp = MagicMock()
            mock_resp.choices = [MagicMock()]
            mock_resp.choices[0].message.content = json.dumps(invalid_response)
            
            mock_client.return_value.chat.completions.create.return_value = mock_resp
            
            with pytest.raises(ValueError, match="Provenance missing or dump_id mismatch"):
                await agent._extract_with_llm("Test content", "test-dump-id")
    
    @pytest.mark.asyncio
    async def test_extract_with_llm_retry_logic(self, agent):
        """Test retry/backoff logic on failures."""
        with patch.object(agent, '_client') as mock_client:
            # First 3 attempts fail, 4th succeeds
            mock_client.return_value.chat.completions.create.side_effect = [
                Exception("Rate limit"),
                Exception("Rate limit"),
                Exception("Rate limit"),
                MagicMock(choices=[MagicMock(message=MagicMock(content='{"blocks": [], "extraction_metadata": {}}'))])
            ]
            
            with patch('app.agents.pipeline.substrate_agent_v2.time.sleep'):  # Speed up test
                result = await agent._extract_with_llm("Test content", "test-dump-id")
                
            assert "blocks" in result
            # Should have called create 4 times (3 failures + 1 success)
            assert mock_client.return_value.chat.completions.create.call_count == 4
    
    def test_transform_knowledge_blocks(self, agent):
        """Test transformation of LLM output to database format."""
        knowledge_blocks = [
            {
                "semantic_type": "goal",
                "title": "Test Goal",
                "entities": [{"name": "Test Entity", "type": "concept"}],
                "goals": [{"title": "Test Goal", "description": "Test description"}],
                "confidence": 0.8
            }
        ]
        
        result = agent._transform_knowledge_blocks(knowledge_blocks, uuid4(), 5)
        
        assert len(result) == 1
        block = result[0]
        
        # Check database format
        assert block["semantic_type"] == "goal"
        assert block["title"] == "Test Goal"
        assert block["confidence"] == 0.8
        assert "content" in block  # Legacy content
        assert "metadata" in block
        
        # Check structured ingredients in metadata
        metadata = block["metadata"]
        assert metadata["extraction_method"] == "llm_structured_v2"
        assert metadata["provenance_validated"] is True
        assert "knowledge_ingredients" in metadata
        assert metadata["knowledge_ingredients"] == knowledge_blocks[0]
    
    def test_generate_legacy_content_from_block(self, agent):
        """Test generation of backward-compatible text content."""
        kb = {
            "title": "Test Block",
            "goals": [
                {"title": "Goal 1", "description": "First goal description"}
            ],
            "constraints": [
                {"title": "Constraint 1", "description": "First constraint"}
            ],
            "entities": [
                {"name": "Entity 1", "type": "person", "description": "A person entity"}
            ],
            "metrics": [
                {"name": "Metric 1", "description": "A test metric"}
            ]
        }
        
        result = agent._generate_legacy_content_from_block(kb)
        
        assert "Goal: Goal 1" in result
        assert "First goal description" in result
        assert "Constraint: Constraint 1" in result
        assert "Person: Entity 1 - A person entity" in result
        assert "Metric: Metric 1" in result
    
    def test_generate_legacy_content_fallback(self, agent):
        """Test fallback when no structured content is available."""
        kb = {"title": "Empty Block", "goals": [], "constraints": [], "entities": [], "metrics": []}
        
        result = agent._generate_legacy_content_from_block(kb)
        
        assert result == "Structured knowledge block: Empty Block"
    
    @pytest.mark.asyncio
    async def test_create_substrate_integration(self, agent, mock_openai_response):
        """Test full create_substrate workflow."""
        dump_id = uuid4()
        workspace_id = uuid4()
        basket_id = uuid4()
        
        with patch.object(agent, '_get_dump_content') as mock_get_content, \
             patch.object(agent, '_extract_with_llm') as mock_extract, \
             patch.object(agent, '_persist_block_ingredients') as mock_persist, \
             patch.object(agent, '_create_context_items_from_entities') as mock_context_items:
            
            # Setup mocks
            mock_get_content.return_value = "Test dump content"
            mock_extract.return_value = mock_openai_response
            mock_persist.return_value = [{"id": "block-1", "title": "Test Block"}]
            mock_context_items.return_value = [{"id": "context-1", "content": "Test Context"}]
            
            request = {
                "dump_id": str(dump_id),
                "workspace_id": str(workspace_id),
                "basket_id": str(basket_id),
                "max_blocks": 5,
                "agent_id": "test-agent"
            }
            
            result = await agent.create_substrate(request)
            
            # Verify result structure
            assert result["dump_id"] == str(dump_id)
            assert result["extraction_method"] == "structured_knowledge_ingredients"
            assert "blocks_created" in result
            assert "context_items_created" in result
            assert "processing_time_ms" in result
            assert "agent_confidence" in result
            
            # Verify method calls
            mock_get_content.assert_called_once()
            mock_extract.assert_called_once()
            mock_persist.assert_called_once()
            mock_context_items.assert_called_once()
    
    def test_get_agent_info(self, agent):
        """Test agent information includes concrete LLM details."""
        info = agent.get_agent_info()
        
        assert info["name"] == "P1SubstrateAgentV2"
        assert info["pipeline"] == "P1_SUBSTRATE"
        assert info["extraction_method"] == "llm_structured_outputs"
        assert info["model"] == "gpt-4o-mini"
        assert info["temperature"] == "0.0"
        assert info["max_tokens"] == "3000"
        assert info["version"] == "2.0_concrete_llm"
        assert "sacred_rule" in info
    
    @pytest.mark.asyncio
    async def test_extraction_environment_config(self, mock_openai_response):
        """Test that agent respects environment configuration."""
        with patch('app.agents.pipeline.substrate_agent_v2.os.getenv') as mock_getenv:
            # Custom environment config
            mock_getenv.side_effect = lambda key, default=None: {
                'OPENAI_API_KEY': 'custom-key',
                'LLM_MODEL_P1': 'gpt-4',
                'LLM_TEMP_P1': '0.3',
                'LLM_MAXTOK_P1': '4000',
                'LLM_SEED_P1': '42'
            }.get(key, default)
            
            agent = P1SubstrateAgentV2()
            
            with patch.object(agent, '_client') as mock_client:
                mock_resp = MagicMock()
                mock_resp.choices = [MagicMock()]
                mock_resp.choices[0].message.content = json.dumps(mock_openai_response)
                mock_client.return_value.chat.completions.create.return_value = mock_resp
                
                await agent._extract_with_llm("Test content", "test-dump-id")
                
                # Verify correct model parameters were used
                call_args = mock_client.return_value.chat.completions.create.call_args
                assert call_args[1]['model'] == 'gpt-4'
                assert call_args[1]['temperature'] == 0.3
                assert call_args[1]['max_tokens'] == 4000
                assert call_args[1]['seed'] == 42