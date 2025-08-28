"""
Pipeline Boundaries Enforcement Service - YARNNN Canon v1.4.0

Validates that all agent operations respect pipeline boundaries and Sacred Principles.
This service provides runtime validation to prevent canon violations.
"""

import logging
from typing import Dict, Any, Optional, List
from enum import Enum

logger = logging.getLogger("uvicorn.error")


class Pipeline(str, Enum):
    """Canon pipeline definitions."""
    P0_CAPTURE = "P0_CAPTURE"
    P1_SUBSTRATE = "P1_SUBSTRATE"  
    P2_GRAPH = "P2_GRAPH"
    P3_REFLECTION = "P3_REFLECTION"
    P4_PRESENTATION = "P4_PRESENTATION"


class PipelineBoundaryViolation(Exception):
    """Raised when an agent violates pipeline boundaries."""
    
    def __init__(self, pipeline: str, operation: str, violation_type: str, details: str):
        self.pipeline = pipeline
        self.operation = operation
        self.violation_type = violation_type
        self.details = details
        super().__init__(f"Pipeline {pipeline} boundary violation: {violation_type} - {details}")


class PipelineBoundaryEnforcer:
    """
    Enforces YARNNN Canon v1.4.0 pipeline boundaries.
    
    Sacred Rules:
    - P0 Capture: Only writes dumps, never interprets
    - P1 Substrate: Creates structured units, never relationships or reflections
    - P2 Graph: Connects substrates, never modifies content  
    - P3 Reflection: Read-only computation, optionally cached
    - P4 Presentation: Consumes substrate, never creates it
    """
    
    # Operations forbidden for each pipeline
    FORBIDDEN_OPERATIONS = {
        Pipeline.P0_CAPTURE: [
            "interpret", "analyze", "process", "extract_meaning", "classify",
            "create_blocks", "create_context_items", "create_relationships",
            "compute_patterns", "derive_insights"
        ],
        Pipeline.P1_SUBSTRATE: [
            "create_relationships", "map_connections", "analyze_patterns",
            "compute_reflections", "derive_insights", "compose_documents",
            "generate_narratives"
        ],
        Pipeline.P2_GRAPH: [
            "modify_content", "update_blocks", "create_blocks", "create_context_items",
            "compute_patterns", "derive_insights", "compose_documents"
        ],
        Pipeline.P3_REFLECTION: [
            "create_substrate", "modify_substrate", "create_blocks", "create_context_items",
            "create_relationships", "compose_documents", "generate_narratives"
        ],
        Pipeline.P4_PRESENTATION: [
            "create_substrate", "create_blocks", "create_context_items",
            "create_relationships", "modify_substrate", "compute_patterns"
        ]
    }
    
    # Operations required for each pipeline
    REQUIRED_OPERATIONS = {
        Pipeline.P0_CAPTURE: ["ingest", "capture", "store", "persist"],
        Pipeline.P1_SUBSTRATE: ["create_blocks", "extract_context", "structure"],
        Pipeline.P2_GRAPH: ["create_relationships", "connect", "map"],
        Pipeline.P3_REFLECTION: ["compute", "analyze_patterns", "derive"],
        Pipeline.P4_PRESENTATION: ["compose", "generate_narrative", "format"]
    }
    
    @classmethod
    def validate_operation(
        cls, 
        pipeline: Pipeline, 
        operation: str, 
        operation_data: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Validate that an operation is allowed for the given pipeline.
        
        Raises PipelineBoundaryViolation if the operation violates boundaries.
        """
        # Check forbidden operations
        forbidden_ops = cls.FORBIDDEN_OPERATIONS.get(pipeline, [])
        operation_lower = operation.lower()
        
        for forbidden in forbidden_ops:
            if forbidden in operation_lower:
                raise PipelineBoundaryViolation(
                    pipeline=pipeline.value,
                    operation=operation,
                    violation_type="FORBIDDEN_OPERATION",
                    details=f"Operation '{operation}' contains forbidden action '{forbidden}' for {pipeline.value}"
                )
        
        # Additional semantic checks based on operation data
        if operation_data:
            cls._validate_operation_semantics(pipeline, operation, operation_data)
        
        logger.debug(f"Pipeline boundary validation passed: {pipeline.value} - {operation}")
    
    @classmethod
    def _validate_operation_semantics(
        cls,
        pipeline: Pipeline,
        operation: str, 
        operation_data: Dict[str, Any]
    ) -> None:
        """Validate operation semantics against pipeline rules."""
        
        # P0 Capture validation
        if pipeline == Pipeline.P0_CAPTURE:
            if "interpretation" in operation_data or "analysis" in operation_data:
                raise PipelineBoundaryViolation(
                    pipeline=pipeline.value,
                    operation=operation,
                    violation_type="INTERPRETATION_FORBIDDEN",
                    details="P0 Capture cannot perform interpretation or analysis"
                )
        
        # P1 Substrate validation  
        elif pipeline == Pipeline.P1_SUBSTRATE:
            if "relationships" in operation_data or "connections" in operation_data:
                raise PipelineBoundaryViolation(
                    pipeline=pipeline.value,
                    operation=operation,
                    violation_type="RELATIONSHIP_CREATION_FORBIDDEN",
                    details="P1 Substrate cannot create relationships (P2 responsibility)"
                )
                
            if "reflections" in operation_data or "patterns" in operation_data:
                raise PipelineBoundaryViolation(
                    pipeline=pipeline.value,
                    operation=operation,
                    violation_type="REFLECTION_COMPUTATION_FORBIDDEN",
                    details="P1 Substrate cannot compute reflections (P3 responsibility)"
                )
        
        # P2 Graph validation
        elif pipeline == Pipeline.P2_GRAPH:
            if "content_modification" in operation_data or "substrate_updates" in operation_data:
                raise PipelineBoundaryViolation(
                    pipeline=pipeline.value,
                    operation=operation,
                    violation_type="CONTENT_MODIFICATION_FORBIDDEN",
                    details="P2 Graph cannot modify substrate content (P1 responsibility)"
                )
        
        # P3 Reflection validation
        elif pipeline == Pipeline.P3_REFLECTION:
            if "substrate_creation" in operation_data or "modifications" in operation_data:
                raise PipelineBoundaryViolation(
                    pipeline=pipeline.value,
                    operation=operation,
                    violation_type="SUBSTRATE_CREATION_FORBIDDEN",
                    details="P3 Reflection is read-only, cannot create or modify substrate"
                )
        
        # P4 Presentation validation
        elif pipeline == Pipeline.P4_PRESENTATION:
            if "substrate_creation" in operation_data or "block_creation" in operation_data:
                raise PipelineBoundaryViolation(
                    pipeline=pipeline.value,
                    operation=operation,
                    violation_type="SUBSTRATE_CREATION_FORBIDDEN",
                    details="P4 Presentation consumes substrate, cannot create it"
                )
    
    @classmethod
    def validate_agent_compliance(cls, agent_name: str, pipeline: Pipeline, operations: List[str]) -> Dict[str, Any]:
        """
        Validate that an agent's operations comply with its assigned pipeline.
        
        Returns compliance report with violations if any.
        """
        violations = []
        warnings = []
        
        # Check each operation
        for operation in operations:
            try:
                cls.validate_operation(pipeline, operation)
            except PipelineBoundaryViolation as e:
                violations.append({
                    "operation": operation,
                    "violation_type": e.violation_type,
                    "details": e.details
                })
        
        # Check for required operations
        required_ops = cls.REQUIRED_OPERATIONS.get(pipeline, [])
        missing_required = []
        
        for required in required_ops:
            if not any(required.lower() in op.lower() for op in operations):
                missing_required.append(required)
        
        if missing_required:
            warnings.append(f"Missing recommended operations for {pipeline.value}: {missing_required}")
        
        # Generate compliance report
        return {
            "agent_name": agent_name,
            "pipeline": pipeline.value,
            "compliant": len(violations) == 0,
            "violations": violations,
            "warnings": warnings,
            "operations_checked": len(operations),
            "validation_timestamp": logger.info.__name__  # Use current timestamp
        }
    
    @classmethod
    def get_pipeline_rules(cls, pipeline: Pipeline) -> Dict[str, Any]:
        """Get the rules and boundaries for a specific pipeline."""
        return {
            "pipeline": pipeline.value,
            "forbidden_operations": cls.FORBIDDEN_OPERATIONS.get(pipeline, []),
            "required_operations": cls.REQUIRED_OPERATIONS.get(pipeline, []),
            "sacred_rule": cls._get_sacred_rule(pipeline),
            "description": cls._get_pipeline_description(pipeline)
        }
    
    @classmethod
    def _get_sacred_rule(cls, pipeline: Pipeline) -> str:
        """Get the sacred rule for a pipeline."""
        rules = {
            Pipeline.P0_CAPTURE: "Only writes dumps, never interprets",
            Pipeline.P1_SUBSTRATE: "Creates structured units, never relationships or reflections",
            Pipeline.P2_GRAPH: "Connects substrates, never modifies content",
            Pipeline.P3_REFLECTION: "Read-only computation, optionally cached", 
            Pipeline.P4_PRESENTATION: "Consumes substrate, never creates it"
        }
        return rules.get(pipeline, "Unknown pipeline")
    
    @classmethod
    def _get_pipeline_description(cls, pipeline: Pipeline) -> str:
        """Get description for a pipeline."""
        descriptions = {
            Pipeline.P0_CAPTURE: "Raw memory capture and storage",
            Pipeline.P1_SUBSTRATE: "Structured substrate creation from raw dumps",
            Pipeline.P2_GRAPH: "Relationship mapping between substrate elements",
            Pipeline.P3_REFLECTION: "Pattern computation and insight derivation",
            Pipeline.P4_PRESENTATION: "Document composition and narrative generation"
        }
        return descriptions.get(pipeline, "Unknown pipeline")