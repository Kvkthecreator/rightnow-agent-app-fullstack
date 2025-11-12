"use client";

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';

const agents = [
  {
    name: 'Research Agent',
    description:
      'Monitors AI agents, market trends, and competitors. Run daily “monitor” sweeps or call a “deep_dive” when you need a focused brief on one topic.',
    subagents: 'web monitor, competitor tracker, social listener, analyst',
  },
  {
    name: 'Content Agent',
    description:
      'Creates and repurposes posts in your brand voice. Give it a topic or let it adapt existing work for Twitter, LinkedIn, blogs, and more.',
    subagents: 'Twitter writer, LinkedIn writer, blog writer, repurposer',
  },
  {
    name: 'Reporting Agent',
    description:
      'Turns the latest basket state into summaries, slide outlines, or spreadsheet-ready exports with a single “generate” request.',
    subagents: 'report writer, presentation designer, Excel specialist, data analyst',
  },
];

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About yarnnn — Shared context for multi-agent work</title>
        <meta
          name="description"
          content="Yarnnn auto-spins up projects, baskets, and on-call agents so you can delegate research, content, and reporting tasks without losing context."
        />
        <meta name="keywords" content="yarnnn, ai work platform, context, multi-agent workspace" />
        <meta property="og:title" content="About yarnnn — AI work platform" />
        <meta
          property="og:description"
          content="See how yarnnn gives solo founders a shared context for their research, content, and reporting agents."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yarnnn.com/about" />
        <meta property="og:image" content="https://yarnnn.com/og-image.png" />
      </Head>
      <LandingHeader />
      <main>
        <section className="w-full max-w-[1200px] mx-auto px-4 py-[120px] space-y-8">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">why yarnnn exists</p>
            <h1 className="text-foreground text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              One workspace. Three on-call agents. Shared context that never drifts.
            </h1>
            <p className="text-lg md:text-xl leading-relaxed max-w-3xl text-muted-foreground">
              yarnnn spins up a project, seeds the basket, and assigns your research, content, and reporting agents automatically.
              Every task starts from the same source of truth, so you spend time reviewing work—not repeating context.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-black px-6 py-3 text-lg font-medium text-white transition hover:bg-neutral-800"
            >
              Start a project
            </a>
            <a
              href="#agents"
              className="inline-flex items-center justify-center rounded-xl border border-neutral-300 px-6 py-3 text-lg font-medium text-foreground transition hover:border-neutral-400"
            >
              Meet the agents
            </a>
          </div>
        </section>

        <section className="w-full max-w-[1200px] mx-auto px-4 py-16 space-y-8">
          <div className="w-full h-px bg-black" />
          <h2 className="text-3xl md:text-4xl font-semibold">What yarnnn provides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h3 className="text-xl font-medium text-foreground">Shared context for every agent</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Each project begins as a basket—our persistent knowledge container. Raw dumps, structured blocks, and documents
                all belong to that basket, so every agent plugs into the exact same context.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-medium text-foreground">Auto-scaffolded agent roster</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                The moment you create a project we provision the research, content, and reporting agents for you. No manual setup,
                no juggling multiple bots—just pick the task you need and run it.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-medium text-foreground">Work sessions with real audit trails</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Every agent run is logged as a work request. You always know who ran what, where it pulled context from, and how it
                impacted the basket.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-medium text-foreground">Governance-ready workflow</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Agents propose the work. You review once. Approved work becomes part of your canon and stays ready for the next task.
              </p>
            </div>
          </div>
        </section>

        <section id="agents" className="w-full max-w-[1200px] mx-auto px-4 py-16 space-y-8">
          <div className="w-full h-px bg-black" />
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-semibold">Your on-call agents</h2>
            <p className="text-lg text-muted-foreground max-w-3xl">
              yarnnn treats agents like team members who share the same memory. Pick the task, hand over the basket, and let them run.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {agents.map((agent) => (
              <div key={agent.name} className="rounded-2xl border border-neutral-200 p-6 shadow-sm">
                <h3 className="text-2xl font-semibold mb-3">{agent.name}</h3>
                <p className="text-base text-muted-foreground leading-relaxed">{agent.description}</p>
                <p className="mt-4 text-sm text-neutral-500">
                  Subagents: <span className="text-foreground">{agent.subagents}</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="w-full max-w-[1200px] mx-auto px-4 py-16 space-y-8">
          <div className="w-full h-px bg-black" />
          <h2 className="text-3xl md:text-4xl font-semibold">How a project runs</h2>
          <ol className="space-y-6 text-lg text-muted-foreground">
            <li>
              <strong className="text-foreground">1. Create project.</strong> yarnnn creates the basket, seeds the first raw dump, and wires
              up the agent roster instantly.
            </li>
            <li>
              <strong className="text-foreground">2. Drop context once.</strong> Everything you paste becomes substrate—raw dumps plus
              structured blocks your agents can trust.
            </li>
            <li>
              <strong className="text-foreground">3. Assign an agent task.</strong> Choose the research, content, or reporting agent and call
              the task type you need: “monitor”, “deep_dive”, “create”, “repurpose”, or “generate.”
            </li>
            <li>
              <strong className="text-foreground">4. Review and lock it in.</strong> Work requests keep a full audit trail. Approve once and
              the output becomes part of your canon for future work.
            </li>
          </ol>
        </section>

        <footer className="px-4 py-12 text-center text-base text-muted-foreground">
          We’re building yarnnn so solo founders can delegate to multiple agents without losing the plot. Your context stays central,
          your agents stay in sync.
        </footer>
      </main>
      <LandingFooter />
    </>
  );
}
