import React from "react";

export default function SystemPillarsSection() {
  return (
    <section className="w-full max-w-[1200px] mx-auto px-4 py-16">
      {/* Divider */}
      <div className="w-full h-px bg-black mb-8" />

      {/* Headline */}
      <h2 className="text-4xl md:text-5xl font-normal mb-16">
        What happens after you drop your thought?
      </h2>
      <p className="text-lg mb-12">
        Once you create a basket, yarnnn starts turning your input into a structured memory thread.
        Here’s how the system helps you stay organized, focused, and creatively clear — without the friction.
      </p>

      {/* Features (4 columns on desktop, 2 on tablet, 1 on mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
        {/* 1. Preserve Your Narrative */}
        <div>
          <h3 className="text-neutral-500 text-base md:text-xl font-normal mb-2 flex items-center gap-1">
            <span role="img" aria-label="scroll">📜</span> Preserve Your Narrative
          </h3>
          <p className="text-black text-base md:text-lg font-normal leading-relaxed">
            Your raw dumps from any LLM are rendered as a beautiful, high-fidelity narrative. No fragmentation, no data loss—your original context is always preserved and respected.
          </p>
        </div>
        {/* 2. Promote Your Truth */}
        <div>
          <h3 className="text-neutral-500 text-base md:text-xl font-normal mb-2 flex items-center gap-1">
            <span role="img" aria-label="check">✅</span> Promote Your Truth
          </h3>
          <p className="text-black text-base md:text-lg font-normal leading-relaxed">
            Select any part of your narrative—a decision, a style guide, a key insight—and promote it to a Block. You are in full control of what becomes a reusable piece of your memory.
          </p>
        </div>
        {/* 3. Lock In Your Canon */}
        <div>
          <h3 className="text-neutral-500 text-base md:text-xl font-normal mb-2 flex items-center gap-1">
            <span role="img" aria-label="lock">🔒</span> Lock In Your Canon
          </h3>
          <p className="text-black text-base md:text-lg font-normal leading-relaxed">
            Elevate a Block to a Locked state. This becomes your canonical truth. Our agents will now actively defend this context, highlighting any future inputs that contradict it.
          </p>
        </div>
        {/* 4. Evolve with Confidence */}
        <div>
          <h3 className="text-neutral-500 text-base md:text-xl font-normal mb-2 flex items-center gap-1">
            <span role="img" aria-label="shield">🛡️</span> Evolve with Confidence
          </h3>
          <p className="text-black text-base md:text-lg font-normal leading-relaxed">
            With your core context defended, you can freely explore new ideas. Our agents assist by flagging redundancies and contradictions, helping your memory grow clearer—not messier.
          </p>
        </div>
      </div>
    </section>
  );
}
