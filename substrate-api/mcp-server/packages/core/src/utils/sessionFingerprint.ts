import { z } from 'zod';

export const sessionFingerprintSchema = z.object({
  embedding: z.array(z.number()).min(1, { message: 'embedding must contain vector values' }),
  summary: z.string().optional(),
  intent: z.string().optional(),
  entities: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
});

export type SessionFingerprintInput = z.infer<typeof sessionFingerprintSchema>;
