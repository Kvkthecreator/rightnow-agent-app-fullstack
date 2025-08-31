"""Governance testing configuration and fixtures."""

import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from uuid import uuid4
import os
import types


@pytest.fixture
def governance_enabled():
    """Enable governance for testing."""
    env_vars = {
        'GOVERNANCE_ENABLED': 'true',
        'VALIDATOR_REQUIRED': 'true',
        'DIRECT_SUBSTRATE_WRITES': 'false',
        'GOVERNANCE_UI_ENABLED': 'true',
        'CASCADE_EVENTS_ENABLED': 'true'
    }
    
    with patch.dict(os.environ, env_vars):
        yield


@pytest.fixture
def governance_disabled():
    """Disable governance for legacy mode testing."""
    env_vars = {
        'GOVERNANCE_ENABLED': 'false',
        'VALIDATOR_REQUIRED': 'false',
        'DIRECT_SUBSTRATE_WRITES': 'true',
        'GOVERNANCE_UI_ENABLED': 'false',
        'CASCADE_EVENTS_ENABLED': 'true'
    }
    
    with patch.dict(os.environ, env_vars):
        yield


@pytest.fixture
def governance_testing_mode():
    """Governance in testing mode - parallel with legacy."""
    env_vars = {
        'GOVERNANCE_ENABLED': 'true',
        'VALIDATOR_REQUIRED': 'false',  # Optional validation for testing
        'DIRECT_SUBSTRATE_WRITES': 'true',  # Legacy still works
        'GOVERNANCE_UI_ENABLED': 'false',  # UI not visible
        'CASCADE_EVENTS_ENABLED': 'true'
    }
    
    with patch.dict(os.environ, env_vars):
        yield


@pytest.fixture
def test_workspace():
    """Standard test workspace setup."""
    return {
        'workspace_id': str(uuid4()),
        'user_id': str(uuid4()),
        'basket_id': str(uuid4())
    }


@pytest.fixture
def test_proposal():
    """Standard test proposal."""
    return {
        'id': str(uuid4()),
        'proposal_kind': 'Extraction',
        'origin': 'agent',
        'status': 'PROPOSED',
        'ops': [
            {
                'type': 'CreateBlock',
                'data': {
                    'content': 'Test strategic goal',
                    'semantic_type': 'goal',
                    'confidence': 0.8
                }
            },
            {
                'type': 'CreateContextItem', 
                'data': {
                    'label': 'Strategy',
                    'content': 'Strategic initiative',
                    'confidence': 0.7
                }
            }
        ],
        'validator_report': {
            'confidence': 0.75,
            'dupes': [],
            'ontology_hits': ['strategy'],
            'suggested_merges': [],
            'warnings': [],
            'impact_summary': '1 CreateBlock, 1 CreateContextItem; affects 0 documents'
        },
        'blast_radius': 'Local',
        'is_executed': False
    }


@pytest.fixture
def mock_supabase():
    """Comprehensive Supabase mock for governance testing."""
    
    class MockQuery:
        def __init__(self, table_name, mock_data=None):
            self.table_name = table_name
            self.mock_data = mock_data or []
            self._filters = []
            self._single = False
            
        def select(self, cols="*"):
            return self
            
        def insert(self, data):
            self.mock_data.append(data)
            return self
            
        def update(self, data):
            return self
            
        def eq(self, col, val):
            self._filters.append((col, val))
            return self
            
        def single(self):
            self._single = True
            return self
            
        def execute(self):
            filtered_data = self.mock_data
            for col, val in self._filters:
                filtered_data = [item for item in filtered_data if item.get(col) == val]
            
            if self._single:
                return types.SimpleNamespace(
                    data=filtered_data[0] if filtered_data else None,
                    error=None
                )
            
            return types.SimpleNamespace(data=filtered_data, error=None)
    
    class MockSupabase:
        def __init__(self):
            self.tables = {}
            self.rpc_responses = {}
            
        def table(self, name):
            if name not in self.tables:
                self.tables[name] = []
            return MockQuery(name, self.tables[name])
            
        def rpc(self, name, params=None):
            response = self.rpc_responses.get(name, None)
            return types.SimpleNamespace(
                execute=lambda: types.SimpleNamespace(data=response, error=None)
            )
            
        def set_table_data(self, table_name, data):
            self.tables[table_name] = data
            
        def set_rpc_response(self, rpc_name, response):
            self.rpc_responses[rpc_name] = response
    
    return MockSupabase()


@pytest.fixture
def mock_validator_agent():
    """Mock P1 Validator Agent for testing."""
    mock = AsyncMock()
    
    # Default validation report
    mock.validate_proposal.return_value = types.SimpleNamespace(
        confidence=0.8,
        dupes=[],
        ontology_hits=['test'],
        suggested_merges=[],
        warnings=[],
        impact_summary='Test impact summary',
        dict=lambda: {
            'confidence': 0.8,
            'dupes': [],
            'ontology_hits': ['test'],
            'suggested_merges': [],
            'warnings': [],
            'impact_summary': 'Test impact summary'
        }
    )
    
    mock.get_agent_info.return_value = {
        'name': 'P1ValidatorAgent',
        'pipeline': 'P1_SUBSTRATE',
        'type': 'validator',
        'status': 'active'
    }
    
    return mock


@pytest.fixture
def sample_dump_content():
    """Sample dump content for governance testing."""
    return """
    Strategic Initiative: Customer Experience Transformation
    
    Primary Goal: Reduce customer churn by 25% through improved onboarding.
    
    Key Focus Areas:
    - User Interface Simplification
    - Documentation Quality
    - Support Response Time
    
    Success Metrics:
    - NPS Score: Target 8.5+
    - Time to First Value: Under 10 minutes
    - Support Ticket Volume: 40% reduction
    
    Implementation Timeline: Q4 2025
    """


@pytest.fixture
def governance_test_scenarios():
    """Standard governance testing scenarios."""
    return {
        'simple_extraction': {
            'dump_content': 'Goal: Improve customer satisfaction.',
            'expected_operations': ['CreateBlock'],
            'expected_confidence': 0.6
        },
        
        'complex_extraction': {
            'dump_content': """
            Strategic Theme: Digital Transformation
            
            Key Initiatives:
            1. API Modernization
            2. Data Pipeline Optimization  
            3. Customer Portal Redesign
            
            Success Criteria: 99.9% uptime, <100ms response times
            """,
            'expected_operations': ['CreateBlock', 'CreateContextItem'],
            'expected_confidence': 0.8
        },
        
        'manual_edit': {
            'operations': [
                {
                    'type': 'ReviseBlock',
                    'data': {
                        'block_id': str(uuid4()),
                        'content': 'Updated strategic priority',
                        'confidence': 0.9
                    }
                }
            ],
            'expected_confidence': 0.9
        }
    }


# Governance test markers
def pytest_configure(config):
    """Configure governance test markers."""
    config.addinivalue_line(
        "markers", "governance: mark test as governance workflow test"
    )
    config.addinivalue_line(
        "markers", "governance_integration: mark test as governance integration test"  
    )
    config.addinivalue_line(
        "markers", "governance_performance: mark test as governance performance test"
    )


@pytest.fixture(scope="session")
def governance_test_database():
    """Mock database for governance testing."""
    # In production, this would set up test database with governance schema
    return {
        'proposals': [],
        'proposal_executions': [],
        'context_items': [],
        'context_blocks': [],
        'raw_dumps': [],
        'agent_processing_queue': [],
        'timeline_events': []
    }