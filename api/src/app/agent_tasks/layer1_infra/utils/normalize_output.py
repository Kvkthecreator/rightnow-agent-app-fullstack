import json
import re

# Regex to detect fenced code blocks (optional 'json' tag)
FENCE = re.compile(r"^```(?:json)?\s*([\s\S]+?)\s*```$", re.I)

def normalize_output(raw):
    """
    Ensure output is always a dict or list. If raw is a string,
    unwrap fenced JSON blocks, attempt to parse JSON;
    on failure, return {'error': raw}.
    """
    # If string, try to extract and parse JSON
    if isinstance(raw, str):
        text = raw.strip()
        m = FENCE.match(text)
        if m:
            text = m.group(1)
        try:
            parsed = json.loads(text)
            if isinstance(parsed, (dict, list)):
                return parsed
        except Exception:
            pass
        # Fallback: wrap raw string as error
        return {"error": text}

    # Already dict or list
    return raw
