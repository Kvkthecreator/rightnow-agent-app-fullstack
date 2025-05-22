"""Pydantic models for task registry"""
from pydantic import BaseModel
from typing import List, Literal, Optional

class InputField(BaseModel):
    name: str
    label: str
    type: Literal["string", "url", "markdown", "number", "list"]

class TaskType(BaseModel):
    id: str
    title: str
    description: str
    agent_type: Literal["strategy", "content", "repurpose", "feedback"]
    input_fields: List[InputField]
    prompt_template: str
    output_type: str
    tools: list[str] = []      # keep single definition (lower-case list OK on 3.9+)
    validator_schema: Optional[str] = None
    enabled: bool = True
    version: str = "1"