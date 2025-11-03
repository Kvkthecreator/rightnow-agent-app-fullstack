import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  selectBasket,
  cosineSimilarity,
  type BasketCandidate,
  type SessionFingerprint,
} from '../basketSelector.js';

const fingerprint: SessionFingerprint = {
  embedding: [0.8, 0.2, 0.1],
  summary: 'Discussing growth roadmap for payments',
  intent: 'ask',
};

test('cosineSimilarity handles identical and orthogonal vectors', () => {
  assert.ok(Math.abs(cosineSimilarity([1, 2, 3], [1, 2, 3]) - 1) < 1e-6);
  assert.ok(Math.abs(cosineSimilarity([1, 0], [0, 1])) < 1e-6);
});

test('selectBasket auto-selects a high confidence basket', () => {
  const candidates: BasketCandidate[] = [
    {
      signature: {
        id: 'payments',
        name: 'Payments Strategy',
        embedding: [0.79, 0.19, 0.12],
        lastUpdated: new Date().toISOString(),
      },
      recencyBoost: 0.9,
      userAffinity: 0.8,
    },
    {
      signature: {
        id: 'growth',
        name: 'Growth Experiments',
        embedding: [0.1, 0.8, 0.1],
      },
      recencyBoost: 0.3,
      userAffinity: 0.6,
    },
  ];

  const result = selectBasket(fingerprint, candidates);
  assert.equal(result.decision, 'auto');
  assert.equal(result.primary?.basket.id, 'payments');
  assert.ok((result.primary?.score ?? 0) >= 0.8);
});

test('selectBasket requests confirmation when confidence moderate', () => {
  const moderateCandidates: BasketCandidate[] = [
    {
      signature: {
        id: 'archive',
        name: 'Archive',
        embedding: [0.5, 0.5, 0.1],
      },
      recencyBoost: 0.2,
      userAffinity: 0.1,
    },
  ];

  const result = selectBasket(fingerprint, moderateCandidates);
  assert.equal(result.decision, 'confirm');
  assert.equal(result.requiresConfirmation, true);
});

test('selectBasket falls back to picker for low confidence', () => {
  const lowConfidence: BasketCandidate[] = [
    {
      signature: {
        id: 'unrelated',
        name: 'HR Onboarding',
        embedding: [0, 1, 0],
      },
    },
  ];

  const lowResult = selectBasket(fingerprint, lowConfidence);
  assert.equal(lowResult.decision, 'pick');

  const emptyResult = selectBasket(fingerprint, []);
  assert.equal(emptyResult.decision, 'pick');
  assert.equal(emptyResult.primary, null);
});

test('selectBasket flags tie-break scenarios', () => {
  const tieCandidates: BasketCandidate[] = [
    {
      signature: {
        id: 'alpha',
        name: 'Alpha',
        embedding: [0.8, 0.2, 0.1],
      },
    },
    {
      signature: {
        id: 'beta',
        name: 'Beta',
        embedding: [0.78, 0.21, 0.11],
      },
    },
  ];

  const tieResult = selectBasket(fingerprint, tieCandidates);
  assert.equal(tieResult.needsTieBreak, true);
});
