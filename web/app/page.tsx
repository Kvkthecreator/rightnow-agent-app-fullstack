"use client";

import Head from 'next/head';
import Link from 'next/link';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import BackgroundPaths from '@/components/BackgroundPaths';

export default function LandingPage() {
  return (
    <>
      <Head>
        <title>yarnnn — Your Context, Defended.</title>
        <meta name="description" content="yarnnn turns your scattered LLM chats into a source of truth. Lock in what matters and let our agents defend your context, so you can build with clarity." />
        <meta name="keywords" content="yarnnn, context OS, memory operating system, indie builder tools, creative tools, AI memory, block economy" />
        <meta property="og:title" content="yarnnn — context OS for indie builders" />
        <meta property="og:description" content="From scattered ideas to evolving memory — yarnnn helps you preserve clarity and defend what matters." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yarnnn.com" />
        <meta property="og:image" content="https://yarnnn.com/og-image.png" />
      </Head>
      <section className="relative overflow-hidden min-h-[500px]">
        <BackgroundPaths />
        <div className="relative z-10">
          <LandingHeader />
          <div className="max-w-[1200px] mx-auto px-4 py-24 flex flex-col items-start">
            <div className="font-brand text-4xl md:text-7xl">yarnnn</div>
            <div className="mt-6 text-xl md:text-2xl max-w-[800px]">
              Your thinking, preserved. Your context, defended.
            </div>
            <div className="mt-4 text-md md:text-lg max-w-[800px]">
              yarnnn is the memory sanctum for your AI-powered work. Turn chaotic dumps into a clear narrative, <strong>Lock In</strong> what matters, and let our agents protect your context from drift and contradiction.
            </div>
            <div className="mt-6">
              <Link href="/baskets" className="inline-block bg-black text-white rounded-xl px-6 py-3 text-lg">
                Create Your First Basket
              </Link>
            </div>
          </div>
        </div>
      </section>
      <LandingFooter />
    </>
  );
}
