import { describe, expect, test } from 'vitest';
import {
  topPhrases,
  findTension,
  makeQuestion,
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
    expect(findTension(notes)).toBe('I love apples but hate pears');
  });

  test('makeQuestion crafts follow-up', () => {
    const q = makeQuestion('apples');
    expect(q).toBe('What about "apples" stands out to you?');
  });
});
