import type { LintOptions } from './types.js';

export function parseArgs(argv: string[], workspaceRoot: string): LintOptions {
  let capsule: string | undefined;
  let format: 'pretty' | 'json' = 'pretty';
  let strict = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--capsule') {
      capsule = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--format') {
      const next = argv[i + 1];
      if (next === 'pretty' || next === 'json') {
        format = next;
      }
      i += 1;
      continue;
    }
    if (arg === '--strict') {
      strict = true;
      continue;
    }
  }

  return {
    workspaceRoot,
    capsule,
    format,
    strict
  };
}
