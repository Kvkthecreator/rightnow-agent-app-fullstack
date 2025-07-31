"""
Narrative Agent: Intelligent Guidance

This agent provides strategic and tactical guidance for project development.
It coordinates with infrastructure agents to provide actionable, user-friendly recommendations.

CRITICAL: This agent must ONLY contain user-facing guidance language.
It consumes technical substrate and produces human-centered strategic advice.
"""

import logging
from typing import Dict, List, Optional, Any
from enum import Enum

from .project_understanding_agent import ProjectUnderstandingAgent, ProjectUnderstanding
from ..runtime.infra_basket_analyzer_agent import InfraBasketAnalyzerAgent

logger = logging.getLogger("uvicorn.error")


class GuidanceTimeframe(str, Enum):
    IMMEDIATE = "immediate"
    SHORT_TERM = "short_term"
    MEDIUM_TERM = "medium_term"
    LONG_TERM = "long_term"


class GuidanceDifficulty(str, Enum):
    BEGINNER_FRIENDLY = "beginner_friendly"
    MODERATE_EFFORT = "moderate_effort"
    ADVANCED_FOCUS = "advanced_focus"


class ProjectHealthLevel(str, Enum):
    EXCELLENT = "excellent"
    GOOD = "good"
    DEVELOPING = "developing"
    NEEDS_ATTENTION = "needs_attention"


class ProgressTrajectory(str, Enum):
    ACCELERATING = "accelerating"
    STEADY = "steady"
    SLOWING = "slowing"
    STALLED = "stalled"


class ActionStep:
    """User-friendly action step."""
    
    def __init__(
        self,
        step: str,
        description: str,
        user_benefit: str,
        estimated_time: str,
        prerequisite: Optional[str] = None
    ):
        self.step = step
        self.description = description
        self.user_benefit = user_benefit
        self.estimated_time = estimated_time
        self.prerequisite = prerequisite


class StrategicGuidance:
    """Strategic guidance recommendation."""
    
    def __init__(
        self,
        title: str,
        description: str,
        recommendation: str,
        reasoning: str,
        action_plan: List[ActionStep],
        expected_outcome: str,
        timeframe: GuidanceTimeframe,
        difficulty: GuidanceDifficulty
    ):
        self.title = title
        self.description = description
        self.recommendation = recommendation
        self.reasoning = reasoning
        self.action_plan = action_plan
        self.expected_outcome = expected_outcome
        self.timeframe = timeframe
        self.difficulty = difficulty


class HealthRecommendation:
    """Project health recommendation."""
    
    def __init__(
        self,
        focus: str,
        suggestion: str,
        impact: str,  # 'high', 'medium', 'low'
        effort: str   # 'minimal', 'moderate', 'significant'
    ):
        self.focus = focus
        self.suggestion = suggestion
        self.impact = impact
        self.effort = effort


class ProjectHealthAssessment:
    """Comprehensive project health assessment."""
    
    def __init__(
        self,
        overall_health: ProjectHealthLevel,
        strengths: List[str],
        improvement_areas: List[str],
        recommendations: List[HealthRecommendation],
        progress_trajectory: ProgressTrajectory
    ):
        self.overall_health = overall_health
        self.strengths = strengths
        self.improvement_areas = improvement_areas
        self.recommendations = recommendations
        self.progress_trajectory = progress_trajectory


class CreativeOpportunity:
    """Creative development opportunity."""
    
    def __init__(
        self,
        opportunity: str,
        description: str,
        inspirational_prompt: str,
        exploration_steps: List[str],
        potential_outcomes: List[str]
    ):
        self.opportunity = opportunity
        self.description = description
        self.inspirational_prompt = inspirational_prompt
        self.exploration_steps = exploration_steps
        self.potential_outcomes = potential_outcomes


class DevelopmentPriority:
    """Development priority assessment."""
    
    def __init__(
        self,
        area: str,
        importance: str,  # 'critical', 'high', 'medium', 'low'
        rationale: str,
        suggested_actions: List[str],
        success_indicators: List[str]
    ):
        self.area = area
        self.importance = importance
        self.rationale = rationale
        self.suggested_actions = suggested_actions
        self.success_indicators = success_indicators


class IntelligentGuidanceAgent:
    """
    Narrative Agent: Intelligent Guidance
    
    Provides strategic guidance and development recommendations.
    Contains ONLY user-facing strategic and tactical advice.
    """
    
    def __init__(self, workspace_id: str):
        self.workspace_id = workspace_id
        self.agent_id = "narrative_intelligent_guidance"
    
    async def generate_strategic_guidance(
        self,
        basket_id: str,
        focus_area: Optional[str] = None,
        user_goal: Optional[str] = None
    ) -> List[StrategicGuidance]:
        """Generate comprehensive strategic guidance."""
        
        try:
            # Get project understanding and technical analysis
            understanding_agent = ProjectUnderstandingAgent(self.workspace_id)
            understanding = await understanding_agent.create_project_understanding(basket_id)
            
            technical_analysis = await self._get_technical_analysis(basket_id)
            
            # Generate guidance based on focus area
            guidance = []
            
            if focus_area == "development" or not focus_area:
                guidance.extend(self._create_development_guidance(understanding, technical_analysis))
            
            if focus_area == "organization" or not focus_area:
                guidance.extend(self._create_organization_guidance(understanding, technical_analysis))
            
            if focus_area == "creativity" or not focus_area:
                guidance.extend(self._create_creativity_guidance(understanding, technical_analysis))
            
            if focus_area == "completion" or not focus_area:
                guidance.extend(self._create_completion_guidance(understanding, technical_analysis))
            
            return guidance[:6]  # Return top 6 most relevant guidance items
            
        except Exception as e:
            logger.exception(f"Failed to generate strategic guidance for {basket_id}: {e}")
            return self._create_fallback_guidance()
    
    async def assess_development_priorities(
        self,
        basket_id: str
    ) -> List[DevelopmentPriority]:
        """Assess project development priorities."""
        
        try:
            understanding_agent = ProjectUnderstandingAgent(self.workspace_id)
            understanding = await understanding_agent.create_project_understanding(basket_id)
            
            technical_analysis = await self._get_technical_analysis(basket_id)
            
            return self._create_development_priorities(understanding, technical_analysis)
            
        except Exception as e:
            logger.exception(f"Failed to assess development priorities for {basket_id}: {e}")
            return self._create_fallback_priorities()
    
    async def evaluate_project_health(
        self,
        basket_id: str,
        previous_analysis: Optional[Dict[str, Any]] = None
    ) -> ProjectHealthAssessment:
        """Evaluate project health and provide assessment."""
        
        try:
            understanding_agent = ProjectUnderstandingAgent(self.workspace_id)
            understanding = await understanding_agent.create_project_understanding(basket_id)
            
            technical_analysis = await self._get_technical_analysis(basket_id)
            
            return self._create_health_assessment(understanding, technical_analysis, previous_analysis)
            
        except Exception as e:
            logger.exception(f"Failed to evaluate project health for {basket_id}: {e}")
            return self._create_fallback_health_assessment()
    
    async def identify_creative_opportunities(
        self,
        basket_id: str
    ) -> List[CreativeOpportunity]:
        """Identify creative opportunities in the project."""
        
        try:
            understanding_agent = ProjectUnderstandingAgent(self.workspace_id)
            understanding = await understanding_agent.create_project_understanding(basket_id)
            
            technical_analysis = await self._get_technical_analysis(basket_id)
            
            return self._create_creative_opportunities(understanding, technical_analysis)
            
        except Exception as e:
            logger.exception(f"Failed to identify creative opportunities for {basket_id}: {e}")
            return self._create_fallback_opportunities()
    
    async def generate_contextual_next_steps(
        self,
        basket_id: str,
        user_goal: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate contextual next steps based on current situation."""
        
        try:
            understanding_agent = ProjectUnderstandingAgent(self.workspace_id)
            understanding = await understanding_agent.create_project_understanding(basket_id)
            
            technical_analysis = await self._get_technical_analysis(basket_id)
            
            immediate_steps = self._create_immediate_steps(understanding, technical_analysis, user_goal)
            short_term_goals = self._create_short_term_goals(understanding, user_goal)
            strategic_considerations = self._create_strategic_considerations(understanding, technical_analysis, user_goal)
            
            return {
                "immediate_steps": immediate_steps,
                "short_term_goals": short_term_goals,
                "strategic_considerations": strategic_considerations
            }
            
        except Exception as e:
            logger.exception(f"Failed to generate contextual next steps for {basket_id}: {e}")
            return self._create_fallback_next_steps()
    
    async def _get_technical_analysis(self, basket_id: str) -> Any:
        """Get technical analysis from infrastructure agents."""
        
        from ...schemas.basket_intelligence_schema import AgentBasketAnalysisRequest
        from uuid import UUID
        
        # Create infrastructure agent
        basket_analyzer = InfraBasketAnalyzerAgent(
            agent_id=f"{self.agent_id}_basket_analyzer",
            workspace_id=self.workspace_id
        )
        
        # Create analysis request
        request = AgentBasketAnalysisRequest(
            agent_id=self.agent_id,
            agent_type="narrative_intelligent_guidance",
            basket_id=UUID(basket_id),
            analysis_goals=["pattern_recognition", "improvement_guidance", "relationship_discovery"],
            respect_inconsistency=True,
            accommodate_messiness=True,
            suggestion_style="gentle"
        )
        
        return await basket_analyzer.analyze_basket_comprehensively(request)
    
    def _create_development_guidance(
        self,
        understanding: ProjectUnderstanding,
        technical_analysis: Any
    ) -> List[StrategicGuidance]:
        """Create development-focused strategic guidance."""
        
        guidance = []
        stage = understanding.intelligence_level["stage"]
        themes_count = len(understanding.discovered_themes)
        
        if stage == "learning":
            guidance.append(StrategicGuidance(
                title="Establish Your Project Foundation",
                description="Begin building the content base that will allow meaningful insights to emerge",
                recommendation="Start by adding your core ideas, documents, or materials to give me something substantial to understand",
                reasoning="Every meaningful project needs a foundation of content. The more you share, the better I can understand your vision and provide targeted guidance.",
                action_plan=[
                    ActionStep(
                        step="Share your first document or idea",
                        description="Upload a file or write about what you're working on",
                        user_benefit="I'll begin understanding your project's direction",
                        estimated_time="5-10 minutes"
                    ),
                    ActionStep(
                        step="Add context about your goals",
                        description="Explain what you want to achieve with this project",
                        user_benefit="I can tailor my assistance to your specific objectives",
                        estimated_time="5 minutes"
                    )
                ],
                expected_outcome="I'll develop initial understanding and can begin offering targeted insights",
                timeframe=GuidanceTimeframe.IMMEDIATE,
                difficulty=GuidanceDifficulty.BEGINNER_FRIENDLY
            ))
        
        elif stage == "understanding" and themes_count < 3:
            guidance.append(StrategicGuidance(
                title="Expand Your Content for Deeper Insights",
                description="Build on your initial content to develop stronger themes and more meaningful guidance",
                recommendation="Add 3-5 more pieces of content to help me identify clear patterns and themes in your work",
                reasoning="With more content, I can move beyond basic understanding to identify meaningful themes and provide strategic insights about your project's direction.",
                action_plan=[
                    ActionStep(
                        step="Add related documents or ideas",
                        description="Include materials that expand on your initial content",
                        user_benefit="I'll start seeing patterns and themes in your work",
                        estimated_time="15-20 minutes"
                    ),
                    ActionStep(
                        step="Provide more detailed thoughts",
                        description="Elaborate on the ideas you've already shared",
                        user_benefit="I'll develop richer understanding of your perspective",
                        estimated_time="10-15 minutes"
                    )
                ],
                expected_outcome="Clear themes will emerge and I can provide thematic insights and strategic guidance",
                timeframe=GuidanceTimeframe.IMMEDIATE,
                difficulty=GuidanceDifficulty.BEGINNER_FRIENDLY
            ))
        
        elif stage in ["insights", "deep_knowledge"]:
            guidance.append(StrategicGuidance(
                title="Leverage Strategic Insights for Development",
                description="Use the comprehensive understanding we've built to make strategic decisions about your project's future",
                recommendation="Focus on the strategic opportunities I've identified and plan your next development phases",
                reasoning="With strong thematic development, you can now make strategic decisions about direction, priorities, and opportunities that will maximize your project's impact.",
                action_plan=[
                    ActionStep(
                        step="Review strategic insights",
                        description="Examine the patterns and opportunities I've identified",
                        user_benefit="Understand your project from a strategic perspective",
                        estimated_time="15-20 minutes"
                    ),
                    ActionStep(
                        step="Prioritize development areas",
                        description="Choose which aspects of your project to focus on next",
                        user_benefit="Make informed decisions about resource allocation",
                        estimated_time="20-30 minutes"
                    )
                ],
                expected_outcome="Clear strategic direction and actionable plans for maximizing your project's potential",
                timeframe=GuidanceTimeframe.MEDIUM_TERM,
                difficulty=GuidanceDifficulty.ADVANCED_FOCUS
            ))
        
        return guidance
    
    def _create_organization_guidance(
        self,
        understanding: ProjectUnderstanding,
        technical_analysis: Any
    ) -> List[StrategicGuidance]:
        """Create organization-focused guidance."""
        
        guidance = []
        themes_count = len(understanding.discovered_themes)
        
        if themes_count >= 3:
            guidance.append(StrategicGuidance(
                title="Organize Content Around Key Themes",
                description="Structure your content to highlight the important themes and connections I've identified",
                recommendation="Group related content together and create clear pathways between connected ideas",
                reasoning="With substantial content, organization becomes crucial for maintaining clarity and enabling deeper insights. Good organization also makes your project more accessible and actionable.",
                action_plan=[
                    ActionStep(
                        step="Group content by theme",
                        description="Organize related materials around your key themes",
                        user_benefit="Make your project structure more clear and navigable",
                        estimated_time="20-30 minutes"
                    ),
                    ActionStep(
                        step="Create clear connections",
                        description="Establish explicit relationships between related ideas",
                        user_benefit="Help others (and yourself) understand how ideas relate",
                        estimated_time="15-25 minutes"
                    )
                ],
                expected_outcome="Well-organized project that clearly communicates your themes and supports deeper exploration",
                timeframe=GuidanceTimeframe.SHORT_TERM,
                difficulty=GuidanceDifficulty.MODERATE_EFFORT
            ))
        
        return guidance
    
    def _create_creativity_guidance(
        self,
        understanding: ProjectUnderstanding,
        technical_analysis: Any
    ) -> List[StrategicGuidance]:
        """Create creativity-focused guidance."""
        
        guidance = []
        stage = understanding.intelligence_level["stage"]
        
        if stage in ["insights", "deep_knowledge"]:
            guidance.append(StrategicGuidance(
                title="Explore Creative Synthesis Opportunities",
                description="Use the deep understanding we've developed to discover creative possibilities in your project",
                recommendation="Look for unexpected connections and novel approaches that emerge from your established themes",
                reasoning="With strong foundational understanding, you can now safely explore creative territories. The insights I've developed provide a solid base for creative experimentation.",
                action_plan=[
                    ActionStep(
                        step="Identify synthesis opportunities",
                        description="Look for ways to combine or connect different themes creatively",
                        user_benefit="Discover innovative approaches unique to your project",
                        estimated_time="20-30 minutes"
                    ),
                    ActionStep(
                        step="Experiment with new perspectives",
                        description="View your established themes from unexpected angles",
                        user_benefit="Uncover fresh insights and possibilities",
                        estimated_time="25-35 minutes"
                    )
                ],
                expected_outcome="Creative insights that add unique value and distinguish your project",
                timeframe=GuidanceTimeframe.MEDIUM_TERM,
                difficulty=GuidanceDifficulty.ADVANCED_FOCUS
            ))
        
        return guidance
    
    def _create_completion_guidance(
        self,
        understanding: ProjectUnderstanding,
        technical_analysis: Any
    ) -> List[StrategicGuidance]:
        """Create completion-focused guidance."""
        
        guidance = []
        stage = understanding.intelligence_level["stage"]
        
        if stage in ["insights", "deep_knowledge"]:
            guidance.append(StrategicGuidance(
                title="Prepare for Project Completion and Impact",
                description="Transform your well-developed project into something that can be shared, implemented, or used",
                recommendation="Focus on making your project's value clear and accessible to others who might benefit from it",
                reasoning="Your project has reached maturity. The focus should shift from development to completion, refinement, and preparation for impact or sharing.",
                action_plan=[
                    ActionStep(
                        step="Clarify key messages",
                        description="Distill your project's most important insights and findings",
                        user_benefit="Communicate your project's value clearly",
                        estimated_time="30-45 minutes"
                    ),
                    ActionStep(
                        step="Create accessible summaries",
                        description="Develop materials that help others understand your work",
                        user_benefit="Make your project's benefits available to broader audience",
                        estimated_time="45-60 minutes"
                    )
                ],
                expected_outcome="Completed project ready for sharing, implementation, or practical application",
                timeframe=GuidanceTimeframe.LONG_TERM,
                difficulty=GuidanceDifficulty.ADVANCED_FOCUS
            ))
        
        return guidance
    
    def _create_development_priorities(
        self,
        understanding: ProjectUnderstanding,
        technical_analysis: Any
    ) -> List[DevelopmentPriority]:
        """Create development priority recommendations."""
        
        priorities = []
        themes_count = len(understanding.discovered_themes)
        stage = understanding.intelligence_level["stage"]
        
        # Content development priority
        if stage == "learning":
            priorities.append(DevelopmentPriority(
                area="Content Foundation",
                importance="critical",
                rationale="Your project needs more content to develop strong themes and meaningful insights",
                suggested_actions=[
                    "Add 3-5 more documents or ideas",
                    "Expand on existing content with more detail",
                    "Include background information and context"
                ],
                success_indicators=[
                    "Clear themes emerge from your content",
                    "I can provide more specific guidance",
                    "Connections between ideas become visible"
                ]
            ))
        
        # Theme development priority
        if themes_count > 0 and themes_count < 3:
            priorities.append(DevelopmentPriority(
                area="Theme Expansion",
                importance="high",
                rationale="You have good initial themes that could be developed into a richer understanding",
                suggested_actions=[
                    "Explore each theme in more depth",
                    "Add content that supports or challenges your themes",
                    "Look for connections between different themes"
                ],
                success_indicators=[
                    "Themes become more nuanced and detailed",
                    "Clear relationships between themes emerge",
                    "Strategic insights become possible"
                ]
            ))
        
        return sorted(priorities, key=lambda p: self._priority_weight(p.importance))
    
    def _create_health_assessment(
        self,
        understanding: ProjectUnderstanding,
        technical_analysis: Any,
        previous_analysis: Optional[Dict[str, Any]]
    ) -> ProjectHealthAssessment:
        """Create comprehensive project health assessment."""
        
        stage = understanding.intelligence_level["stage"]
        themes_count = len(understanding.discovered_themes)
        confidence_level = understanding.confidence["level"]
        
        # Determine overall health
        overall_health = self._assess_overall_health(stage, themes_count, confidence_level)
        
        # Identify strengths
        strengths = self._identify_project_strengths(understanding, technical_analysis)
        
        # Identify improvement areas
        improvement_areas = self._identify_improvement_areas(understanding, technical_analysis)
        
        # Generate health recommendations
        recommendations = self._generate_health_recommendations(strengths, improvement_areas, stage)
        
        # Assess trajectory
        progress_trajectory = self._assess_progress_trajectory(technical_analysis, previous_analysis)
        
        return ProjectHealthAssessment(
            overall_health=overall_health,
            strengths=strengths,
            improvement_areas=improvement_areas,
            recommendations=recommendations,
            progress_trajectory=progress_trajectory
        )
    
    def _create_creative_opportunities(
        self,
        understanding: ProjectUnderstanding,
        technical_analysis: Any
    ) -> List[CreativeOpportunity]:
        """Create creative opportunity recommendations."""
        
        opportunities = []
        themes = understanding.discovered_themes
        
        # Theme-based creative opportunities
        if len(themes) >= 2:
            opportunities.append(CreativeOpportunity(
                opportunity="Theme Synthesis",
                description=f"Explore how your {len(themes)} different themes might work together in unexpected ways",
                inspirational_prompt=f"What if {themes[0]['name']} and {themes[1]['name']} were more connected than they appear?",
                exploration_steps=[
                    "Look for subtle connections between your main themes",
                    "Consider how combining themes might create new insights",
                    "Experiment with ideas that bridge different areas"
                ],
                potential_outcomes=[
                    "Discover innovative approaches to your project",
                    "Find unique angles that haven't been explored",
                    "Create synthesis that adds value beyond individual themes"
                ]
            ))
        
        # Content gap opportunities
        stage = understanding.intelligence_level["stage"]
        if stage in ["understanding", "insights"]:
            opportunities.append(CreativeOpportunity(
                opportunity="Content Gap Exploration",
                description="Identify and explore areas where your project could expand in interesting directions",
                inspirational_prompt="What important aspects of your project haven't been fully explored yet?",
                exploration_steps=[
                    "Review your content for potential gaps or missing perspectives",
                    "Consider alternative viewpoints on your existing themes",
                    "Explore the edges and boundaries of your current focus"
                ],
                potential_outcomes=[
                    "Discover new dimensions of your project",
                    "Add depth and richness to existing themes",
                    "Find unique angles that strengthen your work"
                ]
            ))
        
        return opportunities[:4]  # Return top 4 opportunities
    
    def _create_immediate_steps(
        self,
        understanding: ProjectUnderstanding,
        technical_analysis: Any,
        user_goal: Optional[str]
    ) -> List[ActionStep]:
        """Create immediate action steps."""
        
        steps = []
        stage = understanding.intelligence_level["stage"]
        
        if stage == "learning":
            steps.append(ActionStep(
                step="Add your first content",
                description="Share a document, idea, or material to begin building understanding",
                user_benefit="I'll start learning about your project and can provide initial guidance",
                estimated_time="10-15 minutes"
            ))
        elif stage == "understanding":
            if user_goal == "organize":
                steps.append(ActionStep(
                    step="Group content by theme",
                    description="Organize your materials around the themes I've identified",
                    user_benefit="Create clearer structure and improved navigation",
                    estimated_time="15-25 minutes"
                ))
            else:
                steps.append(ActionStep(
                    step="Deepen your strongest theme",
                    description="Add more content that explores your primary theme in greater detail",
                    user_benefit="Develop richer understanding and unlock strategic insights",
                    estimated_time="20-30 minutes"
                ))
        elif stage in ["insights", "deep_knowledge"]:
            if user_goal == "complete":
                steps.append(ActionStep(
                    step="Clarify key insights",
                    description="Identify and articulate your project's most important findings",
                    user_benefit="Prepare your work for sharing or implementation",
                    estimated_time="30-45 minutes"
                ))
            else:
                steps.append(ActionStep(
                    step="Explore strategic opportunities",
                    description="Review the insights I've developed for strategic possibilities",
                    user_benefit="Identify high-impact directions for continued development",
                    estimated_time="20-30 minutes"
                ))
        
        return steps
    
    def _create_short_term_goals(
        self,
        understanding: ProjectUnderstanding,
        user_goal: Optional[str]
    ) -> List[str]:
        """Create short-term goal recommendations."""
        
        goals = []
        stage = understanding.intelligence_level["stage"]
        
        if stage == "learning":
            goals.extend([
                "Establish 3-5 pieces of foundational content",
                "Develop initial themes and direction",
                "Create basis for meaningful AI insights"
            ])
        elif stage == "understanding":
            goals.extend([
                "Identify 2-3 clear project themes",
                "Build content base to 8-10 substantial pieces",
                "Enable strategic guidance and recommendations"
            ])
        elif stage == "insights":
            goals.extend([
                "Strengthen thematic development across all themes",
                "Create clear connections between different content areas",
                "Achieve rich project state with sophisticated insights"
            ])
        elif stage == "deep_knowledge":
            if user_goal == "complete":
                goals.extend([
                    "Prepare project for sharing or implementation",
                    "Create clear summaries of key insights",
                    "Develop actionable outcomes from your work"
                ])
            else:
                goals.extend([
                    "Leverage insights for strategic planning",
                    "Explore creative synthesis opportunities",
                    "Plan next phase development initiatives"
                ])
        
        return goals
    
    def _create_strategic_considerations(
        self,
        understanding: ProjectUnderstanding,
        technical_analysis: Any,
        user_goal: Optional[str]
    ) -> List[str]:
        """Create strategic considerations."""
        
        considerations = ["Balance depth and breadth in your content development"]
        
        themes_count = len(understanding.discovered_themes)
        if themes_count >= 2:
            considerations.append("Consider how your themes might work together synergistically")
        
        stage = understanding.intelligence_level["stage"]
        if stage in ["insights", "deep_knowledge"]:
            considerations.extend([
                "Think about how to make your insights accessible to others",
                "Consider the practical applications of your developed understanding"
            ])
        
        # Goal-specific considerations
        if user_goal == "explore":
            considerations.append("Remain open to unexpected directions and connections")
        elif user_goal == "develop":
            considerations.append("Focus on areas with the highest potential for meaningful growth")
        elif user_goal == "organize":
            considerations.append("Structure should serve understanding, not just tidiness")
        elif user_goal == "complete":
            considerations.append("Consider your intended audience and how they will use your work")
        
        return considerations[:4]
    
    # Helper methods
    def _priority_weight(self, importance: str) -> int:
        """Convert importance to numeric weight for sorting."""
        weights = {"critical": 1, "high": 2, "medium": 3, "low": 4}
        return weights.get(importance, 5)
    
    def _assess_overall_health(self, stage: str, themes_count: int, confidence_level: str) -> ProjectHealthLevel:
        """Assess overall project health."""
        if stage == "deep_knowledge" and themes_count >= 3:
            return ProjectHealthLevel.EXCELLENT
        elif stage == "insights" and themes_count >= 2:
            return ProjectHealthLevel.GOOD
        elif stage == "understanding" and themes_count >= 1:
            return ProjectHealthLevel.DEVELOPING
        else:
            return ProjectHealthLevel.NEEDS_ATTENTION
    
    def _identify_project_strengths(self, understanding: ProjectUnderstanding, technical_analysis: Any) -> List[str]:
        """Identify project strengths."""
        strengths = []
        themes_count = len(understanding.discovered_themes)
        stage = understanding.intelligence_level["stage"]
        
        if themes_count >= 3:
            strengths.append("Rich thematic development with multiple strong themes")
        if stage in ["insights", "deep_knowledge"]:
            strengths.append("Mature project development with clear direction")
        if understanding.confidence["level"] == "comprehensive_knowledge":
            strengths.append("Deep AI understanding enabling strategic insights")
        
        return strengths if strengths else ["Good foundation for continued development"]
    
    def _identify_improvement_areas(self, understanding: ProjectUnderstanding, technical_analysis: Any) -> List[str]:
        """Identify areas for improvement."""
        improvements = []
        themes_count = len(understanding.discovered_themes)
        stage = understanding.intelligence_level["stage"]
        
        if themes_count == 0:
            improvements.append("Theme development needs attention to create clearer focus")
        if stage == "learning":
            improvements.append("Overall project development requires more substantial content")
        if understanding.confidence["level"] == "just_getting_started":
            improvements.append("AI understanding needs more content to provide meaningful insights")
        
        return improvements if improvements else ["Continue building on your strong foundation"]
    
    def _generate_health_recommendations(
        self,
        strengths: List[str],
        improvements: List[str],
        stage: str
    ) -> List[HealthRecommendation]:
        """Generate health recommendations."""
        recommendations = []
        
        # Based on improvement areas
        for improvement in improvements:
            if "content foundation" in improvement.lower():
                recommendations.append(HealthRecommendation(
                    focus="Content Development",
                    suggestion="Add 3-5 more documents or detailed ideas to strengthen your foundation",
                    impact="high",
                    effort="moderate"
                ))
            elif "theme development" in improvement.lower():
                recommendations.append(HealthRecommendation(
                    focus="Theme Clarity",
                    suggestion="Focus your content around 2-3 clear themes to create stronger direction",
                    impact="high",
                    effort="moderate"
                ))
        
        # Based on project stage
        if stage in ["insights", "deep_knowledge"]:
            recommendations.append(HealthRecommendation(
                focus="Strategic Planning",
                suggestion="Leverage your mature development for strategic planning and next steps",
                impact="high",
                effort="significant"
            ))
        
        return recommendations[:4]
    
    def _assess_progress_trajectory(
        self,
        current_analysis: Any,
        previous_analysis: Optional[Dict[str, Any]]
    ) -> ProgressTrajectory:
        """Assess progress trajectory."""
        if not previous_analysis:
            return ProgressTrajectory.STEADY
        
        # Simple heuristic based on analysis complexity
        # In a real implementation, this would compare actual metrics
        return ProgressTrajectory.STEADY
    
    # Fallback methods
    def _create_fallback_guidance(self) -> List[StrategicGuidance]:
        """Create fallback guidance when analysis fails."""
        return [
            StrategicGuidance(
                title="Continue Building Your Project",
                description="Keep adding content and developing your ideas",
                recommendation="Add more material to help me provide better guidance",
                reasoning="More content enables more sophisticated guidance and insights",
                action_plan=[
                    ActionStep(
                        step="Add more content",
                        description="Share additional documents, ideas, or materials",
                        user_benefit="Enable better analysis and guidance",
                        estimated_time="15-30 minutes"
                    )
                ],
                expected_outcome="Improved ability to provide strategic guidance",
                timeframe=GuidanceTimeframe.IMMEDIATE,
                difficulty=GuidanceDifficulty.BEGINNER_FRIENDLY
            )
        ]
    
    def _create_fallback_priorities(self) -> List[DevelopmentPriority]:
        """Create fallback priorities when analysis fails."""
        return [
            DevelopmentPriority(
                area="Content Development",
                importance="high",
                rationale="More content is needed to provide meaningful guidance",
                suggested_actions=["Add more project materials"],
                success_indicators=["Better AI understanding of your project"]
            )
        ]
    
    def _create_fallback_health_assessment(self) -> ProjectHealthAssessment:
        """Create fallback health assessment."""
        return ProjectHealthAssessment(
            overall_health=ProjectHealthLevel.NEEDS_ATTENTION,
            strengths=["Ready for development"],
            improvement_areas=["Needs more content for analysis"],
            recommendations=[
                HealthRecommendation(
                    focus="Content Addition",
                    suggestion="Add more content to enable meaningful analysis",
                    impact="high",
                    effort="moderate"
                )
            ],
            progress_trajectory=ProgressTrajectory.STEADY
        )
    
    def _create_fallback_opportunities(self) -> List[CreativeOpportunity]:
        """Create fallback creative opportunities."""
        return [
            CreativeOpportunity(
                opportunity="Content Development",
                description="Begin building your project foundation",
                inspirational_prompt="What interesting directions could your project take?",
                exploration_steps=["Add more content", "Explore different perspectives"],
                potential_outcomes=["Establish strong project foundation"]
            )
        ]
    
    def _create_fallback_next_steps(self) -> Dict[str, Any]:
        """Create fallback next steps."""
        return {
            "immediate_steps": [
                ActionStep(
                    step="Add content",
                    description="Share more about your project",
                    user_benefit="Enable better guidance",
                    estimated_time="15 minutes"
                )
            ],
            "short_term_goals": ["Build project foundation"],
            "strategic_considerations": ["Focus on adding quality content"]
        }