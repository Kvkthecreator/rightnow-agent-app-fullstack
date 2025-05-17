import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import ServicesSection from '@/components/landing/ServicesSection';
import AgentsTeaserSection from "@/components/landing/AgentsTeaserSection";

export default function HomePage() {
  return (
    <>
      <LandingHeader />
      <main>
        <section className="w-full max-w-[1200px] mx-auto px-4 py-[120px]">
          <h1 className="text-black text-4xl md:text-6xl font-bold tracking-tight leading-tight text-left">
            "you don’t need a marketing team<br />
            you need marketing agents" <br />
            <br />
            rightNOW
          </h1>
        </section>
        <AgentsTeaserSection />
        <ServicesSection />
      </main>
      <LandingFooter />
    </>
  );
}
