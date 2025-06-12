"""
Intent extractor helper.

* If OPENAI_API_KEY is set and `use_llm=True`, call OpenAI Chat API
  on the first 256 tokens and return (intent, confidence float 0-1).
* Otherwise return ("", 0.0) so the pipeline can proceed.
"""

from __future__ import annotations

import os

_DEFAULT_MODEL = "gpt-3.5-turbo"


def extract_intent(text: str, *, use_llm: bool = True) -> tuple[str, float]:
    if not use_llm or "OPENAI_API_KEY" not in os.environ:
        return ("", 0.0)

    try:  # pragma: no cover - network call
        import openai  # runtime import to avoid dev dependency

        openai.api_key = os.environ["OPENAI_API_KEY"]
        prompt = "Summarise the user's overall intent in one sentence."
        completion = openai.ChatCompletion.create(
            model=_DEFAULT_MODEL,
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": text[:2048]},
            ],
            temperature=0.2,
            max_tokens=32,
        )
        intent = completion.choices[0].message.content.strip()
        return (intent, 0.9)
    except Exception:  # noqa: BLE001
        return ("", 0.0)
