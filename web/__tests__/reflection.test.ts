import { describe, expect, test } from 'vitest';
import {
  topPhrases,
  findTension,
  makeQuestion,
  computeReflections,
  type Note,
} from '@/lib/reflection';

describe('reflection utils', () => {
  const notes: Note[] = [
    { id: '1', text: 'I love apples but hate pears' },
    { id: '2', text: 'apples are great and apples are tasty' },
    { id: '3', text: 'pears are fine however apples win' },
  ];

  test('topPhrases finds frequent pairs', () => {
    const phrases = topPhrases(notes);
    expect(phrases[0]).toStrictEqual({ phrase: 'apples are', count: 2 });
  });

  test('findTension detects contrast', () => {
    expect(findTension(notes)).toStrictEqual({ a: 'I love apples', b: 'hate pears' });
  });

  test('makeQuestion crafts follow-up', () => {
    const q = makeQuestion('apples');
    expect(q).toBe('What about "apples" stands out to you?');
  });

  test('computeReflections merges text and graph signals', () => {
    const refs = computeReflections(notes, {
      entities: [
        { title: 'apples', count: 3 },
        { title: 'pears', count: 1 },
      ],
      edges: [],
    });
    expect(refs.pattern).toBe('apples are');
    expect(refs.reasons).toContain('apples');
  });
});
