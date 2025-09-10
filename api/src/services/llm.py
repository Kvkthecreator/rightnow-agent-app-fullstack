"""
LLM Service - Claude Integration for YARNNN Agents

Provides structured interaction with Claude for agent processing.
Used by P4 Composition Agent for intelligent document creation.
"""

import json
import logging
import os
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
import anthropic

logger = logging.getLogger("uvicorn.error")


@dataclass
class LLMResponse:
    """Structured LLM response"""
    success: bool
    content: str
    parsed: Optional[Dict[str, Any]] = None
    usage: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class Claude:
    """
    Claude LLM client for YARNNN agent processing.
    
    Provides structured JSON responses for composition intelligence.
    """
    
    def __init__(self):
        self.api_key = os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable required")
        
        self.client = anthropic.Anthropic(api_key=self.api_key)
        logger.info("Claude LLM service initialized")
    
    async def get_json_response(
        self,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 4000,
        model: str = "claude-3-5-sonnet-20241022"
    ) -> LLMResponse:
        """
        Get structured JSON response from Claude.
        
        Used for composition agent intelligence that requires structured output.
        """
        try:
            # Wrap prompt to ensure JSON output
            structured_prompt = f"""
{prompt}

IMPORTANT: Respond with valid JSON only. Do not include any explanation or text outside the JSON structure.
"""
            
            response = self.client.messages.create(
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                messages=[
                    {
                        "role": "user",
                        "content": structured_prompt
                    }
                ]
            )
            
            content = response.content[0].text if response.content else ""
            
            # Parse JSON response
            try:
                parsed = json.loads(content.strip())
                return LLMResponse(
                    success=True,
                    content=content,
                    parsed=parsed,
                    usage={
                        "input_tokens": response.usage.input_tokens if response.usage else 0,
                        "output_tokens": response.usage.output_tokens if response.usage else 0
                    }
                )
            except json.JSONDecodeError as je:
                logger.warning(f"Failed to parse JSON response: {je}")
                # Try to extract JSON from response
                try:
                    # Look for JSON-like content between braces
                    import re
                    json_match = re.search(r'\{.*\}', content, re.DOTALL)
                    if json_match:
                        parsed = json.loads(json_match.group())
                        return LLMResponse(
                            success=True,
                            content=content,
                            parsed=parsed
                        )
                except:
                    pass
                
                return LLMResponse(
                    success=False,
                    content=content,
                    error=f"Invalid JSON response: {str(je)}"
                )
            
        except Exception as e:
            logger.error(f"Claude API error: {e}")
            return LLMResponse(
                success=False,
                content="",
                error=str(e)
            )
    
    async def get_text_response(
        self,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 4000,
        model: str = "claude-3-5-sonnet-20241022"
    ) -> LLMResponse:
        """
        Get unstructured text response from Claude.
        
        Used for narrative generation and prose composition.
        """
        try:
            response = self.client.messages.create(
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            
            content = response.content[0].text if response.content else ""
            
            return LLMResponse(
                success=True,
                content=content,
                usage={
                    "input_tokens": response.usage.input_tokens if response.usage else 0,
                    "output_tokens": response.usage.output_tokens if response.usage else 0
                }
            )
            
        except Exception as e:
            logger.error(f"Claude API error: {e}")
            return LLMResponse(
                success=False,
                content="",
                error=str(e)
            )


# Global instance
claude_instance: Optional[Claude] = None

def get_claude() -> Claude:
    """Get global Claude instance (singleton pattern)"""
    global claude_instance
    if claude_instance is None:
        claude_instance = Claude()
    return claude_instance