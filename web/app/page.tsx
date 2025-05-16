"use client";

import Link from 'next/link';
import { ChatTeardropText, ArrowsOutCardinal, Smiley, Butterfly, MicrophoneStage } from 'phosphor-react';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-black font-sans flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex justify-end space-x-6 text-sm">
        <Link href="/login" className="text-gray-700 hover:underline">
          Sign-Up / Login
        </Link>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-12 text-left border-b">
        <div className="flex justify-start gap-6 mb-6">
          <img
            src="/assets/logos/rightnow-logo-dark.png"
            alt="rightNOW logo"
            className="w-30 h-30 object-contain"
          />
        </div>
        <h1 className="text-3xl md:text-5xl font-medium">
          Want to be an influencer<br />or content creator?
        </h1>
        <div className="mt-8">
          <Link
            href="/profile-create"
            className="inline-block px-8 py-4 border border-black text-black rounded-md hover:bg-black hover:text-white transition"
          >
            Create Your Starter Kit
          </Link>
        </div>
      </section>

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

      {/* Footer */}
      <footer className="px-6 py-12 grid grid-cols-1 md:grid-cols-3 text-sm">
        <div className="flex gap-3 mb-6 md:mb-0">
          <div className="w-8 h-8 bg-black rounded-full" />
          <div className="w-8 h-8 border-2 border-black rounded-full" />
        </div>
        <div className="space-y-2">
          <p className="font-medium">OFFICE</p>
          <p>Seoul, South Korea</p>
          <p className="font-medium pt-4">CONTACT</p>
          <p>contactus@rgtnow.com</p>
        </div>
        <div className="space-y-2">
          <p className="font-medium">SOCIAL</p>
          <ul className="space-y-1">
            <li>Instagram</li>
            <li>LinkedIn</li>
          </ul>
        </div>
      </footer>
    </main>
  );
}