import { getAllBaskets, BasketOverview } from './getAllBaskets';

export async function getRecentBaskets(user: { id: string }, limit = 5): Promise<BasketOverview[]> {
  const all = await getAllBaskets(user);
  return all.slice(0, limit);
}
