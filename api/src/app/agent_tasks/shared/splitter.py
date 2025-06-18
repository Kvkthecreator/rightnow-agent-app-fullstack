"""
Ingestion splitter utilities (v0.1).

* ``normalise_newlines``  –  convert all newline variants to LF.
* ``parse_blocks``        –  split normalised text into atomic blocks
                             using the "blank line" rule.
* ``hash_block``          –  deterministic SHA-256 of block content.

Designed to be format-agnostic: higher-level plugins (image OCR,
PDF extraction) can feed their text output into ``parse_blocks``.
"""

import hashlib
import re

_BLANK_LINE_RE = re.compile(r"\r?\n\s*\r?\n+")


# ---------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------


def normalise_newlines(text: str) -> str:
    """Convert CRLF / CR / LFCR to LF only."""
    # Step order important: handle CRLF first, then lone CR.
    return text.replace("\r\n", "\n").replace("\n\r", "\n").replace("\r", "\n")


def parse_blocks(raw_text: str) -> list[str]:
    """Split ``raw_text`` into blocks separated by one or more blank lines.

    Leading / trailing whitespace on each block is stripped, but inner
    whitespace (e.g. list indentation) is preserved.
    """
    if not isinstance(raw_text, str):
        raise TypeError("parse_blocks expects a str")
    clean = normalise_newlines(raw_text).strip()
    # Split on blank lines, drop empty results after stripping.
    return [blk.strip() for blk in _BLANK_LINE_RE.split(clean) if blk.strip()]


def hash_block(content: str) -> str:
    """Return lower-case SHA-256 hex digest of ``content``."""
    return hashlib.sha256(content.encode("utf-8")).hexdigest()
