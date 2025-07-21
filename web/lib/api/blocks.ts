export async function getBlocks(basketId: string) {
  try {
    const res = await fetch(`/api/baskets/${basketId}/blocks`);
    if (!res.ok) {
      if (res.status === 404) {
        console.warn('[getBlocks] Not found', { basketId });
        return [];
      }
      console.error('[getBlocks] Failed', { status: res.status, basketId });
      throw new Error(`getBlocks failed with ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error('[getBlocks] Unexpected error', err);
    throw err;
  }
}
