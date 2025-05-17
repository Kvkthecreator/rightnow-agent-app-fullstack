export default function ServicesSection() {
  return (
    <section className="max-w-[1200px] mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <div className="border-t border-gray-200 pt-16">
        <h2 className="text-4xl md:text-6xl font-normal mb-16">Services</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Service 1 - Custom AI Tools */}
          <div className="flex flex-col">
            <div className="mb-6 h-64 overflow-hidden rounded-md bg-neutral-100 flex items-center justify-center">
              <img
                src="/assets/images/img_customAItools.jpg"
                alt="Custom AI Tools"
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-xl md:text-2xl font-normal mb-4">Your Own Team of Marketing Agents</h3>
            <p className="text-base md:text-lg">
              Get you started with setting up our tailor made custom GPTs, scheduling workflows, and teach you to use
              the latest AI tools to boost efficiency.
            </p>
          </div>

          {/* Service 2 - Data & Analytics */}
          <div className="flex flex-col">
            <div className="mb-6 h-64 overflow-hidden rounded-md bg-neutral-100 flex items-center justify-center">
              <img
                src="/assets/images/img_data_analyticstools.jpg"
                alt="Data & Analytics Tools"
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-xl md:text-2xl font-normal mb-4">Data & Analytics <span className="text-xs">*</span>soon</h3>
            <p className="text-base md:text-lg">
              We'll help you deep-dive into your engagement and data metrics to really find your niche, optimal target
              consumer, and identify key differences between SNS channels and performance.
            </p>
          </div>

          {/* Service 3 - Brand Partnerships */}
          <div className="flex flex-col">
            <div className="mb-6 h-64 overflow-hidden rounded-md bg-neutral-100 flex items-center justify-center">
              <img
                src="/assets/images/brand_partnershipstools.jpg"
                alt="Brand Partnerships Tools"
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-xl md:text-2xl font-normal mb-4">Brand Partnerships <span className="text-xs">*</span>soon</h3>
            <p className="text-base md:text-lg">
              Coming Soon: Step-by-step, negotiate brand partnership deals, collaborations, and overall contract
              management systems.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
