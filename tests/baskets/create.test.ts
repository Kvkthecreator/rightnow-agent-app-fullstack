import { buildContextBlocks } from '../../web/lib/baskets/submit';

describe('basket block builder', () => {
  it('requires topic and intent', () => {
    expect(() => buildContextBlocks({topic:'',intent:'',reference_file_ids:[]})).toThrow();
    expect(() => buildContextBlocks({topic:'t',intent:'',reference_file_ids:[]})).toThrow();
    expect(() => buildContextBlocks({topic:'t',intent:'i',reference_file_ids:[]})).not.toThrow();
  });

  it('creates four blocks when all fields provided', () => {
    const blocks = buildContextBlocks({
      topic: 't',
      intent: 'i',
      insight: 'n',
      reference_file_ids: ['file1']
    });
    expect(blocks.length).toBe(3 + 1); // topic, intent, reference, insight
  });
});
