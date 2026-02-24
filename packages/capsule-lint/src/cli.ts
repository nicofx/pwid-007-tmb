#!/usr/bin/env node
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { parseArgs } from './args.js';
import { runCapsuleLint } from './lint.js';
import { formatJson, formatPretty, hasBlockingIssues } from './reporter.js';

function resolveWorkspaceRoot(cwd: string): string {
  let current = cwd;
  for (;;) {
    if (existsSync(path.join(current, 'pnpm-workspace.yaml'))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return cwd;
    }
    current = parent;
  }
}

async function main(): Promise<void> {
  const workspaceRoot = resolveWorkspaceRoot(process.cwd());
  const args = parseArgs(process.argv.slice(2), workspaceRoot);

  const startedAt = Date.now();
  const reports = await runCapsuleLint(args);
  const elapsedMs = Date.now() - startedAt;

  const rendered = args.format === 'json' ? formatJson(reports) : formatPretty(reports);
  process.stdout.write(`${rendered}\n`);
  process.stdout.write(`capsule-lint completed in ${elapsedMs}ms\n`);

  if (hasBlockingIssues(reports, args.strict)) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`capsule-lint failed: ${message}\n`);
  process.exitCode = 1;
});
