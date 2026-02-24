import { mkdtempSync, mkdirSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { runCapsuleLint } from '../src/lint.js';
import { formatJson, formatPretty, hasBlockingIssues } from '../src/reporter.js';

describe('runCapsuleLint', () => {
  it('lints a minimal capsule in a temp workspace', async () => {
    const tempRoot = mkdtempSync(path.join(tmpdir(), 'capsule-lint-'));
    const capsulesDir = path.join(tempRoot, 'docs', 'foundation', 'capsules');
    const presetsDir = path.join(capsulesDir, 'presets');

    mkdirSync(presetsDir, { recursive: true });

    cpSync(
      path.resolve(process.cwd(), '../../fixtures/capsules/minimal_ok/minimal-ok.json'),
      path.join(capsulesDir, 'minimal-ok.json')
    );
    cpSync(
      path.resolve(process.cwd(), '../../fixtures/capsules/minimal_ok/minimal-ok.presets.json'),
      path.join(presetsDir, 'minimal-ok.presets.json')
    );

    const reports = await runCapsuleLint({
      workspaceRoot: tempRoot,
      capsule: 'minimal-ok',
      format: 'pretty',
      strict: false
    });

    expect(reports).toHaveLength(1);
    const report = reports[0]!;
    expect(report.capsuleId).toBe('minimal-ok');
    expect(report.issues.filter((entry) => entry.severity === 'ERROR')).toHaveLength(0);
    expect(hasBlockingIssues(reports, false)).toBe(false);

    const pretty = formatPretty(reports);
    const json = formatJson(reports);
    expect(pretty).toContain('Capsule: minimal-ok');
    expect(json).toContain('"capsuleId": "minimal-ok"');
  });

  it('treats warnings as blocking in strict mode', () => {
    const blocking = hasBlockingIssues(
      [
        {
          capsuleId: 'c1',
          sourcePath: 'c1.json',
          counts: { scenes: 1, beats: 1, hotspots: 1, locations: 1, presets: 0, worldEvents: 0 },
          issues: [
            {
              severity: 'WARN',
              code: 'X',
              message: 'warn',
              path: 'a',
              suggestion: 'b'
            }
          ]
        }
      ],
      true
    );

    expect(blocking).toBe(true);
  });
});
