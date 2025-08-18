export type Note = { id: string; text: string; created_at?: string };

export type Sentiment = "positive" | "negative" | "neutral";

const STOP_WORDS = new Set([
  "the",
  "and",
  "a",
  "to",
  "of",
  "in",
  "is",
  "it",
  "for",
  "on",
  "with",
  "as",
  "by",
  "an",
  "be",
  "are",
  "that",
  "this",
]);

export function topPhrases(notes: Note[], limit = 5): { phrase: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const note of notes) {
    const words = note.text
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
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

export function findTension(notes: Note[]): { a: string; b: string } | null {
  for (const note of notes) {
    const vsMatch = note.text.match(/(.+?)\s+vs\s+(.+)/i);
    if (vsMatch) {
      return { a: vsMatch[1].trim(), b: vsMatch[2].trim() };
    }
    const butMatch = note.text.match(/(.+?)\s+(?:but|however|although)\s+(.+)/i);
    if (butMatch) {
      return { a: butMatch[1].trim(), b: butMatch[2].trim() };
    }
  }
  return null;
}

export function makeQuestion(pattern?: string): string | undefined {
  if (!pattern) return undefined;
  return `What about "${pattern}" stands out to you?`;
}

export function sentimentTrend(notes: Note[]): Sentiment {
  const positive = new Set(["good", "great", "happy", "love", "excited"]);
  const negative = new Set(["bad", "sad", "angry", "hate", "upset"]);
  let score = 0;
  for (const note of notes) {
    const words = note.text.toLowerCase().split(/\s+/);
    for (const w of words) {
      if (positive.has(w)) score++;
      if (negative.has(w)) score--;
    }
  }
  if (score > 0) return "positive";
  if (score < 0) return "negative";
  return "neutral";
}
