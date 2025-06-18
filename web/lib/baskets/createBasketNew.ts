export interface NewBasketArgs {
  text_dump: string;
  files?: string[];
  basket_name?: string | null;
}
export async function createBasketNew(
  args: NewBasketArgs,
): Promise<{ id: string }> {
  const res = await fetch('/api/baskets/new', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text_dump: args.text_dump,
      file_urls: args.files ?? [],
      basket_name: args.basket_name ?? null,
    }),
  });
  if (res.status !== 201) {
    const text = await res.text();
    throw new Error(text || `createBasketNew failed with ${res.status}`);
  }
  const data = await res.json();
  return { id: data.basket_id };
}
