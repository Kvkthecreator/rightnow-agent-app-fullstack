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
        Once you create a basket, yarnnn transforms your raw input into structured knowledge ingredients.
        Here's how the system builds your memory architecture — without the friction.
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
        {/* 2. Extract Structured Knowledge */}
        <div>
          <h3 className="text-neutral-500 text-base md:text-xl font-normal mb-2 flex items-center gap-1">
            <span role="img" aria-label="gear">⚙️</span> Extract Structured Knowledge
          </h3>
          <p className="text-black text-base md:text-lg font-normal leading-relaxed">
            Our agents automatically extract structured data ingredients—goals, constraints, metrics, entities—from your raw input. These become reusable knowledge components for future composition.
          </p>
        </div>
        {/* 3. Synthesize Documents */}
        <div>
          <h3 className="text-neutral-500 text-base md:text-xl font-normal mb-2 flex items-center gap-1">
            <span role="img" aria-label="document">📄</span> Synthesize Documents
          </h3>
          <p className="text-black text-base md:text-lg font-normal leading-relaxed">
            Transform your structured knowledge ingredients into coherent documents. Our agents synthesize data ingredients with your intent to generate purposeful narratives, not templated text.
          </p>
        </div>
        {/* 4. Defend Your Memory */}
        <div>
          <h3 className="text-neutral-500 text-base md:text-xl font-normal mb-2 flex items-center gap-1">
            <span role="img" aria-label="shield">🛡️</span> Defend Your Memory
          </h3>
          <p className="text-black text-base md:text-lg font-normal leading-relaxed">
            Our agents actively monitor for contradictions and redundancies across your knowledge ingredients. Your memory grows clearer and more coherent, not messier, as you add new input.
          </p>
        </div>
      </div>
    </section>
  );
}
