#!/usr/bin/env node
/**
 * Agent-Operable Test Pipeline
 * Orchestrates test runs for agents:
 *  - preflight (env + versions)
 *  - seed via API
 *  - generate storageState
 *  - run subsets
 *  - emit artifacts: artifacts/test-report.json + test-report.md
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

type Subset = 'canon'|'features'|'unit'|'contracts'|'all';
const subset = (process.argv.find(a => a.startsWith('--subset='))?.split('=')[1] ?? 'all') as Subset;

console.log(`🤖 Agent Test Pipeline - Subset: ${subset}`);

function run(cmd: string, args: string[], cwd = '.', env = process.env) {
  console.log(`  → ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd, env });
  return r.status ?? 1;
}

function safeRun(name: string, cmd: string, args: string[], cwd='.') {
  console.log(`🔧 ${name}`);
  const code = run(cmd, args, cwd);
  const status = code === 0 ? '✅' : '❌';
  console.log(`${status} ${name} (exit: ${code})`);
  return { name, code };
}

const artifacts = 'artifacts';
mkdirSync(artifacts, { recursive: true });

console.log('\n📋 Preflight Checks');
const checks: Record<string, any> = {};
checks.preflight = {
  node: process.version,
  baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
  hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  workingDir: process.cwd()
};

console.log(`  Node: ${checks.preflight.node}`);
console.log(`  Base URL: ${checks.preflight.baseURL}`);
console.log(`  Supabase URL: ${checks.preflight.hasSupabaseUrl ? '✅' : '❌'}`);
console.log(`  Service Key: ${checks.preflight.hasSupabaseKey ? '✅' : '❌'}`);

function finalize(exitCode: number, error?: string) {
  const json = { error: true, exitCode, message: error || 'Unknown error' };
  writeFileSync(path.join(artifacts, 'test-report.json'), JSON.stringify(json, null, 2));
  const md = `# ❌ Agent Test Report - FAILED\n\n**Error:** ${error}\n**Exit Code:** ${exitCode}`;
  writeFileSync(path.join(artifacts, 'test-report.md'), md);
  process.exit(exitCode);
}

console.log('\n🏗️  Build & Setup Phase');

// Build web (ensures dev/CI parity)
const build = safeRun('build:web', 'npm', ['--prefix', 'web', 'run', 'build']);
if (build.code !== 0) {
  finalize(1, 'Web build failed');
}

// Seed via API
const seed = safeRun('seed:e2e', 'tsx', ['scripts/seed-e2e.ts', 'reset']);
if (seed.code !== 0) {
  finalize(1, 'E2E seeding failed');
}

// Create storageState via Playwright setup
const authSetup = safeRun('auth:setup', 'npx', ['playwright', 'test', 'tests/setup/auth.setup.ts', '--reporter=list']);
if (authSetup.code !== 0) {
  console.log('⚠️  Auth setup failed, continuing with unauthenticated tests only');
}

console.log('\n🧪 Test Execution Phase');
const results: Array<{name:string;code:number}> = [];
function push(name:string, code:number) { 
  const status = code === 0 ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${name}`);
  results.push({name, code}); 
}

const runSubset = (target: Subset) => {
  if (target === 'unit' || target === 'all') {
    console.log('  Running unit tests...');
    push('unit', run('npm', ['--prefix', 'web', 'run', 'test:unit']));
  }
  if (target === 'contracts' || target === 'all') {
    console.log('  Running contract tests...');
    push('contracts', run('npm', ['--prefix', 'web', 'run', 'test:contracts']));
  }
  if (target === 'canon' || target === 'all') {
    console.log('  Running canon compliance tests...');
    push('canon', run('npx', ['playwright', 'test', 'tests/canon/', '--reporter=list']));
  }
  if (target === 'features' || target === 'all') {
    console.log('  Running feature tests...');
    push('features', run('npx', ['playwright', 'test', 'tests/features/', '--reporter=list']));
  }
};

runSubset(subset);

console.log('\n📝 Generating Reports');

// Calculate overall status
const overallSuccess = results.every(r => r.code === 0) && build.code === 0 && seed.code === 0;
const totalTests = results.length;
const passedTests = results.filter(r => r.code === 0).length;

// Write JSON report
const json = { 
  subset, 
  checks, 
  setup: { 
    build: build.code, 
    seed: seed.code, 
    auth: authSetup.code 
  }, 
  results,
  summary: {
    overall: overallSuccess,
    passed: passedTests,
    total: totalTests
  }
};

writeFileSync(path.join(artifacts,'test-report.json'), JSON.stringify(json, null, 2));

// Write Markdown report
const md = [
  `# ${overallSuccess ? '✅' : '❌'} Agent Test Report`,
  `**Subset:** \`${subset}\` | **Status:** ${passedTests}/${totalTests} passed`,
  ``,
  `## 📋 Preflight`,
  `- Node: \`${checks.preflight.node}\``,
  `- Base URL: ${checks.preflight.baseURL}`,
  `- Supabase URL: ${checks.preflight.hasSupabaseUrl ? '✅' : '❌'}`,
  `- Service Key: ${checks.preflight.hasSupabaseKey ? '✅' : '❌'}`,
  ``,
  `## 🏗️ Setup`,
  `- build:web: ${build.code === 0 ? '✅' : '❌ ('+build.code+')'}`,
  `- seed:e2e: ${seed.code === 0 ? '✅' : '❌ ('+seed.code+')'}`,
  `- auth setup: ${authSetup.code === 0 ? '✅' : '⚠️ ('+authSetup.code+')'}`,
  ``,
  `## 🧪 Results`,
  ...results.map(r => `- **${r.name}**: ${r.code === 0 ? '✅ PASS' : '❌ FAIL ('+r.code+')'}`),
  ``,
  `## 📊 Summary`,
  `${overallSuccess ? '🎉 All tests passed!' : '🔍 Some tests need attention'}`,
  ``,
  `> 📁 Artifacts: \`artifacts/test-report.json\``,
  `> 🤖 Generated by Agent Test Pipeline`
].join('\n');

writeFileSync(path.join(artifacts,'test-report.md'), md);

console.log(`\n📊 Summary: ${passedTests}/${totalTests} passed`);
console.log(`📁 Reports written to artifacts/`);

// Exit with appropriate code
process.exit(overallSuccess ? 0 : 1);