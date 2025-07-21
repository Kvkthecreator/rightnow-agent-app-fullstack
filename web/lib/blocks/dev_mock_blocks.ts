import type { Block } from "@/types";

export const DEV_MOCK_BLOCKS: Block[] = [
  {
    id: "mock1",
    semantic_type: "tone",
    content: "We maintain an upbeat and friendly style that excites readers.",
    state: "PROPOSED",
    scope: null,
    canonical_value: "upbeat and friendly",
    actor: "tester",
    created_at: new Date().toISOString(),
  },
  {
    id: "mock2",
    semantic_type: "audience",
    content: "Our messaging targets busy founders seeking quick wins.",
    state: "PROPOSED",
    scope: null,
    canonical_value: "busy founders",
    actor: "tester",
    created_at: new Date().toISOString(),
  },
];
