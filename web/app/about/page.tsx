import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';

export default function HomePage() {
  return (
    <>
      <LandingHeader />
      <main>
        <section className="w-full max-w-[1200px] mx-auto px-4 py-[120px]">
          <h1 className="text-black text-4xl md:text-6xl font-normal leading-tight text-left">
            "you don’t need a marketing team<br />
            you need marketing agents rightNOW"
          </h1>
        </section>
      </main>
      <LandingFooter />
    </>
  );
}
