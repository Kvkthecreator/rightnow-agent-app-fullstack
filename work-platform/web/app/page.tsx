"use client";

import Head from 'next/head';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import BackgroundPaths from '@/components/BackgroundPaths';

const whatYouGet = [
  {
    title: 'Shared context baskets',
    description:
      'Every project is backed by a basket that keeps raw dumps, blocks, and documents together, so every agent sees the same truth.',
    icon: '🧺',
  },
  {
    title: 'Auto-provisioned agents',
    description:
      'Research, Content, and Reporting agents are created the moment you spin up a project—no setup before you delegate.',
    icon: '🤝',
  },
  {
    title: 'Work requests with receipts',
    description:
      'Each agent run is logged with task type, parameters, and status. You can always see who ran what and why.',
    icon: '🧾',
  },
  {
    title: 'Review once, lock it in',
    description:
      'Approve the work and yarnnn updates your canon automatically. No re-writing the same context for the next run.',
    icon: '🔐',
  },
];

const agentCards = [
  {
    name: 'Research Agent',
    blurb: 'Run “monitor” for daily sweeps or “deep_dive” for focused briefs on a single topic.',
    subagents: 'web monitor, competitor tracker, social listener, analyst',
  },
  {
    name: 'Content Agent',
    blurb: 'Use “create” or “repurpose” to get platform-ready copy that matches your basket.',
    subagents: 'Twitter writer, LinkedIn writer, blog writer, repurposer',
  },
  {
    name: 'Reporting Agent',
    blurb: 'Call “generate” to turn your latest state into executive summaries or spreadsheet exports.',
    subagents: 'report writer, presentation designer, Excel specialist, data analyst',
  },
];

export default function LandingPage() {
  return (
    <>
      <Head>
        <title>yarnnn — launch a project with on-call agents</title>
        <meta
          name="description"
          content="Yarnnn spins up a basket, seeds your context, and attaches research, content, and reporting agents so you can delegate without repeating yourself."
        />
        <meta name="keywords" content="yarnnn, ai work platform, multi-agent workspace, context management" />
        <meta property="og:title" content="yarnnn — AI work platform" />
        <meta property="og:description" content="Create a project and let yarnnn provision the shared context and agents for you." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yarnnn.com" />
        <meta property="og:image" content="https://yarnnn.com/og-image.png" />
      </Head>
      <section className="relative overflow-hidden min-h-[500px]">
        <BackgroundPaths />
        <div className="relative z-10">
          <LandingHeader />
          <div className="max-w-[1200px] mx-auto px-4 py-24 flex flex-col items-start space-y-6">
            <span className="text-xs uppercase tracking-[0.4em] text-neutral-500">beta access · multi-agent workspace</span>
            <h1 className="font-brand text-4xl md:text-7xl">Launch a project. yarnnn spins up your workspace.</h1>
            <p className="text-lg md:text-xl max-w-[800px] text-muted-foreground">
              One basket holds your context, and research, content, and reporting agents stay attached to it. Drop intent once. Review work once. Never
              repeat yourself.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <a
                href="/login"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('redirectPath', '/baskets');
                  }
                }}
                className="inline-flex items-center justify-center bg-black text-white rounded-xl px-6 py-3 text-lg hover:bg-neutral-800 transition"
              >
                Start a project
              </a>
              <a href="#how-it-works" className="inline-flex items-center justify-center rounded-xl border px-6 py-3 text-lg border-neutral-300 hover:border-neutral-400 transition">
                See how it works
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full max-w-[1200px] mx-auto px-4 py-16 space-y-8">
        <div className="w-full h-px bg-black" />
        <h2 className="text-4xl md:text-5xl font-normal">What you get out of the box</h2>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Projects, baskets, agents, and work requests are wired together from day one. You focus on intent; yarnnn keeps the rest in sync.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
          {whatYouGet.map((item) => (
            <div key={item.title}>
              <h3 className="text-neutral-500 text-base md:text-xl font-normal mb-2 flex items-center gap-2">
                <span role="img" aria-label={item.title}>
                  {item.icon}
                </span>
                {item.title}
              </h3>
              <p className="text-black text-base md:text-lg font-normal leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="w-full max-w-[1200px] mx-auto px-4 py-16 space-y-8" id="agents">
        <div className="w-full h-px bg-black" />
        <div className="flex flex-col gap-3">
          <h2 className="text-4xl md:text-5xl font-normal">Your three on-call agents</h2>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Each project auto-provisions Research, Content, and Reporting agents, so you can run “monitor”, “create”, or “generate” right away.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {agentCards.map((agent) => (
            <div key={agent.name} className="rounded-2xl border border-neutral-200 p-6 shadow-sm">
              <h3 className="text-2xl font-semibold mb-3">{agent.name}</h3>
              <p className="text-base text-muted-foreground leading-relaxed">{agent.blurb}</p>
              <p className="mt-4 text-sm text-neutral-500">
                Subagents: <span className="text-foreground">{agent.subagents}</span>
              </p>
            </div>
          ))}
        </div>
        <div>
          <a href="/about#agents" className="inline-flex items-center text-base font-medium text-black underline-offset-4 hover:underline">
            See the full agent roster
          </a>
        </div>
      </section>

      <section id="how-it-works" className="w-full max-w-[1200px] mx-auto px-4 py-16 space-y-8">
        <div className="w-full h-px bg-black" />
        <h2 className="text-4xl md:text-5xl font-normal">How a project runs</h2>
        <ol className="space-y-6 text-lg text-muted-foreground">
          <li>
            <strong className="text-foreground">1. Create project.</strong> yarnnn creates the basket, seeds the first raw dump, and wires up the agent roster instantly.
          </li>
          <li>
            <strong className="text-foreground">2. Drop context once.</strong> Everything you paste becomes substrate—raw dumps plus structured blocks your agents can trust.
          </li>
          <li>
            <strong className="text-foreground">3. Assign an agent task.</strong> Choose the agent and call the task you need: “monitor”, “deep_dive”, “create”, “repurpose”, or “generate.”
          </li>
          <li>
            <strong className="text-foreground">4. Review & lock it in.</strong> Work requests keep a full audit trail. Approve once and the output becomes part of your canon for future work.
          </li>
        </ol>
      </section>

      <section className="w-full max-w-[1200px] mx-auto px-4 py-16 space-y-6">
        <div className="w-full h-px bg-black" />
        <div className="rounded-2xl border border-dashed border-neutral-300 p-6 text-center space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">beta program</p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We’re onboarding solo founders and small teams now. Get in touch if you want early access to the shared-context, multi-agent workspace.
          </p>
          <a href="mailto:contactus@yarnnn.com" className="inline-flex items-center justify-center rounded-xl border px-5 py-2 text-sm font-medium hover:border-neutral-400">
            Contact us
          </a>
        </div>
      </section>

      <LandingFooter />
    </>
  );
}
