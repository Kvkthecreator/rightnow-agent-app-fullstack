"""Pydantic models for task registry"""
from typing import List, Literal, Optional

from pydantic import BaseModel


class InputField(BaseModel):
    name: str
    label: str
    type: Literal["string", "url", "markdown", "number", "list", "array"]

class TaskType(BaseModel):
    id: str
    title: str
    description: str
    agent_type: Literal[
        "strategy", "content", "repurpose", "feedback",
        "nlp", "assistant", "creative", "competitor_table", "competitor"
    ]
    input_fields: List[InputField]
    prompt_template: Optional[str] = None
    output_type: str
    tools: list[str] = []
    validator_schema: Optional[str] = None
    enabled: bool = True
    version: str = "1"

    class Config:
        extra = "ignore"
