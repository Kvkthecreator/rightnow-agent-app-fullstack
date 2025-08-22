// Reflections
export type ReflectionDTO = {
  pattern: string | null;
  tension: string | null;
  question: string | null;
  computed_at: string; // ISO
};

// Timeline
export type TimelineItem =
  | {
      kind: "dump";
      ts: string;
      ref_id: string;
      preview: string | null;
      payload: { id: string; text: string | null; created_at: string };
    }
  | {
      kind: "reflection";
      ts: string;
      ref_id: string; // basket_reflections.id
      preview: string | null;
      payload: ReflectionDTO;
    };

export type TimelinePage = {
  items: TimelineItem[];
  next_cursor?: string; // opaque
};