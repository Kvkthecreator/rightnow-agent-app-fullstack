import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import SystemCapabilitiesSection from "@/components/landing/SystemCapabilitiesSection";
import SystemPillarsSection from "@/components/landing/SystemPillarsSection";
import Brand from "@/components/Brand";

export default function HomePage() {
    return (
        <>
            <LandingHeader />
            <main>
                <section className="w-full max-w-[1200px] mx-auto px-4 py-[120px] space-y-6">
                    <h1 className="text-foreground text-4xl md:text-6xl font-bold tracking-tight leading-tight text-left">
                        <div className="font-brand text-3xl md:text-7xl">yarnnn</div>
                        <br />
                        is your memory operating system
                        <br />
                        for async thinkers and creative builders
                    </h1>
                    <p className="text-lg leading-relaxed max-w-2xl">
                        Instead of juggling scattered docs, forgotten chats, and one-off prompts —
                        yarnnn lets you work with AI in a way that <em>remembers</em>.
                        Every thought you drop becomes a reusable building block, woven into your bigger goal.
                    </p>
                    <p className="text-lg leading-relaxed max-w-2xl">
                        We call these threads 'baskets' — a container for your intent, context, and evolution.
                        Inside, yarnnn helps you organize, reflect, and act — with context-aware agents always ready to assist.
                    </p>
                </section>
                <SystemPillarsSection />
                <SystemCapabilitiesSection />
                <footer className="px-4 py-12 text-center text-sm text-muted-foreground">
                    Our mission is to help async thinkers and independent creators
                    work with clarity and continuity — powered by thoughtful memory design.
                </footer>
            </main>
            <LandingFooter />
        </>
    );
}
