import React from "react";

export default function SystemPillarsSection() {
  return (
    <section className="w-full max-w-[1200px] mx-auto px-4 py-16">
      {/* Divider */}
      <div className="w-full h-px bg-black mb-8" />

      {/* Headline */}
      <h2 className="text-2xl md:text-5xl font-normal text-center mb-4">
        🧶 What happens after you drop your thought
      </h2>
      <p className="text-lg text-center mb-12">
        Once you create a basket, yarnnn starts turning your input into a structured memory thread.
        Here’s how the system helps you stay organized, focused, and creatively clear — without the friction.
      </p>

      {/* Features (4 columns on desktop, 2 on tablet, 1 on mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
        {/* 1. From dump to direction */}
        <div>
          <h3 className="text-neutral-500 text-base md:text-xl font-normal mb-2 flex items-center gap-1">
            <span role="img" aria-label="basket">🧺</span> From dump to direction
          </h3>
          <p className="text-black text-base md:text-lg font-normal leading-relaxed">
            Your raw thought is interpreted into a working intent, suggested title, and summary.<br />
            You start messy — yarnnn gives it form.
          </p>
        </div>
        {/* 2. Context made reusable */}
        <div>
          <h3 className="text-neutral-500 text-base md:text-xl font-normal mb-2 flex items-center gap-1">
            <span role="img" aria-label="puzzle">🧩</span> Context made reusable
          </h3>
          <p className="text-black text-base md:text-lg font-normal leading-relaxed">
            Key fragments — tone, goals, references, insights — are saved as reusable blocks.<br />
            They’re ready to reappear whenever relevant in future work.
          </p>
        </div>
        {/* 3. From idea to output */}
        <div>
          <h3 className="text-neutral-500 text-base md:text-xl font-normal mb-2 flex items-center gap-1">
            <span role="img" aria-label="paperclip">📎</span> From idea to output
          </h3>
          <p className="text-black text-base md:text-lg font-normal leading-relaxed">
            Your structured context becomes something usable: a Notion brief, synced doc, or shareable strategy.<br />
            No extra formatting needed.
          </p>
        </div>
        {/* 4. Long-term continuity (coming soon) */}
        <div>
          <h3 className="text-neutral-500 text-base md:text-xl font-normal mb-2 flex items-center gap-1">
            <span role="img" aria-label="repeat">🔁</span> Long-term continuity <span className="text-xs">(coming soon)</span>
          </h3>
          <p className="text-black text-base md:text-lg font-normal leading-relaxed">
            yarnnn helps you reconnect past threads across baskets.<br />
            So you don’t lose context — even months later.
          </p>
        </div>
      </div>
    </section>
  );
}
