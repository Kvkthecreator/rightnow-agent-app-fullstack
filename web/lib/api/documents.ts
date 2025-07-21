export async function getDocuments(basketId: string) {
  try {
    const res = await fetch(`/api/baskets/${basketId}/docs`);
    if (!res.ok) {
      if (res.status === 404) {
        console.warn('[getDocuments] Not found', { basketId });
        return [];
      }
      console.error('[getDocuments] Failed', { status: res.status, basketId });
      throw new Error(`getDocuments failed with ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error('[getDocuments] Unexpected error', err);
    throw err;
  }
}
