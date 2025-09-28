"use client";

import Head from 'next/head';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import BackgroundPaths from '@/components/BackgroundPaths';

export default function LandingPage() {
  return (
    <>
      <Head>
        <title>yarnnn — Turn chaos into context</title>
        <meta
          name="description"
          content="Yarnnn turns your scattered thoughts, LLM chats, and raw ideas into structured, evolving blocks of strategy and memory."
        />
        <meta name="keywords" content="yarnnn, context OS, memory operating system, creative workflows, AI thinking tools" />
        <meta property="og:title" content="yarnnn — context OS for creative builders" />
        <meta property="og:description" content="From chaos to clarity — yarnnn helps you preserve, evolve, and act on your ideas with structure and memory." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yarnnn.com" />
        <meta property="og:image" content="https://yarnnn.com/og-image.png" />
      </Head>
      <section className="relative overflow-hidden min-h-[500px]">
        <BackgroundPaths />
        <div className="relative z-10">
          <LandingHeader />
          <div className="max-w-[1200px] mx-auto px-4 py-24 flex flex-col items-start">
            <h1 className="font-brand text-4xl md:text-7xl mb-4">yarnnn</h1>
            <p className="text-xl md:text-2xl max-w-[800px]">
              Control your memory. Control your world.
            </p>
            <p className="mt-6 text-md md:text-lg max-w-[800px]">
              Finally organize your AI chaos. Build a memory system that evolves with your ideas.
            </p>

            {/* Optional demo section */}
            {/* <div className="mt-6">
              <iframe src="https://www.loom.com/embed/your-video-id" frameBorder="0" className="w-full h-[360px] rounded-lg" allowFullScreen></iframe>
            </div> */}

            <div className="mt-8">
              <a
                href="/login"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                localStorage.setItem('redirectPath', '/baskets');
                  }
                }}
                className="inline-block bg-black text-white rounded-xl px-6 py-3 text-lg hover:bg-neutral-800 transition"
              >
                try yarnnn - Start with your name
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Yarnnn Section */}
      <section className="w-full max-w-[1200px] mx-auto px-4 py-16">
        {/* Divider */}
        <div className="w-full h-px bg-black mb-8" />

        {/* Headline */}
        <h2 className="text-4xl md:text-5xl font-normal mb-16">
          Why yarnnn? Why Now?
        </h2>
        <p className="text-lg mb-12">
          In the age of AI, your thoughts and ideas are more scattered than ever. Brilliant insights from chats, meetings, and random notes are lost in a sea of digital noise. Yarnnn is the first platform designed to solve this new problem, giving you a persistent, intelligent memory to build upon.
        </p>

        {/* Features (2 columns on desktop, 1 on mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
          {/* 1. End AI Amnesia */}
          <div>
            <h3 className="text-neutral-500 text-base md:text-xl font-normal mb-2 flex items-center gap-1">
              <span role="img" aria-label="brain">🧠</span> End AI Amnesia
            </h3>
            <p className="text-black text-base md:text-lg font-normal leading-relaxed">
              You have valuable conversations with AI, but that context vanishes into endless chat histories. Yarnnn acts as the persistent memory for your AI-powered work, capturing every fleeting idea, raw_dump, and insight in a single, high-fidelity narrative so that nothing you create is ever lost.
            </p>
          </div>

          {/* 2. Build Your Second Brain, Automatically */}
          <div>
            <h3 className="text-neutral-500 text-base md:text-xl font-normal mb-2 flex items-center gap-1">
              <span role="img" aria-label="connections">🔗</span> Build Your Second Brain, Automatically
            </h3>
            <p className="text-black text-base md:text-lg font-normal leading-relaxed">
              Yarnnn doesn&apos;t just store your notes; it connects them. As you add thoughts, our agents automatically build an interconnected web of your knowledge. This creates a powerful second brain that grows smarter and more valuable over time, allowing you to Evolve with Confidence as new ideas are checked against your core context.
            </p>
          </div>

          {/* 3. Your AI Thinking Partner */}
          <div>
            <h3 className="text-neutral-500 text-base md:text-xl font-normal mb-2 flex items-center gap-1">
              <span role="img" aria-label="robot">🤖</span> Your AI Thinking Partner
            </h3>
            <p className="text-black text-base md:text-lg font-normal leading-relaxed">
              Our agents work in the background to analyze your memory, surface surprising connections, identify emerging patterns, and offer reflections. It&apos;s not just a tool; it&apos;s an active partner that helps you think better and discover what you didn&apos;t know about yourself.
            </p>
          </div>

          {/* 4. Create with Confidence & Provenance */}
          <div>
            <h3 className="text-neutral-500 text-base md:text-xl font-normal mb-2 flex items-center gap-1">
              <span role="img" aria-label="document">📋</span> Create with Confidence & Provenance
            </h3>
            <p className="text-black text-base md:text-lg font-normal leading-relaxed">
              Move from scattered insights to clear, decision-ready documents. Every Block you Promote Your Truth with, and every brief or plan you create, is backed by a clear line of provenance, allowing you to Lock In Your Canon and trust your work.
            </p>
          </div>
        </div>
      </section>

      <LandingFooter />
    </>
  );
}
