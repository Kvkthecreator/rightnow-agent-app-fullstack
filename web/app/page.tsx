"use client";

import Head from 'next/head';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import BackgroundPaths from '@/components/BackgroundPaths';

export default function LandingPage() {
  return (
    <>
      <Head>
        <title>yarnnn — Turn chaos into context</title>
        <meta
          name="description"
          content="Yarnnn turns your scattered thoughts, LLM chats, and raw ideas into structured, evolving blocks of strategy and memory."
        />
        <meta name="keywords" content="yarnnn, context OS, memory operating system, creative workflows, AI thinking tools" />
        <meta property="og:title" content="yarnnn — context OS for creative builders" />
        <meta property="og:description" content="From chaos to clarity — yarnnn helps you preserve, evolve, and act on your ideas with structure and memory." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yarnnn.com" />
        <meta property="og:image" content="https://yarnnn.com/og-image.png" />
      </Head>
      <section className="relative overflow-hidden min-h-[500px]">
        <BackgroundPaths />
        <div className="relative z-10">
          <LandingHeader />
          <div className="max-w-[1200px] mx-auto px-4 py-24 flex flex-col items-start">
            <h1 className="font-brand text-4xl md:text-7xl mb-4">yarnnn</h1>
            <p className="text-xl md:text-2xl max-w-[800px]">
              Control your memory. Control your world.
            </p>
            <p className="mt-6 text-md md:text-lg max-w-[800px]">
              Finally organize your AI chaos. Build a memory system that evolves with your ideas.
            </p>

            {/* Optional demo section */}
            {/* <div className="mt-6">
              <iframe src="https://www.loom.com/embed/your-video-id" frameBorder="0" className="w-full h-[360px] rounded-lg" allowFullScreen></iframe>
            </div> */}

            <div className="mt-8">
              <a
                href="/login"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('redirectPath', '/dashboard/home');
                  }
                }}
                className="inline-block bg-black text-white rounded-xl px-6 py-3 text-lg hover:bg-neutral-800 transition"
              >
                try yarnnn - it remembers for you
              </a>
            </div>
          </div>
        </div>
      </section>
      <LandingFooter />
    </>
  );
}
