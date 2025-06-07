import React from "react";

export default function SystemCapabilitiesSection() {
  return (
    <section className="max-w-[1200px] mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <div className="border-t border-gray-200 pt-16">
        <h2 className="text-4xl md:text-6xl font-normal mb-16">Core Services</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 1. Memory OS */}
          <div className="flex flex-col">
            <h3 className="text-xl md:text-2xl font-normal mb-4 flex items-center gap-1">
              <span role="img" aria-label="box">📦</span> Memory OS
            </h3>
            <p className="text-base md:text-lg">
              Everything you add becomes a living memory — saved, searchable, and enriched behind the scenes.
            </p>
          </div>

          {/* 2. Threaded Projects */}
          <div className="flex flex-col">
            <h3 className="text-xl md:text-2xl font-normal mb-4 flex items-center gap-1">
              <span role="img" aria-label="needle">🪡</span> Threaded Projects
            </h3>
            <p className="text-base md:text-lg">
              Your tasks, goals, and context aren’t just stored — they grow.
              yarnnn threads together structure and meaning as you go.
            </p>
          </div>

          {/* 3. Built for integrations (coming soon) */}
          <div className="flex flex-col">
            <h3 className="text-xl md:text-2xl font-normal mb-4 flex items-center gap-1">
              <span role="img" aria-label="globe">🌐</span> Built for integrations <span className="text-xs">(coming soon)</span>
            </h3>
            <p className="text-base md:text-lg">
              yarnnn works alongside your tools, not instead of them.
              Google Docs, Notion, and more coming soon.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
