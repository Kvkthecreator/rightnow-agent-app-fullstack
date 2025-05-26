## codex/tasks/web_indexpagedesign.md
Codex Task (for Full Automation)

Task:
Refactor the landing page so that the animated SVG background (BackgroundPaths) is only visible behind the header and hero section.
Add a fade-out gradient at the bottom of the SVG (white in light mode, dark in dark mode).
On mobile screens (sm and below), hide the animated SVG background entirely.
Ensure all content sits above the background using relative z-index.
Do not alter the rest of the page structure.
All code must be modular and placed in the appropriate files.

tep 1: Update or Create Components

1. components/BackgroundPaths.tsx
Update your component so the background:

Fades out at the bottom with a gradient
Is hidden or less visible on mobile
"use client";

import { motion } from "framer-motion";

function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    color: `rgba(15,23,42,${0.1 + i * 0.03})`,
    width: 0.5 + i * 0.03,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      <svg className="w-full h-full text-slate-950 dark:text-white" viewBox="0 0 696 316" fill="none">
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.1 + path.id * 0.03}
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            animate={{
              pathLength: 1,
              opacity: [0.3, 0.6, 0.3],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        ))}
      </svg>
      {/* Fade-out gradient at the bottom */}
      <div className="absolute bottom-0 left-0 w-full h-24 pointer-events-none"
           style={{
             background: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, #fff 100%)",
             // For dark mode:
             // background: "linear-gradient(to bottom, rgba(23,23,23,0) 0%, #171717 100%)",
           }}
      />
    </div>
  );
}

// Responsive: Hide or reduce on small screens
export default function BackgroundPaths() {
  return (
    <div className="absolute inset-0 z-0 hidden sm:block">
      {/* Only render on sm+ screens */}
      <FloatingPaths position={1} />
      <FloatingPaths position={-1} />
    </div>
  );
}
2. app/page.tsx (or your landing page file)
Use your new BackgroundPaths like this:

import BackgroundPaths from "@/components/BackgroundPaths";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import Link from "next/link";
import { MicrophoneStage, ArrowsOutCardinal, Butterfly } from "phosphor-react";

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
              src="/assets/logos/rightnow-logo-dark.png"
              alt="rightNOW logo"
              className="w-32 h-32 mb-6 object-contain"
            />
            <h1 className="text-3xl md:text-5xl font-bold mb-6">
              Want to be an influencer<br />or content creator?
            </h1>
            <Link
              href="/profile-create"
              className="inline-block px-8 py-4 border border-black text-black rounded-md hover:bg-black hover:text-white transition"
            >
              Create Your Starter Kit
            </Link>
          </div>
        </div>
      </section>

      {/* Main content - no animated background */}
      <main className="bg-white text-black font-sans flex flex-col">
        <div className="max-w-[1200px] mx-auto px-4 w-full">
          {/* ...other sections exactly as before */}
        </div>
      </main>
      <LandingFooter />
    </>
  );
}
3. (Optional) Add More Fine-Tuning
For dark mode: update the gradient color for the fade-out overlay in BackgroundPaths.
If you want the SVG to render but at reduced opacity on mobile (instead of hidden), change hidden sm:block to something like block opacity-20 sm:opacity-100.