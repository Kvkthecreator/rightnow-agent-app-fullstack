import type { UserContext } from './types/index.js';

const HIGH_THRESHOLD = 0.80;
const MEDIUM_THRESHOLD = 0.55;
const TIE_BREAK_DELTA = 0.06;

export type BasketConfidence = 'auto' | 'confirm' | 'pick';

export interface BasketSignature {
  id: string;
  name: string;
  embedding: number[];
  summary?: string;
  lastUpdated?: string;
}

export interface BasketCandidate {
  signature: BasketSignature;
  recencyBoost?: number; // 0..1
  userAffinity?: number; // 0..1
  conflict?: boolean;
}

export interface SessionFingerprint {
  embedding: number[];
  summary?: string;
  intent?: string;
  entities?: string[];
  keywords?: string[];
}

export interface BasketScore {
  basket: BasketSignature;
  score: number;
  similarity: number;
  recencyBoost: number;
  affinityBoost: number;
  penalty: number;
}

export interface BasketSelection {
  decision: BasketConfidence;
  primary: BasketScore | null;
  ranked: BasketScore[];
  requiresConfirmation: boolean;
  needsTieBreak: boolean;
}

/**
 * Implements the scoring algorithm outlined in docs/BASKET_INFERENCE_SPEC.md.
 */
export function selectBasket(
  fingerprint: SessionFingerprint,
  candidates: BasketCandidate[],
  _user?: UserContext,
  now: Date = new Date()
): BasketSelection {
  if (!candidates.length) {
    return {
      decision: 'pick',
      primary: null,
      ranked: [],
      requiresConfirmation: true,
      needsTieBreak: false,
    };
  }

  const scored = candidates
    .map((candidate) => scoreCandidate(candidate, fingerprint, now))
    .sort((a, b) => b.score - a.score);

  const [best, second] = scored;
  const decision = best.score >= HIGH_THRESHOLD
    ? 'auto'
    : best.score >= MEDIUM_THRESHOLD
    ? 'confirm'
    : 'pick';

  const needsTieBreak = Boolean(
    best && second && Math.abs(best.score - second.score) < TIE_BREAK_DELTA
  );

  return {
    decision,
    primary: best,
    ranked: scored.slice(0, 6),
    requiresConfirmation: decision !== 'auto',
    needsTieBreak,
  };
}

function scoreCandidate(
  candidate: BasketCandidate,
  fingerprint: SessionFingerprint,
  now: Date
): BasketScore {
  const similarity = cosineSimilarity(
    fingerprint.embedding,
    candidate.signature.embedding
  );

  const recencyBoost = candidate.recencyBoost ?? recencyFromTimestamp(candidate.signature.lastUpdated, now);
  const affinityBoost = candidate.userAffinity ?? 0;
  const penalty = candidate.conflict ? 0.15 : 0;

  const score = 0.75 * similarity + 0.15 * recencyBoost + 0.10 * affinityBoost - penalty;

  return {
    basket: candidate.signature,
    score,
    similarity,
    recencyBoost,
    affinityBoost,
    penalty,
  };
}

function recencyFromTimestamp(timestamp: string | undefined, now: Date): number {
  if (!timestamp) return 0;
  const updated = new Date(timestamp);
  if (Number.isNaN(updated.getTime())) return 0;
  const diffDays = Math.max(0, (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
  // Simple decay: 0 days -> 1, 30+ days -> ~0
  const value = Math.max(0, Math.min(1, 1 - diffDays / 30));
  return value;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (!normA || !normB) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export { cosineSimilarity };
