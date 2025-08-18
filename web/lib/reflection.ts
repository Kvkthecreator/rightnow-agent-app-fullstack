export type Note = {
  id: string;
  text: string;
  created_at?: string;
};

export type PhraseCount = {
  phrase: string;
  count: number;
};

export type Sentiment = 'positive' | 'negative' | 'neutral';

const STOP_WORDS = new Set([
  'the',
  'and',
  'a',
  'to',
  'of',
  'in',
  'is',
  'it',
  'for',
  'on',
  'with',
  'as',
  'by',
  'an',
  'be',
  'are',
  'that',
  'this',
]);

export function topPhrases(notes: Note[], limit = 5): PhraseCount[] {
  const counts = new Map<string, number>();
  for (const note of notes) {
    const words = note.text
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter((w) => w && !STOP_WORDS.has(w));
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = `${words[i]} ${words[i + 1]}`;
      counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([phrase, count]) => ({ phrase, count }));
}

export function findTension(notes: Note[]): string | undefined {
  for (const note of notes) {
    const match = note.text.match(
      /(.{0,40}\b(?:but|however|although)\b.{0,40})/i,
    );
    if (match) {
      return match[0].trim();
    }
  }
  return undefined;
}

export function makeQuestion(pattern?: string): string | undefined {
  if (!pattern) return undefined;
  return `What about "${pattern}" stands out to you?`;
}

export function sentimentTrend(notes: Note[]): Sentiment {
  const positive = new Set(['good', 'great', 'happy', 'love', 'excited']);
  const negative = new Set(['bad', 'sad', 'angry', 'hate', 'upset']);
  let score = 0;
  for (const note of notes) {
    const words = note.text.toLowerCase().split(/\s+/);
    for (const w of words) {
      if (positive.has(w)) score++;
      if (negative.has(w)) score--;
    }
  }
  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}
