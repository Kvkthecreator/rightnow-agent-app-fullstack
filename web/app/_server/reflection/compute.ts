// Server-only reflection computation (authority)
// This file should never be imported by client components

type DumpRow = {
  id: string;
  text_dump: string | null;
  created_at?: string | null;
  meta?: any;
};

type ContextItem = {
  id: string;
  type: string;
  payload: any;
  created_at?: string | null;
};

type AnalyzerReport = {
  entities?: any[];
  relationships?: any[];
  themes?: Array<{ summary: string }>;
  tensions?: Array<{ summary: string }>;
  suggestions?: Array<{ open_question: string }>;
  created_at: string;
} | null;

export function computeServerReflections({
  dumps,
  items,
  report,
}: {
  dumps: DumpRow[];
  items: ContextItem[];
  report: AnalyzerReport;
}) {
  // Server-side reflection synthesis
  const pattern = extractPattern(dumps, report);
  const tension = extractTension(dumps, report);
  const question = generateQuestion(pattern, report);
  
  // Convert dumps to notes for client display
  const notes = dumps.slice(0, 10).map((d) => ({
    id: d.id,
    text: d.text_dump || "",
    created_at: d.created_at || undefined,
  }));

  return { pattern, tension, question, notes };
}

function extractPattern(dumps: DumpRow[], report: AnalyzerReport): string | null {
  // First try analyzer report
  if (report?.themes?.[0]?.summary) {
    return report.themes[0].summary;
  }

  // Fallback to server-side phrase analysis
  const phrases = new Map<string, number>();
  
  dumps.forEach(dump => {
    if (!dump.text_dump) return;
    const words = dump.text_dump.toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 3);
    
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = `${words[i]} ${words[i + 1]}`;
      phrases.set(phrase, (phrases.get(phrase) || 0) + 1);
    }
  });
  
  const topPhrase = Array.from(phrases.entries())
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])[0];
    
  return topPhrase?.[0] || null;
}

function extractTension(dumps: DumpRow[], report: AnalyzerReport): { a: string; b: string } | null {
  // First try analyzer report
  if (report?.tensions?.[0]?.summary) {
    const tension = report.tensions[0].summary;
    // Try to parse "A vs B" format
    const match = tension.match(/(.+?)\s+(?:vs|versus)\s+(.+)/i);
    if (match) {
      return { a: match[1].trim(), b: match[2].trim() };
    }
  }

  // Fallback to text analysis
  for (const dump of dumps) {
    if (!dump.text_dump) continue;
    
    const vsMatch = dump.text_dump.match(/(.+?)\s+(?:vs|versus)\s+(.+)/i);
    if (vsMatch) {
      return { a: vsMatch[1].trim(), b: vsMatch[2].trim() };
    }
    
    const butMatch = dump.text_dump.match(/(.+?)\s+(?:but|however|although)\s+(.+)/i);
    if (butMatch) {
      return { a: butMatch[1].trim(), b: butMatch[2].trim() };
    }
  }
  
  return null;
}

function generateQuestion(pattern: string | null, report: AnalyzerReport): string | null {
  // First try analyzer report
  if (report?.suggestions?.[0]?.open_question) {
    return report.suggestions[0].open_question;
  }

  // Fallback to pattern-based question
  if (!pattern) return null;
  
  const questions = [
    `What does "${pattern}" really mean to you?`,
    `Why do you keep returning to "${pattern}"?`,
    `What would change if you resolved "${pattern}"?`,
    `What's the deeper need behind "${pattern}"?`,
  ];
  
  // Deterministic selection
  const index = pattern.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % questions.length;
  return questions[index];
}