/* updated about page */

"use client";

import type { Metadata } from 'next';
import Link from 'next/link';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';

export const metadata: Metadata = {
  title: 'About yarnnn',
  description:
    'Learn how yarnnn turns scattered ideas into a reusable memory. Discover baskets, blocks, and our vision for async thinkers.',
};

export default function AboutPage() {
  return (
    <>
      <LandingHeader />
      <div className="max-w-[800px] mx-auto px-4 py-24">
        <h1 className="font-brand text-4xl md:text-6xl mb-8">About yarnnn</h1>
        <p className="mb-6 text-lg">
          Yarnnn is a context OS for indie builders, solopreneurs, and creative thinkers who need to preserve clarity in their ideas. It helps you turn scattered dumps into an evolving, modular memory — without cognitive overload.
        </p>
        <p className="mb-6 text-lg">
          Baskets are your narrative-first memory streams. You can freely dump ideas, drafts, and notes. Blocks are reusable context modules — created only when you choose to promote or accept an agent’s suggestion.
        </p>
        <p className="mb-6 text-lg">
          Our agents assist gently: they highlight contradictions, suggest modularity, and surface opportunities. But they never modify your memory silently. You stay in control.
        </p>
        <p className="mb-6 text-lg">
          Yarnnn is built for the future of the block economy — where your curated context powers everything from strategy to automation.
        </p>
        <div className="mt-8">
          <Link href="/" className="text-black underline">Return to home</Link>
        </div>
      </div>
      <LandingFooter />
    </>
  );
}
