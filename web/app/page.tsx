import Link from 'next/link';

// FeatureCard component and data for features section
interface Feature {
  title: string;
  description: string;
}

function FeatureCard({ title, description }: Feature) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-md">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

const features: Feature[] = [
  { title: 'Niche Discovery', description: 'Identify your unique niche to stand out.' },
  { title: 'Tone Definition', description: 'Define the perfect tone for your audience.' },
  { title: 'Audience Analysis', description: 'Understand your target audience deeply.' },
  { title: 'Content Roadmap', description: 'Get a roadmap to plan your content strategy.' },
  { title: 'Growth Tips', description: 'Receive actionable tips to grow your following.' },
  { title: 'Brand Guidelines', description: 'Set up brand guidelines for consistent messaging.' },
];

export default function Page() {
  const year = new Date().getFullYear();
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center py-20 px-6">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
          🎯 Your Creator Starter Kit is Ready
        </h1>
        <p className="text-lg text-gray-700 max-w-2xl mb-6">
          Discover your unique niche, define your tone, and captivate your audience with our personalized Starter Kit.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mb-2">
          <Link
            href="/profile-create"
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Create Your Profile
          </Link>
          <Link
            href="/profile-create"
            className="px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition"
          >
            Get My Starter Kit
          </Link>
        </div>
        <span className="text-sm text-gray-500">No fluff. No signup wall...</span>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto mb-12 text-center">
          <h2 className="text-3xl font-bold">🧭 What You'll Get</h2>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <FeatureCard key={feature.title} title={feature.title} description={feature.description} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-6 bg-gray-50 text-center text-sm text-gray-500">
        © {year} rightNOW. Personalized strategy for aspiring creators.
      </footer>
    </div>
  );
}