/* updated about page */

import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import SystemCapabilitiesSection from "@/components/landing/SystemCapabilitiesSection";
import SystemPillarsSection from "@/components/landing/SystemPillarsSection";

export default function AboutPage() {
  return (
    <>
      <LandingHeader />
      <main>
        <section className="w-full max-w-[1200px] mx-auto px-4 py-[120px] space-y-6">
          <h1 className="text-foreground text-4xl md:text-6xl font-bold tracking-tight leading-tight text-left">
            <div className="font-brand text-3xl md:text-7xl">yarnnn</div>
            <br />
            is your memory operating system<br />
            for async thinkers and evolving strategy
          </h1>

          <p className="text-lg leading-relaxed max-w-2xl">
            Most tools make you start from scratch every time you open a doc or prompt an AI.
            Yarnnn gives you a living memory — a space where your thoughts, chats, and notes grow into strategy over time.
          </p>

          <p className="text-lg leading-relaxed max-w-2xl">
            It works through <strong>baskets</strong> — threads of ongoing intent.
            Inside each basket, yarnnn helps you reflect, organize, and act using
            <strong> context blocks</strong> and <strong>briefs</strong> — with agents that keep up as you go.
          </p>

          <p className="text-lg leading-relaxed max-w-2xl">
            Whether you're juggling startup chaos, building a creative business, or managing multiple brands —
            yarnnn helps you remember what matters and move forward with clarity.
          </p>
        </section>

        <SystemPillarsSection />
        <SystemCapabilitiesSection />

        <footer className="px-4 py-12 text-center text-sm text-muted-foreground">
          Our mission is to help independent creators and async teams think clearly, remember continuously, and act with evolving context.
        </footer>
      </main>
      <LandingFooter />
    </>
  );
}
