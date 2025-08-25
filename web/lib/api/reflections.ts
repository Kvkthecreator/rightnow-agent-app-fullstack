import { z } from 'zod';
import { withSchema } from '@/lib/fetchers/withSchema';
import type { ReflectionDTO } from '@shared/contracts/memory';

const ReflectionSchema: z.ZodType<ReflectionDTO> = z.object({
  pattern: z.string().nullable(),
  tension: z.string().nullable(),
  question: z.string().nullable(),
  computed_at: z.string(),
});

export async function fetchReflectionsLatest(
  basketId: string,
): Promise<ReflectionDTO> {
  const res = await fetch(`/api/baskets/${basketId}/reflections/latest`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`reflections ${res.status}`);
  return withSchema(ReflectionSchema)(res);
}
