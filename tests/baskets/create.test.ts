import { buildContextBlocks } from '../../web/lib/baskets/submit';

describe('basket block builder', () => {
  it('requires topic, intent and reference', () => {
    expect(() => buildContextBlocks({topic:'',intent:'',references:[]})).toThrow();
  });

  it('creates four blocks when all fields provided', () => {
    const blocks = buildContextBlocks({
      topic: 't',
      intent: 'i',
      insight: 'n',
      references: ['file1']
    });
    expect(blocks.length).toBe(3 + 1); // topic, intent, reference, insight
  });
});
