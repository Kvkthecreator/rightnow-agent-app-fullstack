import pytest

from app.ingestion.splitter import (  # noqa: E402,F401
    hash_block,
    normalise_newlines,
    parse_blocks,
)


@pytest.mark.parametrize(
    "raw",
    [
        "a\n\nb",                # LF
        "a\r\n\r\nb",          # CRLF
        "a\r\n\n b",            # mixed with space indent
        "a\n \n\nb",            # indented blank line
        "a\n\n\n b",            # triple blank
    ],
)
def test_split_into_two_blocks(raw):
    blocks = parse_blocks(raw)
    assert blocks == ["a", "b"]


def test_hash_block_is_deterministic():
    assert hash_block("hello") == hash_block("hello")
    assert hash_block("hello") != hash_block("hello ")
