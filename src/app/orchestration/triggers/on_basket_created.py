"""Parse basket-level inputs into ``ContextBlock`` rows."""

from schemas.dump_parser import ContextBlock, DumpParserOut


def run(basket_id: str, artifacts: list[dict], user_id: str) -> DumpParserOut:
    """Naively parse text artifacts into ``ContextBlock`` rows."""

    def _split_text(text: str) -> list[str]:
        """Return list of paragraphs or bullet points from raw text."""
        if not text:
            return []
        stripped = text.strip()
        if not stripped:
            return []
        if "\n- " in stripped or stripped.lstrip().startswith("- "):
            points = []
            for i, part in enumerate(stripped.split("\n- ")):
                if i == 0 and part.lstrip().startswith("- "):
                    part = part.lstrip()[2:]
                part = part.strip()
                if part:
                    points.append(part)
            return points
        return [p.strip() for p in stripped.split("\n\n") if p.strip()]

    blocks: list[ContextBlock] = []

    for art in artifacts:
        if art.get("type") != "text":
            continue
        content = art.get("content") or ""
        for segment in _split_text(content):
            label = segment.splitlines()[0][:50]
            block = ContextBlock(
                user_id=user_id,
                label=label,
                content=segment,
                file_ids=[art.get("file_id")] if art.get("file_id") else None,
            )
            blocks.append(block)

    return DumpParserOut(blocks=blocks)
