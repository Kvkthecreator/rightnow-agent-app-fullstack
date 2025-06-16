# Dev Notes

## File upload fix for basket creation

- `createBasketWithInput` now uploads raw files to the `block-files` bucket.
- After upload, each file is inserted into `block_files` with a `label` and `storage_domain = "block-files"`.
- This resolves the 400 error on `/rest/v1/block_files?select=id` during basket creation.
- Basket creation proceeds only after each file insert succeeds.

