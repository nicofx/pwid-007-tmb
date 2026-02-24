import type { CapsuleReport, LintIssue } from './types.js';

function sortIssues(issues: LintIssue[]): LintIssue[] {
  return [...issues].sort((a, b) => {
    if (a.severity !== b.severity) {
      return a.severity === 'ERROR' ? -1 : 1;
    }
    if (a.code !== b.code) {
      return a.code.localeCompare(b.code);
    }
    return a.path.localeCompare(b.path);
  });
}

export function formatPretty(reports: CapsuleReport[]): string {
  const lines: string[] = [];
  for (const report of reports) {
    const ordered = sortIssues(report.issues);
    const errorCount = ordered.filter((entry) => entry.severity === 'ERROR').length;
    const warnCount = ordered.filter((entry) => entry.severity === 'WARN').length;

    lines.push(`Capsule: ${report.capsuleId}`);
    lines.push(`Path: ${report.sourcePath}`);
    lines.push(
      `Counts: scenes=${report.counts.scenes} beats=${report.counts.beats} hotspots=${report.counts.hotspots} locations=${report.counts.locations} presets=${report.counts.presets} events=${report.counts.worldEvents}`
    );
    lines.push(`Issues: errors=${errorCount} warnings=${warnCount}`);

    if (ordered.length === 0) {
      lines.push('  ✓ No issues');
    } else {
      for (const entry of ordered) {
        lines.push(`  [${entry.severity}] ${entry.code} at ${entry.path}`);
        lines.push(`    ${entry.message}`);
        lines.push(`    fix: ${entry.suggestion}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}

export function formatJson(reports: CapsuleReport[]): string {
  return JSON.stringify(reports, null, 2);
}

export function hasBlockingIssues(reports: CapsuleReport[], strict: boolean): boolean {
  for (const report of reports) {
    for (const lintIssue of report.issues) {
      if (lintIssue.severity === 'ERROR') {
        return true;
      }
      if (strict && lintIssue.severity === 'WARN') {
        return true;
      }
    }
  }

  return false;
}
