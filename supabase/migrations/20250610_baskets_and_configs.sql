-- 1) RENAME task_briefs → baskets  (keeps history)
ALTER TABLE task_briefs RENAME TO baskets;

/* keep a forward-compat view so old code paths don’t crash */
CREATE OR REPLACE VIEW task_briefs AS SELECT * FROM baskets;

-- 2) ADD intent_summary + status to baskets
ALTER TABLE baskets
    ADD COLUMN intent_summary text,
    ADD COLUMN status text DEFAULT 'draft';  -- draft | confirmed | shipped

-- 3) THREAD log (one row per dump / message)
CREATE TABLE basket_threads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    basket_id uuid REFERENCES baskets(id) ON DELETE CASCADE,
    content text,
    source text,
    created_at timestamptz DEFAULT now()
);

-- 4) BASKET-LEVEL CONFIGS (folder of live outputs)
CREATE TABLE basket_configs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    basket_id uuid REFERENCES baskets(id) ON DELETE CASCADE,
    platform text,
    type text,
    title text,
    external_url text,
    generated_by_agent boolean DEFAULT true,
    version int DEFAULT 1,
    created_at timestamptz DEFAULT now()
);
