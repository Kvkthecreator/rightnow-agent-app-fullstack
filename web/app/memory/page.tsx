import { redirect } from 'next/navigation';
import { resolveTargetBasket } from '@/lib/baskets/resolveTargetBasket';
import { cookies } from 'next/headers';

export default async function MemoryRedirect() {
  const id = await resolveTargetBasket({ headers: { Cookie: cookies().toString() } });
  redirect(`/baskets/${id}/memory`);
}
