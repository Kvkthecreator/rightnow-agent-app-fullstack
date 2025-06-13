/* updated landing page */

"use client";

import Link from 'next/link';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import BackgroundPaths from '@/components/BackgroundPaths';

export default function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden min-h-[500px]">
        <BackgroundPaths />
        <div className="relative z-10">
          <LandingHeader />
          <div className="max-w-[1200px] mx-auto px-4 py-24 flex flex-col items-start">
            <br />
            <div className="font-brand text-3xl md:text-7xl">yarnnn</div>
            <br />
            <br />
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              dump as you go,<br />
              and we keep up.
            </h1>
            <br />
            <p className="text-lg leading-relaxed mb-6 max-w-xl">
              yarnnn is your live memory layer for creative and strategic work.
              drop voice notes, AI chats, screenshots, or ideas — and we’ll weave it all into reusable context blocks and evolving briefs.
            </p>
            <Link
              href="/baskets/create"
              className="inline-block px-8 py-4 border border-foreground text-foreground rounded-md hover:bg-black hover:text-white transition"
            >
              drop your first thought
            </Link>
          </div>
        </div>
      </section>

      <main className="bg-background text-foreground flex flex-col">
        <div className="max-w-[1200px] mx-auto px-4 w-full">
          {/* Benefits */}
          <section id="benefits" className="px-6 py-12 border-b grid grid-cols-1 md:grid-cols-2 gap-10">
            <p className="text-lg leading-relaxed">
              yarnnn helps indie thinkers, creative builders, and async teams keep continuity
              across everything they say, plan, and try to remember. one space to store memory, grow ideas, and synthesize strategy.
            </p>
            <div className="space-y-10">
              <div className="flex items-center gap-4">
                <span className="text-xl">🧺</span>
                <span className="text-sm">Baskets collect your thought stream — async, messy, real-time</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xl">◾</span>
                <span className="text-sm">Blocks store reusable brand tone, goals, and strategy</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xl">🧠</span>
                <span className="text-sm">Briefs synthesize your context into plans that feel like you</span>
              </div>
            </div>
          </section>

          {/* New: Use Cases Section */}
          <section id="use-cases" className="px-6 py-12 border-b space-y-8">
            <h2 className="text-2xl font-bold">who yarnnn is for</h2>
            <div className="space-y-6">
              <div>
                <p className="text-md font-semibold">⚒️ Indie Hackers & Startup Builders</p>
                <p className="text-sm text-muted-foreground">
                  turn raw product thoughts and pitch scraps into a roadmap — without losing context.
                </p>
              </div>
              <div>
                <p className="text-md font-semibold">✍️ Creative Solopreneurs</p>
                <p className="text-sm text-muted-foreground">
                  turn voice notes, AI chat threads, and scattered feedback into living briefs that evolve with your work.
                </p>
              </div>
              <div>
                <p className="text-md font-semibold">📈 Freelance Strategists & Marketers</p>
                <p className="text-sm text-muted-foreground">
                  keep every client’s tone, positioning, and deliverables in one evolving memory space.
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="px-6 py-6 text-right">
            <Link
              href="/about"
              className="text-md underline underline-offset-2 hover:text-black/70 transition"
            >
              Learn how it works &rarr;
            </Link>
          </section>

          {/* Mission */}
          <section className="px-6 py-12 border-t border-b">
            <p className="text-xl md:text-2xl max-w-3xl mx-auto text-center">
              🧶 from chaotic thoughts to evolving clarity — one drop at a time
            </p>
          </section>
        </div>
      </main>
      <LandingFooter />
    </>
  );
}