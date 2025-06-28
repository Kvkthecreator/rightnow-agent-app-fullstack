export const MOCK_SNAPSHOT = {
  basket: {
    id: "f5d0cfdd-48f8-410d-8c92-3aaa4508165a",
    name: "AI Launch Campaign",
    status: "ACTIVE",
    scope: ["workspace-wide"],
  },
  raw_dump_body: `
Our brand voice is playful but never unprofessional.
We target young entrepreneurs who value speed and transparency.
Content should feel like a helpful peer, not a corporation.
  `.trim(),
  blocks: [
    {
      id: "b1",
      canonical_value: "playful but never unprofessional",
      semantic_type: "tone",
      state: "PROPOSED",
      created_at: "2025-06-25T12:00:00Z",
      actor: "alice",
    },
    {
      id: "b2",
      canonical_value: "young entrepreneurs",
      semantic_type: "audience",
      state: "ACCEPTED",
      created_at: "2025-06-24T09:12:00Z",
      actor: "bob",
    },
    {
      id: "b3",
      canonical_value: "helpful peer",
      semantic_type: "voice",
      state: "LOCKED",
      created_at: "2025-06-23T15:40:00Z",
      actor: "carol",
    },
    {
      id: "b4",
      canonical_value: "transparency",
      semantic_type: "value",
      state: "CONSTANT",
      created_at: "2025-06-22T08:30:00Z",
      actor: "dave",
    },
  ],
} as const;
