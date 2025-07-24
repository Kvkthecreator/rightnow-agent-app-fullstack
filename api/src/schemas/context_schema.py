from typing import TypedDict, List, Optional, Literal

class ContextItem(TypedDict):
    id: str
    name: str
    type: Literal["audience", "goal", "topic", "insight", "undefined"]
    is_validated: bool

class BlockContext(TypedDict):
    id: str
    type: Literal["mission", "tone", "audience", "strategy", "custom"]
    content: str
    context_items: List[str]  # context_item.id
    document_ids: List[str]   # Optional references

class RawDump(TypedDict):
    id: str
    content: str
    linked_block_ids: List[str]  # Optional link suggestions

class DocumentContext(TypedDict):
    id: str
    title: str
    block_ids: List[str]

class BasketContext(TypedDict):
    id: str
    name: str
    blocks: List[BlockContext]
    context_items: List[ContextItem]
    documents: List[DocumentContext]
    raw_dumps: List[RawDump]

# This will evolve — we can add helpers, validators, or enums as needed
# But this forms the contract for Brain and other intelligent agents
