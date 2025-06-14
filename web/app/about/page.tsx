/* updated about page */

"use client";

import Head from 'next/head';
import Link from 'next/link';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import SystemPillarsSection from '@/components/landing/SystemPillarsSection';
import SystemCapabilitiesSection from '@/components/landing/SystemCapabilitiesSection';

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About yarnnn — memory OS for indie builders</title>
        <meta name="description" content="Learn about yarnnn: a context OS that helps indie builders and creatives preserve clarity and defend their narrative without cognitive overload." />
        <meta name="keywords" content="yarnnn, about yarnnn, context OS, memory OS, indie builder tools, creative tools" />
        <meta property="og:title" content="About yarnnn — memory OS for indie builders" />
        <meta property="og:description" content="Learn how yarnnn helps you preserve clarity in your evolving ideas and memory." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yarnnn.com/about" />
        <meta property="og:image" content="https://yarnnn.com/og-image.png" />
      </Head>
      <LandingHeader />
      <main>
        <section className="w-full max-w-[1200px] mx-auto px-4 py-[120px] space-y-6">
          <h1 className="text-foreground text-4xl md:text-6xl font-bold tracking-tight leading-tight text-left">
            <div className="font-brand text-3xl md:text-7xl">yarnnn</div>
            <br />
            your context OS for narrative-first memory
          </h1>
          <p className="text-lg leading-relaxed max-w-2xl">
            yarnnn is a memory operating system for indie builders, solopreneurs, and creatives who need clarity without cognitive overload. Baskets preserve your raw narrative. Blocks protect reusable context. Agents assist gently — surfacing contradictions or modularity without silent changes.
          </p>
          <p className="text-lg leading-relaxed max-w-2xl">
            Built for the future of the block economy, yarnnn helps you defend and evolve your memory — one thought at a time.
          </p>
        </section>
        <SystemPillarsSection />
        <SystemCapabilitiesSection />
        <footer className="px-4 py-12 text-center text-sm text-muted-foreground">
          our mission: help indie thinkers work with clarity and continuity — powered by thoughtful memory design.
        </footer>
      </main>
      <LandingFooter />
    </>
  );
}
