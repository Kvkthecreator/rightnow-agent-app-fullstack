## codex/tasks/landingpage_refactor_w_figma.md

## 🎯 Goal
Add basic user flow entry points (sign up, log in, CTA)

## 🧠 Prompt to Codex
Please update the existing landing page file:

- Add a small header above the hero section with right-aligned `Sign Up` and `Login` links.
- Below the headline “Want to be an influencer…”, add a large button that says **“Create Your Starter Kit”**.
- The button should scroll to the 3-icon benefit section or link to `/profile-create`.

Use Tailwind styles for spacing, alignment, and hover effects. Mobile responsiveness should be preserved.


## sample code
import { ChatTeardropText, ArrowsOutCardinal, Smiley } from "phosphor-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-black font-sans">
      {/* Hero Section */}
      <section className="px-6 py-12 text-center border-b">
        <div className="flex justify-center gap-6 mb-6">
          <div className="w-12 h-12 bg-black rounded-full" />
          <div className="w-12 h-12 border-2 border-black rounded-full" />
          <div className="bg-black text-white px-3 py-1 font-bold text-sm">right<br />NOW</div>
        </div>
        <h1 className="text-3xl md:text-5xl font-medium">want to be an influencer<br />or content creator?</h1>
      </section>

      {/* Description + Feature Icons */}
      <section className="px-6 py-12 border-b grid grid-cols-1 md:grid-cols-2 gap-10">
        <p className="text-lg leading-relaxed">
          Discover your unique niche, captivate your audience with our personalized Starter Kit.
        </p>
        <div className="space-y-10">
          <div className="flex items-center gap-4">
            <ChatTeardropText size={40} />
            <span className="text-sm">Personal brand voice</span>
          </div>
          <div className="flex items-center gap-4">
            <ArrowsOutCardinal size={40} />
            <span className="text-sm">Growth direction</span>
          </div>
          <div className="flex items-center gap-4">
            <Smiley size={40} />
            <span className="text-sm">
              free, no login required<br />
              <em className="text-xs">*limited time only during beta</em>
            </span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-6 text-right">
        <a href="#" className="text-sm underline underline-offset-2">About →</a>
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
          <p>contactus@yarnnn.com</p>
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
