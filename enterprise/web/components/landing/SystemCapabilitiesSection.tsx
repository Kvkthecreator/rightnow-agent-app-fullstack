import React from "react";

export default function SystemCapabilitiesSection() {
  return (
    <section className="max-w-[1200px] mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <div className="border-t border-gray-200 pt-16">
        <h2 className="text-4xl md:text-6xl font-normal mb-16">Core Services</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 1. Living Memory */}
          <div className="flex flex-col">
            <h3 className="text-xl md:text-2xl font-normal mb-4 flex items-center gap-1">
              <span role="img" aria-label="box">📦</span> Living Memory
            </h3>
            <p className="text-base md:text-lg">
              Unlike a static document, your yarnnn basket is a dynamic workspace. Your narrative evolves with each dump, while your Locked context provides a stable foundation.
            </p>
          </div>

          {/* 2. Contextual Integrity */}
          <div className="flex flex-col">
            <h3 className="text-xl md:text-2xl font-normal mb-4 flex items-center gap-1">
              <span role="img" aria-label="shield">🛡️</span> Contextual Integrity
            </h3>
            <p className="text-base md:text-lg">
              Our core promise. Gentle, agent-powered assistance ensures your canonical decisions are defended, giving you a reliable source of truth for all downstream work.
            </p>
          </div>

          {/* 3. Portable Context (coming soon) */}
          <div className="flex flex-col">
            <h3 className="text-xl md:text-2xl font-normal mb-4 flex items-center gap-1">
              <span role="img" aria-label="globe">🌐</span> Portable Context <span className="text-xs">(coming soon)</span>
            </h3>
            <p className="text-base md:text-lg">
              Your Locked Blocks are designed for reuse. Soon, you'll be able to export them as prompts or pipe them into Notion, briefs, and other tools in your stack.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
