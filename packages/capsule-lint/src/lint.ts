import type { CapsuleSchema } from '@tmb/contracts';
import { loadCapsuleFromPath, loadPresetFile, resolveCapsulePaths } from './loader.js';
import {
  validateGameplayInvariants,
  validatePresets,
  validateReferentialIntegrity,
  validateSchema,
  validateWorldEvents
} from './validators.js';
import type { CapsuleReport, LintIssue, LintOptions } from './types.js';

function countLocations(capsule: CapsuleSchema): number {
  return capsule.scenes.reduce((total, scene) => total + scene.locations.length, 0);
}

export async function runCapsuleLint(options: LintOptions): Promise<CapsuleReport[]> {
  const capsulePaths = await resolveCapsulePaths(options.workspaceRoot, options.capsule);

  const reports: CapsuleReport[] = [];
  for (const capsulePath of capsulePaths) {
    const loaded = await loadCapsuleFromPath(capsulePath);
    const schema = validateSchema(loaded.raw);

    const issues: LintIssue[] = [...schema.issues];
    let counts = {
      scenes: 0,
      beats: 0,
      hotspots: 0,
      locations: 0,
      presets: 0,
      worldEvents: 0
    };

    if (schema.capsule) {
      const capsule = schema.capsule;
      const presetFile = await loadPresetFile(options.workspaceRoot, capsule.capsuleId);

      issues.push(...validateReferentialIntegrity(capsule));
      issues.push(...validateGameplayInvariants(capsule));
      issues.push(...validatePresets(capsule, presetFile.data, presetFile.path));
      issues.push(...validateWorldEvents(capsule));

      counts = {
        scenes: capsule.scenes.length,
        beats: capsule.beats.length,
        hotspots: capsule.hotspots.length,
        locations: countLocations(capsule),
        presets: Array.isArray(presetFile.data) ? presetFile.data.length : 0,
        worldEvents: capsule.worldEvents?.events.length ?? 0
      };

      reports.push({
        capsuleId: capsule.capsuleId,
        sourcePath: capsulePath,
        counts,
        issues
      });
      continue;
    }

    reports.push({
      capsuleId: loaded.capsuleId,
      sourcePath: capsulePath,
      counts,
      issues
    });
  }

  return reports;
}
