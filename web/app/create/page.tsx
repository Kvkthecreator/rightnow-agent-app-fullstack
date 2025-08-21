import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { resolveTargetBasket } from '@/lib/baskets/resolveTargetBasket';
import { logEvent } from '@/lib/telemetry';

export default async function CreateRedirect() {
  const id = await resolveTargetBasket({ headers: { Cookie: cookies().toString() } });
  await logEvent('redirect.create_deprecated', { basket_id: id });
  redirect(`/baskets/${id}/memory`);
}
