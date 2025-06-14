/* updated about page */

"use client";

import Head from 'next/head';
import Link from 'next/link';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About yarnnn — memory OS for indie builders</title>
        <meta name="description" content="Learn about Yarnnn: a context OS that helps indie builders and creatives preserve clarity and defend their narrative without cognitive overload." />
        <meta name="keywords" content="yarnnn, about yarnnn, context OS, memory OS, indie builder tools, creative tools" />
        <meta property="og:title" content="About yarnnn — memory OS for indie builders" />
        <meta property="og:description" content="Learn how Yarnnn helps you preserve clarity in your evolving ideas and memory." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yarnnn.com/about" />
        <meta property="og:image" content="https://yarnnn.com/og-image.png" />
      </Head>
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
