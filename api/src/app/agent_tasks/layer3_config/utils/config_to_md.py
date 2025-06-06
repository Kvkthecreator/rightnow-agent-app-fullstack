def render_markdown(cfg: dict) -> str:
    """Very simple Markdown rendition of a brief_config JSON."""
    lines = []
    lines.append(f"# {cfg.get('intent','Task Brief')}")
    lines.append("")

    # Core context
    lines.append("## Core Context")
    cc = cfg.get("core_context", {})
    for k, v in cc.items():
        lines.append(f"- **{k.replace('_',' ').title()}**: {v}")

    # Blocks
    blocks = cfg.get("blocks", [])
    if blocks:
        lines.append("\n## Supplementary Blocks")
        for b in blocks:
            typ = b.get("type", "block")
            content = b.get("content", "")[:140].replace("\n", " ")
            lines.append(f"- *{typ}*: {content}…")

    # Tool config
    cfg_section = cfg.get("config", {})
    if cfg_section:
        lines.append("\n## Execution Config")
        for k, v in cfg_section.items():
            lines.append(f"- **{k}**: {v}")

    return "\n".join(lines) + "\n"
