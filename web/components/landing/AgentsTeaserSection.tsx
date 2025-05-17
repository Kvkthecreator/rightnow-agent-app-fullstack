export default function AgentsTeaserSection() {
  return (
    <section className="w-full max-w-[1200px] mx-auto px-4 py-16">
      {/* Divider */}
      <div className="w-full h-px bg-black mb-8" />

      {/* Headline */}
      <h2 className="text-2xl md:text-5xl font-normal text-center mb-12">
        coming soon! <br /> full team of agents
      </h2>

      {/* Features (4 columns on desktop, 2 on tablet, 1 on mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
        {/* 1. Profile Engine */}
        <div>
          <div className="text-neutral-500 text-base md:text-xl font-normal mb-2 flex items-center gap-1">
            <span role="img" aria-label="ruler">📏</span> PROFILE ENGINE
          </div>
          <div className="text-black text-base md:text-lg font-normal leading-relaxed">
            Before anything else, we need to get to know you.<br />
            We ask questions about your audience, your tone, your goals, and your offer.<br />
            This allows us to generate content and strategy that's actually aligned with you.
          </div>
        </div>
        {/* 2. Strategy Manager */}
        <div>
          <div className="text-neutral-500 text-base md:text-xl font-normal mb-2 flex items-center gap-1">
            <span role="img" aria-label="top">🔝</span> STRATEGY MANAGER
          </div>
          <div className="text-black text-base md:text-lg font-normal leading-relaxed">
            Tell us your goal. We'll map your path.<br />
            Launching a product? Need more engagement? Want to grow your email list?<br />
            We’ll generate a platform-by-platform roadmap, post angles, and timeline suggestions—automatically.
          </div>
        </div>
        {/* 3. Content Assistant */}
        <div>
          <div className="text-neutral-500 text-base md:text-xl font-normal mb-2 flex items-center gap-1">
            <span role="img" aria-label="pencil">✍️</span> CONTENT ASSISTANT
          </div>
          <div className="text-black text-base md:text-lg font-normal leading-relaxed">
            We don’t just give you ideas. We give you posts. (Phase 2)<br />
            You’ll get customized content broken down by format (e.g. tweet, carousel, story, short video), tone, and intent—ready to publish or refine.<br />
            Always in your voice.
          </div>
        </div>
        {/* 4. Repurpose Content */}
        <div>
          <div className="text-neutral-500 text-base md:text-xl font-normal mb-2 flex items-center gap-1">
            <span role="img" aria-label="recycle" className="text-green-600">♻️</span> REPURPOSE CONTENT
          </div>
          <div className="text-black text-base md:text-lg font-normal leading-relaxed">
            One idea becomes a week of content.<br />
            Paste in a caption, tweet, or idea, and your agent will transform it into multiple platform-ready pieces.<br />
            Stay consistent without doing 10x the work.
          </div>
        </div>
      </div>
    </section>
  );
}
