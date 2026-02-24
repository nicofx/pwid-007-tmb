import type { CapsuleSchema } from '@tmb/contracts';

export type IssueSeverity = 'ERROR' | 'WARN';

export interface LintIssue {
  severity: IssueSeverity;
  code: string;
  message: string;
  path: string;
  suggestion: string;
}

export interface CapsuleReport {
  capsuleId: string;
  sourcePath: string;
  counts: {
    scenes: number;
    beats: number;
    hotspots: number;
    locations: number;
    presets: number;
    worldEvents: number;
  };
  issues: LintIssue[];
}

export interface LintOptions {
  workspaceRoot: string;
  capsule?: string;
  format: 'pretty' | 'json';
  strict: boolean;
}

export interface LoadedCapsule {
  capsulePath: string;
  capsuleId: string;
  raw: unknown;
  capsule?: CapsuleSchema;
}

export interface PresetFile {
  path?: string;
  data?: unknown;
}
