
// Client-side formatting helpers only
// No computation algorithms - those live on the server
// Types moved to shared contracts

import type { ReflectionDTO } from '@shared/contracts/memory';

// Legacy types for compatibility
export type Note = { 
  id: string; 
  text: string; 
  created_at?: string; 
};

export type GraphProjection = {
  entities: { title: string; count: number }[];
  edges: { from_id: string; to_id: string; weight: number }[];
};

export type Reflections = {
  pattern?: string | null;
  tension?: { a: string; b: string } | string | null;
  question?: string | null;
  notes: Note[];
};

// Formatting helpers for UI display
export function formatTimestamp(timestamp?: string): string {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleString();
}

export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}
