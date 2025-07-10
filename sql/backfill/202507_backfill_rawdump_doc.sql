-- Backfill raw_dumps.document_id where null using creation order
WITH rd_num AS (
    SELECT id, basket_id,
           ROW_NUMBER() OVER (PARTITION BY basket_id ORDER BY created_at) AS rn
    FROM raw_dumps
    WHERE document_id IS NULL
),
    doc_num AS (
    SELECT id, basket_id,
           ROW_NUMBER() OVER (PARTITION BY basket_id ORDER BY created_at) AS rn
    FROM documents
)
UPDATE raw_dumps AS rd
SET document_id = dn.id
FROM rd_num rdn
JOIN doc_num dn ON rdn.basket_id = dn.basket_id AND rdn.rn = dn.rn
WHERE rd.id = rdn.id;
