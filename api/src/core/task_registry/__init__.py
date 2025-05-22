"""Registry façade for task types"""
from .providers import get_provider
provider = get_provider()

def list_task_types():
    """List all available task types."""
    return provider.list()

def get_task_type(task_id: str):
    """Retrieve a single task type by ID."""
    return provider.get(task_id)