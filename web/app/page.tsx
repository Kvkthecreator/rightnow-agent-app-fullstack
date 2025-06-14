/* updated landing page */

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
        <title>yarnnn — context OS for indie builders</title>
        <meta name="description" content="From scattered ideas to evolving memory — yarnnn helps indie builders and creatives preserve their narrative and defend what matters." />
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
              From scattered ideas to evolving memory — yarnnn helps indie builders and creatives preserve their narrative and defend what matters.
            </div>
            <div className="mt-4 text-md md:text-lg max-w-[800px]">
              Dump freely into baskets, promote what matters into blocks, and get gentle agent assistance — without fragmentation or overload.
            </div>
            <div className="mt-6">
              <Link href="/baskets" className="inline-block bg-black text-white rounded-xl px-6 py-3 text-lg">
                Start your basket
              </Link>
            </div>
          </div>
        </div>
      </section>
      <LandingFooter />
    </>
  );
}
