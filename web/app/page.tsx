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
              <h1 className="text-3xl md:text-5xl font-bold mb-4">
                weave your thoughts<br />
                with a memory operating system<br />
                designed for working with AI
              </h1>
              <p className="text-lg leading-relaxed mb-6 max-w-xl">
                start each idea with a simple dump.
                yarnnn turns it into a structured thread —
                a living memory powered by reusable blocks and context-aware agents.
              </p>
              <Link
                href="/basket/create"
                className="inline-block px-8 py-4 border border-foreground text-foreground rounded-md hover:bg-black hover:text-white transition"
              >
                drop your first thought
              </Link>
            </div>
        </div>
      </section>

      {/* Main content - no animated background */}
      <main className="bg-background text-foreground flex flex-col">
        <div className="max-w-[1200px] mx-auto px-4 w-full">
          {/* Description + Feature Icons */}
          <section id="benefits" className="px-6 py-12 border-b grid grid-cols-1 md:grid-cols-2 gap-10">
            <p className="text-lg leading-relaxed">
              yarnnn helps you organize evolving projects, reuse your thinking, and get context-aware assistance.
            </p>
            <div className="space-y-10">
              <div className="flex items-center gap-4">
                <span className="text-xl">🧺</span>
                <span className="text-sm">One basket = one focused context thread</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xl">◾</span>
                <span className="text-sm">Blocks store brand tone, strategy, goals</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xl">🪄</span>
                <span className="text-sm">Get help that understands your memory</span>
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