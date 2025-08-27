import { redirect } from 'next/navigation';
import { resolveUserLanding } from '@/lib/server/landing/resolveUserLanding';

export default async function WelcomePage() {
  const to = await resolveUserLanding();
  redirect(to);
}
