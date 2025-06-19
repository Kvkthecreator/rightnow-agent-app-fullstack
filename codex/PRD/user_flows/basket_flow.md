## Flow: Create Basket → Parse into Context Blocks

This flow captures the core yarnnn wedge: turning ongoing user dumps into structured memory.

1. User lands on `/baskets/new`
2. Enters raw input:
   - Freeform text dump
   - Uploaded files
   - Reference links
3. Submits the basket
4. System creates a new `basket` and stores raw input
5. `orch_block_parser_agent` is triggered to analyze input
6. Parsed `context_blocks` are created and linked to the basket
7. User is redirected to `/baskets/[id]/work` to review and edit blocks
8. Blocks can be reused in briefs or updated through feedback loops
9. All blocks persist in the user’s memory and can evolve over time
