## codex/tasks/agent_debug_sdkrunner.md

Codex Instruction for You

Here’s a ready-to-paste Codex task:

codex
Refactor the /profile_analyzer endpoint to package all profile fields as a single "input_text" content item.

- Instead of building a list of {type: "key_value", ...}, build a single string with each profile field as "<key>: <value>", one per line.
- The input to Runner.run should look like:

    input = [
        {
            "role": "user",
            "content": [
                {
                    "type": "input_text",
                    "text": "<concatenated profile string>"
                }
            ]
        }
    ]

- Pass this to Runner.run.
- Keep all other logic the same.
- Restart and test the Jamie payload.
If you want to see exactly how this looks in Python:

profile_dict = payload.profile.dict()
profile_text = "\n".join([f"{key}: {value}" for key, value in profile_dict.items()])
input_message = {
    "role": "user",
    "content": [
        {
            "type": "input_text",
            "text": profile_text
        }
    ]
}
result = await Runner.run(
    profile_analyzer_agent,
    input=[input_message],
    context={"task_id": payload.task_id, "user_id": payload.user_id},
    max_turns=12,
)