"""Worker Agent Adapter - Standardizes worker outputs for Manager Agent integration."""

import sys
import os
from uuid import UUID, uuid4
from typing import List, Dict, Any, Optional, Union
from datetime import datetime

# Add src to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from contracts.basket import BasketChangeRequest, EntityChange, EntityChangeBlock, EntityChangeDocument, EntityChangeTask

class WorkerOutput:
    """Standardized output format for all worker agents."""
    
    def __init__(
        self,
        agent_name: str,
        agent_type: str,
        changes: List[EntityChange],
        explanation: str,
        confidence: float,
        metadata: Dict[str, Any] = None
    ):
        self.agent_name = agent_name
        self.agent_type = agent_type
        self.changes = changes
        self.explanation = explanation
        self.confidence = confidence
        self.metadata = metadata or {}
        self.timestamp = datetime.utcnow().isoformat()

class WorkerAgentAdapter:
    """Adapter to normalize different worker agent outputs into standardized format."""
    
    @classmethod
    async def call_basket_analyzer(
        cls,
        basket_id: str,
        workspace_id: str,
        sources: List[Any],
        context: Optional[Dict[str, Any]] = None
    ) -> WorkerOutput:
        """Call InfraBasketAnalyzerAgent and normalize output."""
        
        try:
            from app.agents.runtime.infra_basket_analyzer_agent import InfraBasketAnalyzerAgent
            from schemas.basket_intelligence_schema import AgentBasketAnalysisRequest
            
            # Create analyzer instance
            analyzer = InfraBasketAnalyzerAgent("manager-analyzer", workspace_id)
            
            # Create request (simplified - adapt based on actual schema)
            request = AgentBasketAnalysisRequest(
                basket_id=UUID(basket_id),
                analysis_depth="standard",
                accommodate_inconsistency=True
            )
            
            # Call the real analyze method
            intelligence_report = await analyzer.analyze_basket_comprehensively(request)
            
            # Convert BasketIntelligenceReport to EntityChanges
            changes = cls._convert_intelligence_to_changes(intelligence_report)
            
            return WorkerOutput(
                agent_name="InfraBasketAnalyzerAgent",
                agent_type="infra_basket_analyzer",
                changes=changes,
                explanation=intelligence_report.accommodation_summary or "Analyzed basket patterns and relationships",
                confidence=0.8,  # Could extract from intelligence_report if available
                metadata={
                    "thematic_patterns": len(intelligence_report.thematic_analysis.discovered_patterns),
                    "coherence_suggestions": len(intelligence_report.coherence_suggestions.suggestions),
                    "document_relationships": len(intelligence_report.document_relationships.document_pairs)
                }
            )
            
        except Exception as e:
            # Fallback to minimal analysis if worker fails
            return WorkerOutput(
                agent_name="InfraBasketAnalyzerAgent",
                agent_type="infra_basket_analyzer", 
                changes=[],
                explanation=f"Analysis failed: {str(e)}",
                confidence=0.1,
                metadata={"error": str(e), "fallback": True}
            )
    
    @classmethod
    async def call_document_composer(
        cls,
        basket_id: str,
        workspace_id: str,
        analysis_result: Any = None
    ) -> WorkerOutput:
        """Call TasksDocumentComposerAgent and normalize output."""
        
        try:
            from app.agents.runtime.tasks_document_composer_agent import TasksDocumentComposerAgent
            from schemas.document_composition_schema import AgentCompositionRequest
            
            # Create composer instance
            composer = TasksDocumentComposerAgent("manager-composer")
            
            # Create composition opportunities analysis (simplified)
            opportunities = await composer._analyze_composition_opportunities(
                UUID(basket_id), workspace_id
            )
            
            # Convert composition opportunities to EntityChanges
            changes = cls._convert_composition_to_changes(opportunities, basket_id)
            
            return WorkerOutput(
                agent_name="TasksDocumentComposerAgent",
                agent_type="tasks_document_composer",
                changes=changes,
                explanation="Analyzed document composition opportunities",
                confidence=0.7,
                metadata={
                    "composition_opportunities": len(changes),
                    "focus": "document_creation"
                }
            )
            
        except Exception as e:
            # Fallback if worker fails
            return WorkerOutput(
                agent_name="TasksDocumentComposerAgent",
                agent_type="tasks_document_composer",
                changes=[],
                explanation=f"Composition analysis failed: {str(e)}",
                confidence=0.1,
                metadata={"error": str(e), "fallback": True}
            )
    
    @classmethod
    def _convert_intelligence_to_changes(cls, intelligence_report) -> List[EntityChange]:
        """Convert BasketIntelligenceReport to EntityChange objects."""
        changes = []
        
        try:
            # Convert thematic patterns to context block changes
            for i, pattern in enumerate(intelligence_report.thematic_analysis.discovered_patterns):
                changes.append(EntityChangeBlock(
                    entity="context_block",
                    id=f"pattern_block_{i}",
                    from_version=0,
                    to_version=1,
                    diff=f"CREATE: {pattern.theme_name} pattern with {len(pattern.keywords)} keywords"
                ))
            
            # Convert coherence suggestions to potential document changes
            for i, suggestion in enumerate(intelligence_report.coherence_suggestions.suggestions):
                if suggestion.suggestion_type in ["document_connection", "theme_clarification"]:
                    changes.append(EntityChangeDocument(
                        entity="document", 
                        id=f"doc_improvement_{i}",
                        from_version=1,
                        to_version=2,
                        diff=f"IMPROVE: {suggestion.description}"
                    ))
            
            # Convert document relationships to potential tasks
            for i, relationship in enumerate(intelligence_report.document_relationships.document_pairs):
                changes.append(EntityChangeTask(
                    entity="task",
                    id=f"relationship_task_{i}",
                    op="CREATE",
                    payload={
                        "type": "link_documents",
                        "relationship": relationship.relationship_type,
                        "documents": [str(relationship.document_a_id), str(relationship.document_b_id)]
                    }
                ))
                
        except Exception as e:
            # If conversion fails, create a generic change
            changes.append(EntityChangeBlock(
                entity="context_block",
                id="analysis_summary",
                from_version=0,
                to_version=1,
                diff=f"ANALYSIS: Basket intelligence analysis completed with some patterns detected"
            ))
        
        return changes
    
    @classmethod  
    def _convert_composition_to_changes(cls, opportunities, basket_id: str) -> List[EntityChange]:
        """Convert composition opportunities to EntityChange objects."""
        changes = []
        
        try:
            # Assume opportunities is a dict with composition suggestions
            if isinstance(opportunities, dict):
                suggestions = opportunities.get('suggestions', [])
                
                for i, suggestion in enumerate(suggestions):
                    changes.append(EntityChangeDocument(
                        entity="document",
                        id=f"composed_doc_{i}",
                        from_version=0,
                        to_version=1,
                        diff=f"CREATE: {suggestion.get('title', 'New Document')} - {suggestion.get('description', 'Composed from context')}"
                    ))
            
            # If no specific suggestions, create a generic document composition change
            if not changes:
                changes.append(EntityChangeDocument(
                    entity="document",
                    id=f"basket_summary_{basket_id[:8]}",
                    from_version=0,
                    to_version=1,
                    diff="CREATE: Document composition opportunities identified"
                ))
                
        except Exception:
            # Fallback change
            changes.append(EntityChangeDocument(
                entity="document", 
                id="composition_summary",
                from_version=0,
                to_version=1,
                diff="CREATE: Document composition analysis completed"
            ))
        
        return changes


class WorkerOutputAggregator:
    """Aggregates multiple WorkerOutput objects into unified results."""
    
    @classmethod
    def aggregate_outputs(cls, worker_outputs: List[WorkerOutput]) -> Dict[str, Any]:
        """Aggregate multiple worker outputs into unified manager results."""
        
        all_changes = []
        explanations = []
        confidence_scores = []
        metadata = {}
        
        for output in worker_outputs:
            all_changes.extend(output.changes)
            explanations.append({"by": output.agent_name, "text": output.explanation})
            confidence_scores.append(output.confidence)
            metadata[output.agent_type] = output.metadata
        
        # Calculate overall confidence (average of individual confidences)
        overall_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.5
        
        # Generate summary
        summary_parts = []
        if all_changes:
            change_counts = {}
            for change in all_changes:
                entity_type = change.entity
                change_counts[entity_type] = change_counts.get(entity_type, 0) + 1
            
            for entity_type, count in change_counts.items():
                summary_parts.append(f"{count} {entity_type} changes")
        
        summary = f"Manager analysis complete: {', '.join(summary_parts)}" if summary_parts else "Analysis complete with recommendations"
        
        # Generate recommended actions
        recommended_actions = []
        if any(change.entity == "context_block" for change in all_changes):
            from contracts.basket import RecommendedAction
            recommended_actions.append(RecommendedAction(
                type="APPLY_ALL",
                target="context_block"
            ))
        
        if any(change.entity == "document" for change in all_changes):
            from contracts.basket import RecommendedAction
            recommended_actions.append(RecommendedAction(
                type="APPLY_ALL", 
                target="document"
            ))
        
        return {
            "summary": summary,
            "changes": all_changes,
            "explanations": explanations,
            "confidence": overall_confidence,
            "recommended_actions": recommended_actions,
            "metadata": metadata
        }