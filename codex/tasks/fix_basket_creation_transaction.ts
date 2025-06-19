export default {
  title: "Make basket creation transactional & FK-safe",
  big_picture: `**Problem**\n────────────\n`raw_dumps.basket_id → baskets.id` ❌  +  `baskets.raw_dump_id → raw_dumps.id`\ncreates a cyclic FK.  Inserting in either order breaks one side.\n\n**Solution**\n────────────\nPush the two inserts into a single Postgres function executed under one\ntransaction and mark both FKs DEFERRABLE. That gives us atomicity, keeps\nthe schema contract v1, and removes insert-order headaches forever.\n\n**Benefits for roadmap**\n• Safe retries / idempotence for the hot-key “⇧V quick-dump” flow\n• Snapshot route (M-6) can assume `raw_dump_id` is always non-null\n• Future block-ifier hooks can use the same function when they “append\n  new dump + blocks” in one go.`,
  steps: [
    "Create supabase migration altering FKs to DEFERRABLE and adding a stored procedure create_basket_with_dump.",
    "Update backend route /api/baskets/new to call the RPC instead of manual inserts.",
    "Add tests hitting the route and asserting both foreign keys hold.",
    "Ensure Next.js build succeeds with no front-end changes."
  ]
};
