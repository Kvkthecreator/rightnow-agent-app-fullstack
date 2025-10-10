import fs from 'fs/promises';
import path from 'path';

const DOC_MAP: Record<string, { title: string; file: string; description: string }> = {
  claude: {
    title: 'Claude (Remote MCP)',
    description: 'Connect Yarnnn to Claude using custom connectors.',
    file: path.join(process.cwd(), '..', 'docs', 'CLAUDE_REMOTE_MCP.md'),
  },
  chatgpt: {
    title: 'ChatGPT Apps (Preview)',
    description: 'Prepare for the upcoming Yarnnn connector in ChatGPT Apps.',
    file: path.join(process.cwd(), '..', 'docs', 'CHATGPT_MCP_PREVIEW.md'),
  },
};

export type DocSlug = keyof typeof DOC_MAP;

export function listDocs() {
  return Object.entries(DOC_MAP).map(([slug, entry]) => ({
    slug,
    title: entry.title,
    description: entry.description,
  }));
}

export async function loadDoc(slug: string) {
  const entry = DOC_MAP[slug];
  if (!entry) {
    return null;
  }
  const source = await fs.readFile(entry.file, 'utf-8');
  return {
    title: entry.title,
    description: entry.description,
    content: source,
  };
}
