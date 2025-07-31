"""
Narrative Agent: Project Understanding

This agent transforms technical infrastructure analysis into user-friendly project understanding.
It coordinates with existing Python infrastructure agents to provide human-centered insights.

CRITICAL: This agent must ONLY contain user-facing narrative language.
It consumes technical substrate and produces human-centered insights.
"""

import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from uuid import UUID

from ..runtime.infra_basket_analyzer_agent import InfraBasketAnalyzerAgent
from ..runtime.infra_memory_analyzer_agent import run_infra_memory_analyzer, InfraMemoryAnalyzerInput
from ...schemas.basket_intelligence_schema import AgentBasketAnalysisRequest

logger = logging.getLogger("uvicorn.error")


class ProjectUnderstanding:
    """User-facing project understanding structure."""
    
    def __init__(
        self,
        personalized_greeting: str,
        current_understanding: str,
        intelligence_level: Dict[str, Any],
        confidence: Dict[str, Any],
        discovered_themes: List[Dict[str, Any]],
        next_steps: List[str],
        recommended_actions: List[str]
    ):
        self.personalized_greeting = personalized_greeting
        self.current_understanding = current_understanding
        self.intelligence_level = intelligence_level
        self.confidence = confidence
        self.discovered_themes = discovered_themes
        self.next_steps = next_steps
        self.recommended_actions = recommended_actions


class ProjectInsight:
    """User-friendly project insight."""
    
    def __init__(
        self,
        insight: str,
        supporting_evidence: List[str],
        actionable_advice: str,
        related_themes: List[str]
    ):
        self.insight = insight
        self.supporting_evidence = supporting_evidence
        self.actionable_advice = actionable_advice
        self.related_themes = related_themes


class LearningProgress:
    """User-friendly learning progress description."""
    
    def __init__(
        self,
        current_stage: str,
        progress_description: str,
        recent_discoveries: List[str],
        next_learning_opportunities: List[str],
        memory_growth: str
    ):
        self.current_stage = current_stage
        self.progress_description = progress_description
        self.recent_discoveries = recent_discoveries
        self.next_learning_opportunities = next_learning_opportunities
        self.memory_growth = memory_growth


class ProjectUnderstandingAgent:
    """
    Narrative Agent: Project Understanding
    
    Transforms technical analysis into human-centered project understanding.
    Contains ONLY user-facing narrative language and explanations.
    """
    
    def __init__(self, workspace_id: str):
        self.workspace_id = workspace_id
        self.agent_id = "narrative_project_understanding"
    
    async def create_project_understanding(
        self,
        basket_id: str,
        user_context: Optional[Dict[str, str]] = None
    ) -> ProjectUnderstanding:
        """Transform technical analysis into personalized project understanding."""
        
        try:
            # Step 1: Get technical analysis from infrastructure agents
            technical_analysis = await self._get_technical_analysis(basket_id)
            memory_analysis = await self._get_memory_analysis(basket_id)
            
            # Step 2: Transform to narrative understanding
            understanding = self._transform_to_narrative_understanding(
                technical_analysis, memory_analysis, user_context
            )
            
            logger.info(f"Generated project understanding for basket {basket_id}")
            return understanding
            
        except Exception as e:
            logger.exception(f"Failed to create project understanding for {basket_id}: {e}")
            return self._create_fallback_understanding(user_context)
    
    async def generate_project_insights(
        self,
        basket_id: str,
        focus_area: Optional[str] = None
    ) -> List[ProjectInsight]:
        """Generate contextual insights about the project."""
        
        try:
            # Get technical substrate
            technical_analysis = await self._get_technical_analysis(basket_id)
            
            # Transform to user-friendly insights
            insights = self._create_narrative_insights(technical_analysis, focus_area)
            
            return insights[:5]  # Return top 5 most relevant insights
            
        except Exception as e:
            logger.exception(f"Failed to generate insights for {basket_id}: {e}")
            return self._create_fallback_insights()
    
    async def create_learning_progress(
        self,
        basket_id: str,
        previous_analysis: Optional[Dict[str, Any]] = None
    ) -> LearningProgress:
        """Create learning progress narrative."""
        
        try:
            current_analysis = await self._get_technical_analysis(basket_id)
            memory_analysis = await self._get_memory_analysis(basket_id)
            
            return self._create_progress_narrative(
                current_analysis, memory_analysis, previous_analysis
            )
            
        except Exception as e:
            logger.exception(f"Failed to create learning progress for {basket_id}: {e}")
            return self._create_fallback_progress()
    
    async def _get_technical_analysis(self, basket_id: str) -> Any:
        """Get technical analysis from infrastructure basket analyzer."""
        
        # Create infrastructure agent
        basket_analyzer = InfraBasketAnalyzerAgent(
            agent_id=f"{self.agent_id}_basket_analyzer",
            workspace_id=self.workspace_id
        )
        
        # Create analysis request
        request = AgentBasketAnalysisRequest(
            agent_id=self.agent_id,
            agent_type="narrative_project_understanding",
            basket_id=UUID(basket_id),
            analysis_goals=["pattern_recognition", "thematic_analysis"],
            respect_inconsistency=True,
            accommodate_messiness=True,
            suggestion_style="gentle"
        )
        
        # Get technical substrate
        return await basket_analyzer.analyze_basket_comprehensively(request)
    
    async def _get_memory_analysis(self, basket_id: str) -> Any:
        """Get memory analysis from infrastructure memory analyzer."""
        
        memory_input = InfraMemoryAnalyzerInput(
            basket_id=basket_id,
            workspace_id=self.workspace_id,
            analysis_type="comprehensive",
            auto_tag_context=False,  # Don't modify, just analyze
            confidence_threshold=0.7
        )
        
        return await run_infra_memory_analyzer(memory_input)
    
    def _transform_to_narrative_understanding(
        self,
        technical_analysis: Any,
        memory_analysis: Any,
        user_context: Optional[Dict[str, str]]
    ) -> ProjectUnderstanding:
        """Transform technical analysis into narrative understanding."""
        
        # Create personalized greeting
        greeting = self._create_personalized_greeting(technical_analysis, user_context)
        
        # Transform current understanding
        current_understanding = self._create_current_understanding(technical_analysis, memory_analysis)
        
        # Transform intelligence level
        intelligence_level = self._determine_intelligence_level(technical_analysis, memory_analysis)
        
        # Transform confidence narrative
        confidence = self._create_confidence_narrative(technical_analysis, memory_analysis)
        
        # Transform themes to narrative
        themes = self._transform_themes_to_narrative(technical_analysis)
        
        # Generate next steps
        next_steps = self._generate_narrative_next_steps(technical_analysis, memory_analysis)
        
        # Generate recommended actions
        recommended_actions = self._generate_recommended_actions(technical_analysis)
        
        return ProjectUnderstanding(
            personalized_greeting=greeting,
            current_understanding=current_understanding,
            intelligence_level=intelligence_level,
            confidence=confidence,
            discovered_themes=themes,
            next_steps=next_steps,
            recommended_actions=recommended_actions
        )
    
    def _create_personalized_greeting(
        self,
        technical_analysis: Any,
        user_context: Optional[Dict[str, str]]
    ) -> str:
        """Create personalized greeting based on project state."""
        
        name = user_context.get("name", "") if user_context else ""
        project_type = user_context.get("projectType", "project") if user_context else "project"
        
        name_part = f" {name}" if name else ""
        
        # Determine project development state from technical analysis
        if hasattr(technical_analysis, 'thematic_analysis'):
            theme_count = len(technical_analysis.thematic_analysis.discovered_patterns)
            
            if theme_count == 0:
                return f"Hi{name_part}! I'm ready to learn about your {project_type}. Share some ideas and I'll start understanding what you're working on."
            elif theme_count <= 2:
                return f"Hello{name_part}! I'm beginning to see the early shape of your {project_type}. As you add more, I'll develop a deeper understanding."
            elif theme_count <= 5:
                return f"Hey{name_part}! Your {project_type} is taking form and I'm starting to grasp the connections between your ideas."
            else:
                return f"Hi{name_part}! I have a solid understanding of your {project_type} and can see interesting patterns emerging."
        
        return f"Hi{name_part}! I'm here to understand and help with your {project_type}."
    
    def _create_current_understanding(
        self,
        technical_analysis: Any,
        memory_analysis: Any
    ) -> str:
        """Create current understanding description."""
        
        if hasattr(technical_analysis, 'thematic_analysis'):
            theme_count = len(technical_analysis.thematic_analysis.discovered_patterns)
            
            if theme_count == 0:
                return "I haven't learned about your project yet, but I'm ready to understand whatever you're working on."
            elif theme_count <= 2:
                return f"From the content you've shared, I'm beginning to see the early themes of your work."
            elif theme_count <= 5:
                return f"I'm developing a good sense of your project's direction. The themes are becoming clearer to me."
            else:
                return f"I have a strong understanding of your project now. From your content, I can see clear patterns and connections."
        
        return "I'm working to understand your project better."
    
    def _determine_intelligence_level(
        self,
        technical_analysis: Any,
        memory_analysis: Any
    ) -> Dict[str, Any]:
        """Determine intelligence level with narrative description."""
        
        # Assess based on technical analysis depth
        if hasattr(technical_analysis, 'thematic_analysis'):
            theme_count = len(technical_analysis.thematic_analysis.discovered_patterns)
            
            if theme_count == 0:
                return {
                    "stage": "learning",
                    "description": "I'm ready to start learning about your project",
                    "progress_indicator": "Getting ready to understand",
                    "capabilities": ["Ready to learn", "Eager to understand", "Prepared to grow"]
                }
            elif theme_count <= 2:
                return {
                    "stage": "learning",
                    "description": "I'm in the early stages of understanding your work",
                    "progress_indicator": "Building initial understanding",
                    "capabilities": ["Identifying early themes", "Learning your style", "Growing my knowledge"]
                }
            elif theme_count <= 5:
                return {
                    "stage": "understanding",
                    "description": "I have a developing sense of your project's direction",
                    "progress_indicator": "Understanding is developing",
                    "capabilities": ["Seeing patterns", "Making connections", "Offering suggestions"]
                }
            elif theme_count <= 8:
                return {
                    "stage": "insights",
                    "description": "I can offer meaningful insights about your work",
                    "progress_indicator": "Strong understanding achieved",
                    "capabilities": ["Deep pattern recognition", "Strategic suggestions", "Coherent guidance"]
                }
            else:
                return {
                    "stage": "deep_knowledge",
                    "description": "I have comprehensive knowledge of your project",
                    "progress_indicator": "Comprehensive understanding",
                    "capabilities": ["Advanced analysis", "Complex connections", "Strategic planning", "Detailed guidance"]
                }
        
        return {
            "stage": "learning",
            "description": "Working to understand your project",
            "progress_indicator": "Learning in progress",
            "capabilities": ["Building knowledge"]
        }
    
    def _create_confidence_narrative(
        self,
        technical_analysis: Any,
        memory_analysis: Any
    ) -> Dict[str, Any]:
        """Create confidence narrative based on analysis quality."""
        
        # Assess confidence based on memory health and theme strength
        health_score = memory_analysis.health_score if hasattr(memory_analysis, 'health_score') else 0.5
        
        if hasattr(technical_analysis, 'thematic_analysis'):
            theme_count = len(technical_analysis.thematic_analysis.discovered_patterns)
            
            if theme_count == 0:
                return {
                    "level": "just_getting_started",
                    "explanation": "I'm ready to learn but need some content to understand your project",
                    "visual_description": "Like a blank notebook, ready for your ideas"
                }
            elif theme_count <= 2:
                return {
                    "level": "building_understanding",
                    "explanation": "I'm beginning to understand your work and building my knowledge",
                    "visual_description": "Like reading the first chapter of your story"
                }
            elif theme_count <= 5:
                return {
                    "level": "building_understanding",
                    "explanation": "My understanding is growing stronger as you add more content",
                    "visual_description": "Like pieces of a puzzle coming together"
                }
            elif theme_count <= 8:
                return {
                    "level": "solid_grasp",
                    "explanation": "I have a solid understanding of your project and can offer meaningful insights",
                    "visual_description": "Like having read most of your story and understanding the plot"
                }
            else:
                return {
                    "level": "comprehensive_knowledge",
                    "explanation": "I have deep, comprehensive knowledge of your project and its nuances",
                    "visual_description": "Like being a co-author who knows every detail of your work"
                }
        
        return {
            "level": "building_understanding",
            "explanation": "I'm working to understand your project better",
            "visual_description": "Building my knowledge step by step"
        }
    
    def _transform_themes_to_narrative(self, technical_analysis: Any) -> List[Dict[str, Any]]:
        """Transform technical themes to user-friendly themes."""
        
        themes = []
        
        if hasattr(technical_analysis, 'thematic_analysis') and hasattr(technical_analysis.thematic_analysis, 'discovered_patterns'):
            patterns = technical_analysis.thematic_analysis.discovered_patterns[:5]  # Top 5
            
            for i, pattern in enumerate(patterns):
                relevance = 'central' if i == 0 else ('supporting' if i < 3 else 'emerging')
                theme_name = self._humanize_theme_name(pattern.get('pattern_name', 'Unknown theme'))
                
                themes.append({
                    "name": theme_name,
                    "description": f"This theme appears throughout your project, representing a key focus area.",
                    "relevance": relevance,
                    "user_friendly_explanation": self._create_theme_explanation(theme_name, relevance)
                })
        
        return themes
    
    def _generate_narrative_next_steps(
        self,
        technical_analysis: Any,
        memory_analysis: Any
    ) -> List[str]:
        """Generate next steps in narrative language."""
        
        next_steps = []
        
        # Base on technical analysis recommendations but make narrative
        if hasattr(technical_analysis, 'next_steps_if_interested'):
            for step in technical_analysis.next_steps_if_interested[:3]:
                # Transform technical recommendations to narrative
                narrative_step = self._transform_step_to_narrative(step)
                next_steps.append(narrative_step)
        
        # Add memory-based recommendations
        if hasattr(memory_analysis, 'health_score') and memory_analysis.health_score < 0.7:
            next_steps.append("Consider adding some background context to help me understand your project better")
        
        # Default steps if none available
        if not next_steps:
            next_steps = [
                "Continue adding content so I can understand your project better",
                "Share more about what you're working on",
                "Tell me about your goals for this project"
            ]
        
        return next_steps
    
    def _generate_recommended_actions(self, technical_analysis: Any) -> List[str]:
        """Generate recommended actions from technical analysis."""
        
        actions = []
        
        if hasattr(technical_analysis, 'pattern_insights'):
            actions.extend(technical_analysis.pattern_insights[:2])
        
        # Transform technical suggestions to user-friendly actions
        if hasattr(technical_analysis, 'accommodation_summary'):
            if 'inconsist' in technical_analysis.accommodation_summary.lower():
                actions.append("Your project naturally accommodates creative complexity - this is valuable diversity")
        
        return actions[:3]  # Limit to top 3 actions
    
    def _create_narrative_insights(
        self,
        technical_analysis: Any,
        focus_area: Optional[str]
    ) -> List[ProjectInsight]:
        """Create narrative insights from technical analysis."""
        
        insights = []
        
        if hasattr(technical_analysis, 'pattern_insights'):
            for insight_text in technical_analysis.pattern_insights[:3]:
                insight = ProjectInsight(
                    insight=self._humanize_insight(insight_text),
                    supporting_evidence=["Found in your project content"],
                    actionable_advice=self._create_insight_advice(insight_text),
                    related_themes=[]
                )
                insights.append(insight)
        
        return insights
    
    def _create_progress_narrative(
        self,
        current_analysis: Any,
        memory_analysis: Any,
        previous_analysis: Optional[Dict[str, Any]]
    ) -> LearningProgress:
        """Create learning progress narrative."""
        
        current_stage = self._map_analysis_to_stage(current_analysis)
        progress_description = self._create_progress_description(current_analysis, previous_analysis)
        recent_discoveries = self._identify_recent_discoveries(current_analysis)
        next_opportunities = self._identify_learning_opportunities(current_analysis)
        memory_growth = self._describe_memory_growth(memory_analysis)
        
        return LearningProgress(
            current_stage=current_stage,
            progress_description=progress_description,
            recent_discoveries=recent_discoveries,
            next_learning_opportunities=next_opportunities,
            memory_growth=memory_growth
        )
    
    # Helper methods for narrative transformation
    def _humanize_theme_name(self, theme_name: str) -> str:
        """Convert technical theme names to human-readable format."""
        return theme_name.replace("_", " ").replace("-", " ").title()
    
    def _create_theme_explanation(self, theme_name: str, relevance: str) -> str:
        """Create user-friendly theme explanation."""
        if relevance == 'central':
            return f"{theme_name} appears to be a central focus of your work, threading through much of your content."
        elif relevance == 'supporting':
            return f"{theme_name} plays a supporting role in your project, appearing regularly in your materials."
        else:
            return f"{theme_name} is an emerging theme that I'm starting to notice in your work."
    
    def _transform_step_to_narrative(self, technical_step: str) -> str:
        """Transform technical step to narrative language."""
        # Remove technical language and make more conversational
        step = technical_step.lower()
        if "consider" not in step:
            step = f"Consider {step}"
        return step.capitalize()
    
    def _humanize_insight(self, technical_insight: str) -> str:
        """Transform technical insight to human language."""
        # Remove technical jargon and make conversational
        return technical_insight.replace("pattern", "theme").replace("analysis", "understanding")
    
    def _create_insight_advice(self, insight_text: str) -> str:
        """Create actionable advice from insight."""
        return f"Consider exploring how this insight connects to other aspects of your project."
    
    def _map_analysis_to_stage(self, analysis: Any) -> str:
        """Map technical analysis to user-friendly stage."""
        if hasattr(analysis, 'thematic_analysis'):
            patterns = len(analysis.thematic_analysis.discovered_patterns)
            if patterns == 0:
                return "Ready to learn about your project"
            elif patterns <= 3:
                return "Early understanding phase"
            elif patterns <= 6:
                return "Building comprehensive knowledge"
            else:
                return "Strong project understanding"
        return "Learning about your project"
    
    def _create_progress_description(
        self,
        current_analysis: Any,
        previous_analysis: Optional[Dict[str, Any]]
    ) -> str:
        """Create progress description comparing to previous state."""
        if not previous_analysis:
            return "I'm building my first understanding of your project."
        return "Your project continues to develop, deepening my understanding."
    
    def _identify_recent_discoveries(self, analysis: Any) -> List[str]:
        """Identify recent discoveries from analysis."""
        discoveries = []
        if hasattr(analysis, 'pattern_insights'):
            discoveries.extend(analysis.pattern_insights[:2])
        return discoveries or ["Building understanding of your project themes"]
    
    def _identify_learning_opportunities(self, analysis: Any) -> List[str]:
        """Identify next learning opportunities."""
        return [
            "Continue sharing content to deepen understanding",
            "Explore connections between different aspects of your work"
        ]
    
    def _describe_memory_growth(self, memory_analysis: Any) -> str:
        """Describe memory growth from analysis."""
        if hasattr(memory_analysis, 'health_score'):
            score = memory_analysis.health_score
            if score > 0.8:
                return "My memory contains a rich understanding of your project"
            elif score > 0.6:
                return "My memory is actively growing and making new connections"
            else:
                return "My memory is ready to grow with your project"
        return "My memory continues to evolve with your project"
    
    # Fallback methods for error cases
    def _create_fallback_understanding(
        self,
        user_context: Optional[Dict[str, str]]
    ) -> ProjectUnderstanding:
        """Create fallback understanding when analysis fails."""
        name = user_context.get("name", "") if user_context else ""
        name_part = f" {name}" if name else ""
        
        return ProjectUnderstanding(
            personalized_greeting=f"Hi{name_part}! I'm ready to learn about your project.",
            current_understanding="I'm ready to understand whatever you're working on.",
            intelligence_level={
                "stage": "learning",
                "description": "Ready to learn about your project",
                "progress_indicator": "Waiting for content",
                "capabilities": ["Ready to analyze", "Eager to understand"]
            },
            confidence={
                "level": "just_getting_started",
                "explanation": "I need content to build understanding",
                "visual_description": "Ready to begin learning"
            },
            discovered_themes=[],
            next_steps=["Share some content about your project", "Tell me about your goals"],
            recommended_actions=["Add content to help me understand your project"]
        )
    
    def _create_fallback_insights(self) -> List[ProjectInsight]:
        """Create fallback insights when analysis fails."""
        return [
            ProjectInsight(
                insight="I'm ready to learn about your project once you share some content",
                supporting_evidence=["Waiting for project content"],
                actionable_advice="Share documents or ideas to help me understand your work",
                related_themes=[]
            )
        ]
    
    def _create_fallback_progress(self) -> LearningProgress:
        """Create fallback progress when analysis fails."""
        return LearningProgress(
            current_stage="Ready to learn",
            progress_description="Waiting to begin understanding your project",
            recent_discoveries=[],
            next_learning_opportunities=["Share content to begin learning"],
            memory_growth="Ready to grow with your project"
        )