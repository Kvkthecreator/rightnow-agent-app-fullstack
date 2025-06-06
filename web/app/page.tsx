"use client";

import Link from 'next/link';
import { ArrowsOutCardinal, Butterfly, MicrophoneStage } from 'phosphor-react';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import BackgroundPaths from '@/components/BackgroundPaths';

export default function LandingPage() {
  return (
    <>
      {/* Animated BG behind just the header and hero */}
      <section className="relative overflow-hidden min-h-[500px]">
        <BackgroundPaths />
          <div className="relative z-10">
            <LandingHeader />
            <div className="max-w-[1200px] mx-auto px-4 py-24 flex flex-col items-start">
              <img
                src="/assets/logos/yarn-logo-light.png"
                alt="yarn logo"
                className="w-32 h-32 mb-6 object-contain"
              />
              <h1 className="text-3xl md:text-5xl font-bold mb-6">
                weave your thoughts<br />using AI
              </h1>
              <Link
                href="/blocks/setup"
                className="inline-block px-8 py-4 border border-foreground text-foreground rounded-md hover:bg-black hover:text-white transition"
              >
                Create Your Starter Kit
              </Link>
            </div>
        </div>
      </section>

      {/* Main content - no animated background */}
      <main className="bg-background text-foreground font-sans flex flex-col">
        <div className="max-w-[1200px] mx-auto px-4 w-full">
          {/* Description + Feature Icons */}
          <section id="benefits" className="px-6 py-12 border-b grid grid-cols-1 md:grid-cols-2 gap-10">
            <p className="text-lg leading-relaxed">
              Discover your unique niche, captivate your audience with our personalized Starter Kit.
            </p>
            <div className="space-y-10">
              <div className="flex items-center gap-4">
                <MicrophoneStage size={40} />
                <span className="text-sm">Personal brand voice</span>
              </div>
              <div className="flex items-center gap-4">
                <ArrowsOutCardinal size={40} />
                <span className="text-sm">Growth direction</span>
              </div>
              <div className="flex items-center gap-4">
                <Butterfly size={40} />
                <span className="text-sm">
                  free, no login required<br />
                  <em className="text-xs">*limited time only during beta</em>
                </span>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="px-6 py-6 text-right">
            <Link
              href="/about"
              className="text-sm underline underline-offset-2 hover:text-black/70 transition"
            >
              About &rarr;
            </Link>
          </section>

          {/* Mission Statement */}
          <section className="px-6 py-12 border-t border-b">
            <p className="text-xl md:text-2xl max-w-3xl mx-auto text-center">
              our aim is to help evolve upcoming artists and creators from part-time to full-time,
              from local to global, from unknown to stardom
            </p>
          </section>
        </div>
      </main>
      <LandingFooter />
    </>
  );
}