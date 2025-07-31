"""
Narrative Agent: AI Assistant

This agent provides conversational AI assistance and guidance for users.
It coordinates with infrastructure agents to provide friendly, helpful interactions.

CRITICAL: This agent must ONLY contain user-facing conversational language.
It consumes technical substrate and produces human-centered assistance.
"""

import logging
from typing import Dict, List, Optional, Any
from enum import Enum

from .project_understanding_agent import ProjectUnderstandingAgent, ProjectUnderstanding

logger = logging.getLogger("uvicorn.error")


class ConversationalTone(str, Enum):
    HELPFUL = "helpful"
    ENCOURAGING = "encouraging"
    INSIGHTFUL = "insightful"
    COLLABORATIVE = "collaborative"
    STRATEGIC = "strategic"


class AssistantPersonality(str, Enum):
    CURIOUS_LEARNER = "curious_learner"
    KNOWLEDGEABLE_GUIDE = "knowledgeable_guide"
    STRATEGIC_PARTNER = "strategic_partner"
    CREATIVE_COLLABORATOR = "creative_collaborator"


class UserEngagementLevel(str, Enum):
    NEW_USER = "new_user"
    EXPLORING = "exploring"
    ACTIVELY_BUILDING = "actively_building"
    SEEKING_INSIGHTS = "seeking_insights"


class ConversationFlow(str, Enum):
    GREETING = "greeting"
    GUIDANCE = "guidance"
    ANALYSIS_SHARING = "analysis_sharing"
    PROBLEM_SOLVING = "problem_solving"
    BRAINSTORMING = "brainstorming"


class ConversationalSuggestion:
    """User-facing conversational suggestion."""
    
    def __init__(
        self,
        action: str,
        description: str,
        user_benefit: str,
        priority: str = "helpful"
    ):
        self.action = action
        self.description = description
        self.user_benefit = user_benefit
        self.priority = priority  # 'immediate', 'helpful', 'explore_later'


class ConversationalResponse:
    """Complete conversational response structure."""
    
    def __init__(
        self,
        message: str,
        tone: ConversationalTone,
        suggestions: List[ConversationalSuggestion],
        follow_up_questions: List[str],
        assistant_personality: AssistantPersonality,
        user_engagement_level: UserEngagementLevel,
        conversation_flow: ConversationFlow
    ):
        self.message = message
        self.tone = tone
        self.suggestions = suggestions
        self.follow_up_questions = follow_up_questions
        self.assistant_personality = assistant_personality
        self.user_engagement_level = user_engagement_level
        self.conversation_flow = conversation_flow


class ContextualHelp:
    """Contextual help for specific situations."""
    
    def __init__(
        self,
        situation: str,
        help_message: str,
        quick_actions: List[Dict[str, str]],
        learning_opportunity: Optional[str] = None
    ):
        self.situation = situation
        self.help_message = help_message
        self.quick_actions = quick_actions
        self.learning_opportunity = learning_opportunity


class ProgressEncouragement:
    """Progress encouragement messages."""
    
    def __init__(
        self,
        celebration_message: str,
        progress_highlight: str,
        motivational_guidance: str,
        next_milestone: str
    ):
        self.celebration_message = celebration_message
        self.progress_highlight = progress_highlight
        self.motivational_guidance = motivational_guidance
        self.next_milestone = next_milestone


class AIAssistantAgent:
    """
    Narrative Agent: AI Assistant
    
    Provides conversational AI assistance with human-centered communication.
    Contains ONLY user-facing conversational and guidance language.
    """
    
    def __init__(self, workspace_id: str):
        self.workspace_id = workspace_id
        self.agent_id = "narrative_ai_assistant"
    
    async def generate_conversational_response(
        self,
        basket_id: str,
        user_query: Optional[str] = None,
        user_context: Optional[Dict[str, str]] = None
    ) -> ConversationalResponse:
        """Generate contextual conversational response based on project state."""
        
        try:
            # Get current project understanding
            understanding_agent = ProjectUnderstandingAgent(self.workspace_id)
            understanding = await understanding_agent.create_project_understanding(
                basket_id, user_context
            )
            
            # Determine conversation characteristics
            personality = self._determine_personality(understanding)
            engagement_level = self._assess_engagement_level(understanding)
            conversation_flow = self._identify_conversation_flow(user_query, understanding)
            
            # Craft contextual message
            message = self._craft_contextual_message(
                understanding, user_query, personality, conversation_flow
            )
            
            # Generate suggestions and follow-ups
            suggestions = self._generate_contextual_suggestions(understanding, engagement_level)
            follow_up_questions = self._create_follow_up_questions(understanding, conversation_flow)
            tone = self._select_tone(personality, conversation_flow)
            
            return ConversationalResponse(
                message=message,
                tone=tone,
                suggestions=suggestions,
                follow_up_questions=follow_up_questions,
                assistant_personality=personality,
                user_engagement_level=engagement_level,
                conversation_flow=conversation_flow
            )
            
        except Exception as e:
            logger.exception(f"Failed to generate conversational response for {basket_id}: {e}")
            return self._create_fallback_response(user_query)
    
    async def create_contextual_help(
        self,
        basket_id: str,
        situation: str
    ) -> ContextualHelp:
        """Create contextual help for specific situations."""
        
        try:
            understanding_agent = ProjectUnderstandingAgent(self.workspace_id)
            understanding = await understanding_agent.create_project_understanding(basket_id)
            
            return self._create_situation_help(situation, understanding)
            
        except Exception as e:
            logger.exception(f"Failed to create contextual help for {basket_id}: {e}")
            return self._create_fallback_help(situation)
    
    async def create_progress_encouragement(
        self,
        basket_id: str,
        recent_activity: Optional[Dict[str, int]] = None
    ) -> ProgressEncouragement:
        """Generate encouraging progress messages."""
        
        try:
            understanding_agent = ProjectUnderstandingAgent(self.workspace_id)
            understanding = await understanding_agent.create_project_understanding(basket_id)
            
            return self._create_encouragement_messages(understanding, recent_activity)
            
        except Exception as e:
            logger.exception(f"Failed to create progress encouragement for {basket_id}: {e}")
            return self._create_fallback_encouragement()
    
    def generate_conversation_starters(
        self,
        understanding: ProjectUnderstanding,
        context_type: str = "general"
    ) -> List[str]:
        """Generate conversation starters based on project state."""
        
        stage = understanding.intelligence_level["stage"]
        themes = understanding.discovered_themes
        
        starters = []
        
        if stage == "learning":
            starters.extend([
                "I'm ready to learn about your project - what are you working on?",
                "What's the most important thing I should understand about your work?",
                "Tell me about your goals for this project"
            ])
        elif stage == "understanding":
            starters.extend([
                "I'm developing a good sense of your project - what would you like to explore?",
                "What aspects of your work would you like me to focus on?",
                "I see some interesting patterns emerging - shall we discuss them?"
            ])
        elif stage == "insights":
            starters.extend([
                "I have solid insights about your project - what would you like to know?",
                "I can see interesting connections in your work - want to explore them?",
                "What strategic questions can I help you think through?"
            ])
        elif stage == "deep_knowledge":
            starters.extend([
                "I have comprehensive understanding of your project - how can I help?",
                "What strategic opportunities should we explore together?",
                "I can offer deep insights - what interests you most?"
            ])
        
        # Add theme-specific starters
        if themes:
            main_theme = themes[0]["name"]
            starters.append(f"I notice {main_theme} is important in your work - want to discuss it?")
        
        return starters[:4]
    
    def generate_suggested_topics(self, understanding: ProjectUnderstanding) -> List[str]:
        """Generate suggested conversation topics."""
        
        topics = ["Project overview", "Next steps", "Progress so far"]
        
        stage = understanding.intelligence_level["stage"]
        themes = understanding.discovered_themes
        
        # Stage-specific topics
        if stage in ["understanding", "insights", "deep_knowledge"]:
            topics.append("Themes and patterns")
        
        if stage in ["insights", "deep_knowledge"]:
            topics.extend(["Strategic insights", "Connections between ideas"])
        
        if stage == "deep_knowledge":
            topics.extend(["Creative opportunities", "Strategic planning"])
        
        # Theme-specific topics
        for theme in themes[:3]:
            topics.append(f"{theme['name']} exploration")
        
        return topics[:8]
    
    # Private conversation methods
    def _determine_personality(self, understanding: ProjectUnderstanding) -> AssistantPersonality:
        """Determine assistant personality based on project understanding level."""
        
        stage = understanding.intelligence_level["stage"]
        
        if stage == "learning":
            return AssistantPersonality.CURIOUS_LEARNER
        elif stage == "understanding":
            return AssistantPersonality.KNOWLEDGEABLE_GUIDE
        elif stage == "insights":
            return AssistantPersonality.STRATEGIC_PARTNER
        elif stage == "deep_knowledge":
            return AssistantPersonality.CREATIVE_COLLABORATOR
        else:
            return AssistantPersonality.CURIOUS_LEARNER
    
    def _assess_engagement_level(self, understanding: ProjectUnderstanding) -> UserEngagementLevel:
        """Assess user engagement level from project understanding."""
        
        confidence = understanding.confidence["level"]
        
        if confidence == "just_getting_started":
            return UserEngagementLevel.NEW_USER
        elif confidence == "building_understanding":
            return UserEngagementLevel.EXPLORING
        elif confidence == "solid_grasp":
            return UserEngagementLevel.ACTIVELY_BUILDING
        elif confidence == "comprehensive_knowledge":
            return UserEngagementLevel.SEEKING_INSIGHTS
        else:
            return UserEngagementLevel.NEW_USER
    
    def _identify_conversation_flow(
        self,
        user_query: Optional[str],
        understanding: ProjectUnderstanding
    ) -> ConversationFlow:
        """Identify the type of conversation flow."""
        
        if not user_query:
            confidence = understanding.confidence["level"]
            return ConversationFlow.GREETING if confidence == "just_getting_started" else ConversationFlow.GUIDANCE
        
        query_lower = user_query.lower()
        
        if any(word in query_lower for word in ["help", "how"]):
            return ConversationFlow.GUIDANCE
        elif any(word in query_lower for word in ["what", "analyze", "understand"]):
            return ConversationFlow.ANALYSIS_SHARING
        elif any(word in query_lower for word in ["idea", "think", "brainstorm"]):
            return ConversationFlow.BRAINSTORMING
        elif any(word in query_lower for word in ["problem", "stuck", "issue"]):
            return ConversationFlow.PROBLEM_SOLVING
        else:
            return ConversationFlow.GUIDANCE
    
    def _craft_contextual_message(
        self,
        understanding: ProjectUnderstanding,
        user_query: Optional[str],
        personality: AssistantPersonality,
        flow: ConversationFlow
    ) -> str:
        """Craft contextual message based on conversation parameters."""
        
        if user_query:
            return self._respond_to_user_query(user_query, understanding, personality)
        
        if flow == ConversationFlow.GREETING:
            return understanding.personalized_greeting
        elif flow == ConversationFlow.GUIDANCE:
            return self._create_guidance_message(understanding, personality)
        elif flow == ConversationFlow.ANALYSIS_SHARING:
            return self._create_analysis_message(understanding, personality)
        else:
            return self._create_general_message(understanding, personality)
    
    def _respond_to_user_query(
        self,
        query: str,
        understanding: ProjectUnderstanding,
        personality: AssistantPersonality
    ) -> str:
        """Respond to specific user query."""
        
        query_lower = query.lower()
        
        if "help" in query_lower:
            return self._create_help_response(understanding, personality)
        elif any(word in query_lower for word in ["understand", "know"]):
            return understanding.current_understanding
        elif any(word in query_lower for word in ["theme", "pattern"]):
            return self._create_theme_response(understanding, personality)
        elif any(word in query_lower for word in ["next", "should"]):
            return self._create_next_steps_response(understanding, personality)
        else:
            return self._create_general_response(query, understanding, personality)
    
    def _create_guidance_message(
        self,
        understanding: ProjectUnderstanding,
        personality: AssistantPersonality
    ) -> str:
        """Create guidance message based on personality."""
        
        next_step = understanding.next_steps[0] if understanding.next_steps else "continue building your project"
        
        if personality == AssistantPersonality.CURIOUS_LEARNER:
            return f"I'm eager to understand your project better! Based on what I know so far, I'd suggest: {next_step}"
        elif personality == AssistantPersonality.KNOWLEDGEABLE_GUIDE:
            return f"Here's what I recommend for your project's development: {next_step}"
        elif personality == AssistantPersonality.STRATEGIC_PARTNER:
            return f"From a strategic perspective, your next move should be: {next_step}"
        else:  # CREATIVE_COLLABORATOR
            return f"Let's explore this together! I think we should: {next_step}"
    
    def _create_analysis_message(
        self,
        understanding: ProjectUnderstanding,
        personality: AssistantPersonality
    ) -> str:
        """Create analysis sharing message."""
        
        theme_count = len(understanding.discovered_themes)
        confidence_desc = understanding.confidence["explanation"]
        
        if personality == AssistantPersonality.CURIOUS_LEARNER:
            return f"I'm learning so much about your project! I've discovered {theme_count} key themes and {confidence_desc.lower()}"
        elif personality == AssistantPersonality.KNOWLEDGEABLE_GUIDE:
            return f"My analysis shows {theme_count} main themes in your work. {confidence_desc}"
        elif personality == AssistantPersonality.STRATEGIC_PARTNER:
            return f"Strategically, I see {theme_count} core themes that define your project. {confidence_desc}"
        else:  # CREATIVE_COLLABORATOR
            return f"What fascinates me is how {theme_count} themes weave through your work! {confidence_desc}"
    
    def _create_general_message(
        self,
        understanding: ProjectUnderstanding,
        personality: AssistantPersonality
    ) -> str:
        """Create general message based on personality."""
        
        if personality == AssistantPersonality.CURIOUS_LEARNER:
            return f"I'm excited to learn more about your project! {understanding.current_understanding}"
        elif personality == AssistantPersonality.KNOWLEDGEABLE_GUIDE:
            return f"I'm here to guide you through your project development. {understanding.current_understanding}"
        elif personality == AssistantPersonality.STRATEGIC_PARTNER:
            return f"Let's work together strategically on your project. {understanding.current_understanding}"
        else:  # CREATIVE_COLLABORATOR
            return f"I'm ready to collaborate creatively with you! {understanding.current_understanding}"
    
    def _generate_contextual_suggestions(
        self,
        understanding: ProjectUnderstanding,
        engagement_level: UserEngagementLevel
    ) -> List[ConversationalSuggestion]:
        """Generate contextual suggestions based on engagement level."""
        
        suggestions = []
        
        if engagement_level == UserEngagementLevel.NEW_USER:
            suggestions.extend([
                ConversationalSuggestion(
                    action="Share your first idea or document",
                    description="Tell me about what you're working on so I can start understanding",
                    user_benefit="I'll begin learning about your project and can offer initial insights",
                    priority="immediate"
                ),
                ConversationalSuggestion(
                    action="Upload a relevant file",
                    description="Share any documents, notes, or materials related to your project",
                    user_benefit="I can analyze your existing work and understand your context faster",
                    priority="helpful"
                )
            ])
        elif engagement_level == UserEngagementLevel.EXPLORING:
            suggestions.extend([
                ConversationalSuggestion(
                    action="Add more context about your goals",
                    description="Tell me more about what you're trying to achieve",
                    user_benefit="I can provide more targeted guidance and suggestions",
                    priority="immediate"
                ),
                ConversationalSuggestion(
                    action="Explore the themes I've identified",
                    description="Review the patterns I'm seeing in your work",
                    user_benefit="Confirm whether my understanding aligns with your vision",
                    priority="helpful"
                )
            ])
        elif engagement_level == UserEngagementLevel.ACTIVELY_BUILDING:
            suggestions.extend([
                ConversationalSuggestion(
                    action="Ask me about connections I've found",
                    description="I can share insights about relationships in your work",
                    user_benefit="Discover unexpected connections that might inspire new directions",
                    priority="immediate"
                ),
                ConversationalSuggestion(
                    action="Request strategic guidance",
                    description="I can offer suggestions for developing your project further",
                    user_benefit="Get AI-powered recommendations for your next steps",
                    priority="helpful"
                )
            ])
        elif engagement_level == UserEngagementLevel.SEEKING_INSIGHTS:
            suggestions.extend([
                ConversationalSuggestion(
                    action="Dive deep into my analysis",
                    description="Explore the comprehensive insights I've developed",
                    user_benefit="Uncover sophisticated patterns and strategic opportunities",
                    priority="immediate"
                ),
                ConversationalSuggestion(
                    action="Collaborate on strategic planning",
                    description="Work together to plan your project's future direction",
                    user_benefit="Leverage my deep understanding for strategic decision-making",
                    priority="helpful"
                )
            ])
        
        return suggestions
    
    def _create_follow_up_questions(
        self,
        understanding: ProjectUnderstanding,
        flow: ConversationFlow
    ) -> List[str]:
        """Create follow-up questions based on conversation flow."""
        
        questions = []
        
        if flow == ConversationFlow.GREETING:
            questions.extend([
                "What kind of project are you working on?",
                "What would you like me to understand first?",
                "Do you have any materials you'd like to share?"
            ])
        elif flow == ConversationFlow.GUIDANCE:
            questions.extend([
                "What aspect of your project would you like to explore?",
                "Are there any specific challenges you're facing?",
                "What would be most helpful for me to focus on?"
            ])
        elif flow == ConversationFlow.ANALYSIS_SHARING:
            questions.extend([
                "Does my understanding of your project align with your vision?",
                "Are there themes I've missed that are important to you?",
                "What connections surprise you the most?"
            ])
        elif flow == ConversationFlow.BRAINSTORMING:
            questions.extend([
                "What ideas are you most excited to explore?",
                "Are there any directions you haven't considered yet?",
                "What would success look like for this project?"
            ])
        elif flow == ConversationFlow.PROBLEM_SOLVING:
            questions.extend([
                "What's the biggest challenge you're facing right now?",
                "Have you tried any approaches that didn't work?",
                "What resources or constraints should I be aware of?"
            ])
        
        return questions[:3]
    
    def _select_tone(
        self,
        personality: AssistantPersonality,
        flow: ConversationFlow
    ) -> ConversationalTone:
        """Select appropriate conversational tone."""
        
        if flow == ConversationFlow.GREETING:
            return ConversationalTone.ENCOURAGING
        elif flow == ConversationFlow.PROBLEM_SOLVING:
            return ConversationalTone.HELPFUL
        elif flow == ConversationFlow.BRAINSTORMING:
            return ConversationalTone.COLLABORATIVE
        
        # Based on personality
        if personality == AssistantPersonality.CURIOUS_LEARNER:
            return ConversationalTone.ENCOURAGING
        elif personality == AssistantPersonality.KNOWLEDGEABLE_GUIDE:
            return ConversationalTone.HELPFUL
        elif personality == AssistantPersonality.STRATEGIC_PARTNER:
            return ConversationalTone.STRATEGIC
        else:  # CREATIVE_COLLABORATOR
            return ConversationalTone.COLLABORATIVE
    
    # Specific response creation methods
    def _create_help_response(
        self,
        understanding: ProjectUnderstanding,
        personality: AssistantPersonality
    ) -> str:
        """Create help response based on personality."""
        
        next_step = understanding.next_steps[0] if understanding.next_steps else "continue building your project"
        
        if personality == AssistantPersonality.CURIOUS_LEARNER:
            return f"I'm here to help! Based on what I understand so far, I think the most helpful thing would be: {next_step}"
        elif personality == AssistantPersonality.KNOWLEDGEABLE_GUIDE:
            return f"I can definitely help you. My recommendation is: {next_step}"
        elif personality == AssistantPersonality.STRATEGIC_PARTNER:
            return f"Let me offer strategic guidance: {next_step}"
        else:  # CREATIVE_COLLABORATOR
            return f"I'd love to help! Let's try this approach: {next_step}"
    
    def _create_theme_response(
        self,
        understanding: ProjectUnderstanding,
        personality: AssistantPersonality
    ) -> str:
        """Create theme-focused response."""
        
        theme_count = len(understanding.discovered_themes)
        
        if theme_count == 0:
            return "I haven't identified distinct themes yet, but as you add more content, patterns will start to emerge!"
        
        main_theme = understanding.discovered_themes[0]["name"]
        
        if personality == AssistantPersonality.CURIOUS_LEARNER:
            return f"I'm fascinated by the {theme_count} themes I see! The strongest one seems to be {main_theme}."
        elif personality == AssistantPersonality.KNOWLEDGEABLE_GUIDE:
            return f"I've identified {theme_count} key themes, with {main_theme} being the most prominent."
        elif personality == AssistantPersonality.STRATEGIC_PARTNER:
            return f"Strategically, your {theme_count} themes center around {main_theme}, which could be leveraged for future development."
        else:  # CREATIVE_COLLABORATOR
            return f"What excites me is how {main_theme} weaves through your work as one of {theme_count} rich themes!"
    
    def _create_next_steps_response(
        self,
        understanding: ProjectUnderstanding,
        personality: AssistantPersonality
    ) -> str:
        """Create next steps response."""
        
        next_steps = understanding.next_steps[:2]
        steps_text = " or ".join(next_steps) if next_steps else "continue building your project"
        
        if personality == AssistantPersonality.CURIOUS_LEARNER:
            return f"I'm excited about what comes next! I'd suggest: {steps_text}."
        elif personality == AssistantPersonality.KNOWLEDGEABLE_GUIDE:
            return f"Based on my analysis, your best next steps are: {steps_text}."
        elif personality == AssistantPersonality.STRATEGIC_PARTNER:
            return f"From a strategic standpoint, you should: {steps_text}."
        else:  # CREATIVE_COLLABORATOR
            return f"Let's explore these possibilities together: {steps_text}."
    
    def _create_general_response(
        self,
        query: str,
        understanding: ProjectUnderstanding,
        personality: AssistantPersonality
    ) -> str:
        """Create general response to user query."""
        
        if personality == AssistantPersonality.CURIOUS_LEARNER:
            return f"That's an interesting question! Based on what I understand about your project so far: {understanding.current_understanding}"
        elif personality == AssistantPersonality.KNOWLEDGEABLE_GUIDE:
            return f"Let me share what I know that might help: {understanding.current_understanding}"
        elif personality == AssistantPersonality.STRATEGIC_PARTNER:
            return f"From a strategic perspective: {understanding.current_understanding}"
        else:  # CREATIVE_COLLABORATOR
            return f"That makes me think about your project in new ways! {understanding.current_understanding}"
    
    # Contextual help methods
    def _create_situation_help(self, situation: str, understanding: ProjectUnderstanding) -> ContextualHelp:
        """Create contextual help for specific situation."""
        
        if situation == "empty_project":
            return ContextualHelp(
                situation="Starting a new project",
                help_message="Every great project begins with a single idea. I'm here to grow alongside your thoughts and help you develop them into something meaningful.",
                quick_actions=[
                    {
                        "label": "Share your first idea",
                        "description": "Tell me what you're thinking about",
                        "outcome": "I'll start understanding your vision"
                    },
                    {
                        "label": "Upload a document",
                        "description": "Share any existing materials",
                        "outcome": "I'll analyze your content and find patterns"
                    }
                ],
                learning_opportunity="This is the perfect time to establish the foundation of our collaboration"
            )
        elif situation == "building_themes":
            theme_count = len(understanding.discovered_themes)
            return ContextualHelp(
                situation="Building thematic understanding",
                help_message=f"I've identified {theme_count} themes in your work and I'm starting to see how they connect. This is where your project really begins to take shape!",
                quick_actions=[
                    {
                        "label": "Explore theme connections",
                        "description": "See how your themes relate to each other",
                        "outcome": "Discover unexpected relationships in your work"
                    },
                    {
                        "label": "Develop weaker themes",
                        "description": "Add content to strengthen emerging themes",
                        "outcome": "Create more balanced thematic development"
                    }
                ],
                learning_opportunity="This is when projects often have breakthrough moments of clarity"
            )
        else:
            return ContextualHelp(
                situation="General project assistance",
                help_message="I'm here to help with whatever aspect of your project needs attention. My understanding continues to grow with every interaction.",
                quick_actions=[
                    {
                        "label": "Ask me anything",
                        "description": "Get insights about any aspect of your work",
                        "outcome": "Personalized guidance based on my understanding"
                    }
                ]
            )
    
    def _create_encouragement_messages(
        self,
        understanding: ProjectUnderstanding,
        recent_activity: Optional[Dict[str, int]]
    ) -> ProgressEncouragement:
        """Create progress encouragement messages."""
        
        stage = understanding.intelligence_level["stage"]
        
        # Celebration message
        if recent_activity and recent_activity.get("contentAdded", 0) > 0:
            content_added = recent_activity["contentAdded"]
            celebration = f"Excellent! You've added {content_added} new piece{'s' if content_added != 1 else ''} of content. Your project is really taking shape!"
        else:
            if stage == "learning":
                celebration = "Great start! Every project begins with those first important steps."
            elif stage == "understanding":
                celebration = "Wonderful progress! I'm developing a solid understanding of your work."
            elif stage == "insights":
                celebration = "Fantastic! Your project has reached a level where I can offer meaningful insights."
            else:
                celebration = "Amazing! We've built a comprehensive understanding together."
        
        # Progress highlight
        themes = len(understanding.discovered_themes)
        confidence = understanding.confidence["level"].replace("_", " ")
        if themes > 0:
            progress_highlight = f"I've identified {themes} key theme{'s' if themes != 1 else ''} and have {confidence} of your project."
        else:
            progress_highlight = understanding.confidence["explanation"]
        
        # Motivational guidance
        if confidence == "just getting started":
            motivation = "Every expert was once a beginner. Your project has unlimited potential!"
        elif confidence == "building understanding":
            motivation = "You're making excellent progress. Each addition strengthens our shared understanding."
        elif confidence == "solid grasp":
            motivation = "Your project is well-developed and ready for deeper exploration and insights."
        else:
            motivation = "You've built something impressive! Now we can focus on strategic opportunities."
        
        # Next milestone
        if stage == "learning":
            milestone = "Next milestone: Develop clear themes in your project"
        elif stage == "understanding":
            milestone = "Next milestone: Achieve strong thematic coherence"
        elif stage == "insights":
            milestone = "Next milestone: Leverage insights for strategic planning"
        else:
            milestone = "Next milestone: Execute strategic opportunities"
        
        return ProgressEncouragement(
            celebration_message=celebration,
            progress_highlight=progress_highlight,
            motivational_guidance=motivation,
            next_milestone=milestone
        )
    
    # Fallback methods
    def _create_fallback_response(self, user_query: Optional[str]) -> ConversationalResponse:
        """Create fallback response when analysis fails."""
        
        message = "I'm having a bit of trouble right now, but I'm still here to help! Could you try asking me again?"
        if user_query:
            message = f"I'm processing your question about '{user_query}' but having some difficulty. Let me try to help in a different way."
        
        return ConversationalResponse(
            message=message,
            tone=ConversationalTone.HELPFUL,
            suggestions=[
                ConversationalSuggestion(
                    action="Try your question again",
                    description="Sometimes a simple retry resolves temporary issues",
                    user_benefit="Get the response you were looking for",
                    priority="immediate"
                )
            ],
            follow_up_questions=[
                "What would you like to know about your project?",
                "Is there something specific I can help you with?"
            ],
            assistant_personality=AssistantPersonality.KNOWLEDGEABLE_GUIDE,
            user_engagement_level=UserEngagementLevel.EXPLORING,
            conversation_flow=ConversationFlow.GUIDANCE
        )
    
    def _create_fallback_help(self, situation: str) -> ContextualHelp:
        """Create fallback help when analysis fails."""
        
        return ContextualHelp(
            situation=situation,
            help_message="I'm here to help, though I'm having some difficulty accessing your project details right now.",
            quick_actions=[
                {
                    "label": "Try again",
                    "description": "Refresh and try your request again",
                    "outcome": "Get the help you're looking for"
                }
            ]
        )
    
    def _create_fallback_encouragement(self) -> ProgressEncouragement:
        """Create fallback encouragement when analysis fails."""
        
        return ProgressEncouragement(
            celebration_message="You're making progress on your project!",
            progress_highlight="Keep building - every step counts.",
            motivational_guidance="Great things take time and your project is heading in a positive direction.",
            next_milestone="Continue developing your project step by step"
        )