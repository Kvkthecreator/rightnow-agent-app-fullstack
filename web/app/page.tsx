/* updated landing page */

"use client";

import type { Metadata } from 'next';
import Link from 'next/link';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import BackgroundPaths from '@/components/BackgroundPaths';

export const metadata: Metadata = {
  title: 'yarnnn — from ideas to evolving memory',
  description:
    'Dump as you go, and we keep up. Yarnnn weaves your scattered thoughts into reusable context blocks and evolving briefs.',
};

export default function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden min-h-[500px]">
        <BackgroundPaths />
        <div className="relative z-10">
          <LandingHeader />
          <div className="max-w-[1200px] mx-auto px-4 py-24 flex flex-col items-start">
            <div className="font-brand text-4xl md:text-7xl">yarnnn</div>
            <div className="mt-6 text-xl md:text-2xl max-w-[800px]">
              From scattered ideas to evolving memory — Yarnnn helps indie builders and creatives preserve their narrative and defend what matters.
            </div>
            <div className="mt-4 text-md md:text-lg max-w-[800px]">
              Yarnnn lets you dump freely into baskets, promote what matters into blocks, and receive gentle agent assistance — without fragmentation or cognitive overload.
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