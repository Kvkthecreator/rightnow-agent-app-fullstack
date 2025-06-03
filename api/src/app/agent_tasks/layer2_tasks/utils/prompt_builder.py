#api/src/app/agent_tasks/layer2_tasks/utils/prompt_builder.py

import textwrap
from typing import List, Dict

def build_prompt(user_intent: str,
                 sub_instructions: str,
                 blocks: List[Dict],
                 file_urls: List[str]) -> str:
    """
    Build a plain-text prompt for the LLM.
    `blocks` = [{label,type,content}, …] as returned from DB
    """
    ctx = "\n".join(
        f"- ({b['type']}) {b['label']}: {b['content'][:120]}…" for b in blocks
    )
    files = "\n".join(f"- {url}" for url in file_urls) or "None"

    prompt = f"""
    You are an expert strategic planner.

    ## User Intent
    {user_intent}

    ## Extra Instructions
    {sub_instructions or 'None'}

    ## Context Blocks
    {ctx or 'None'}

    ## Attached Media
    {files}

    Generate a structured outline (max 400 words) for how to accomplish the intent.
    """
    return textwrap.dedent(prompt).strip()
