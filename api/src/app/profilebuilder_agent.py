# src/app/profilebuilder_agent.py
# -------------------------------

from agents import Agent, output_guardrail, GuardrailFunctionOutput  # ← single import line

from .agent_output import ProfileFieldOut


profilebuilder_agent = Agent(                              # exported under this name
    name="Profile-builder",
    instructions=(
        "Collect ONE profile field at a time from the user.\n"
        "After each answer, respond only with valid JSON matching the ProfileFieldOut schema above.\n"
        "Use the field clarification_prompt to hold the **next question you want to ask the user** (or null if done with this turn)."
    ),
    output_type=ProfileFieldOut,
)


@output_guardrail
async def schema_guardrail(ctx, agent, llm_output):
    # If the JSON parsed into ProfileFieldOut we’re good.
    return GuardrailFunctionOutput("schema_ok", tripwire_triggered=False)


profilebuilder_agent.output_guardrails = [schema_guardrail]
