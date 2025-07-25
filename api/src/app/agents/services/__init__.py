"""Agent services for memory substrate operations."""

from .dump_interpreter import (
    DumpInterpreterService,
    SmartDumpInterpreter,
    RawDumpInterpretationRequest,
    RawDumpInterpretationResult,
    InterpretedBlock
)
from .context_tagger import (
    ContextTaggerService,
    ContextTagRequest,
    ContextTaggingResult,
    SemanticRelationship
)
from .substrate_ops import (
    AgentSubstrateService,
    AgentMemoryOperations,
    AgentSubstrateRequest,
    SubstrateOperationResult,
    SubstrateOperationType,
    AgentMemoryAnalysis
)

__all__ = [
    # Dump interpretation
    "DumpInterpreterService",
    "SmartDumpInterpreter", 
    "RawDumpInterpretationRequest",
    "RawDumpInterpretationResult",
    "InterpretedBlock",
    
    # Context tagging
    "ContextTaggerService",
    "ContextTagRequest",
    "ContextTaggingResult", 
    "SemanticRelationship",
    
    # Substrate operations
    "AgentSubstrateService",
    "AgentMemoryOperations",
    "AgentSubstrateRequest",
    "SubstrateOperationResult",
    "SubstrateOperationType",
    "AgentMemoryAnalysis"
]