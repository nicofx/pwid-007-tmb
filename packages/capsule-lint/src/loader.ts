import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { LoadedCapsule, PresetFile } from './types.js';

const capsuleMtimeCache = new Map<string, number>();
const capsuleContentCache = new Map<string, unknown>();

export async function discoverCapsulePaths(capsuleDir: string): Promise<string[]> {
  const entries = await fs.readdir(capsuleDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .filter((entry) => entry.name.endsWith('.json'))
    .filter((entry) => !entry.name.endsWith('.presets.json'))
    .map((entry) => path.join(capsuleDir, entry.name))
    .sort();
}

async function loadJsonWithCache(filepath: string): Promise<unknown> {
  const stat = await fs.stat(filepath);
  const cachedMtime = capsuleMtimeCache.get(filepath);
  if (cachedMtime === stat.mtimeMs && capsuleContentCache.has(filepath)) {
    return capsuleContentCache.get(filepath);
  }

  const raw = await fs.readFile(filepath, 'utf8');
  const parsed = JSON.parse(raw) as unknown;
  capsuleMtimeCache.set(filepath, stat.mtimeMs);
  capsuleContentCache.set(filepath, parsed);
  return parsed;
}

export async function loadCapsuleFromPath(capsulePath: string): Promise<LoadedCapsule> {
  const raw = await loadJsonWithCache(capsulePath);
  const capsuleId = path.basename(capsulePath, '.json');
  return { capsulePath, capsuleId, raw };
}

export async function resolveCapsulePaths(
  workspaceRoot: string,
  capsuleArg?: string
): Promise<string[]> {
  const capsuleDir = path.join(workspaceRoot, 'docs', 'foundation', 'capsules');
  if (!capsuleArg) {
    return discoverCapsulePaths(capsuleDir);
  }

  if (capsuleArg.endsWith('.json') || capsuleArg.includes('/')) {
    const fullPath = path.isAbsolute(capsuleArg)
      ? capsuleArg
      : path.resolve(workspaceRoot, capsuleArg);
    return [fullPath];
  }

  return [path.join(capsuleDir, `${capsuleArg}.json`)];
}

export async function loadPresetFile(
  workspaceRoot: string,
  capsuleId: string
): Promise<PresetFile> {
  const candidates = [
    path.join(
      workspaceRoot,
      'docs',
      'foundation',
      'capsules',
      'presets',
      `${capsuleId}.presets.json`
    ),
    path.join(workspaceRoot, 'docs', 'foundation', 'capsules', `${capsuleId}.presets.json`)
  ];

  for (const filepath of candidates) {
    try {
      await fs.stat(filepath);
      return { path: filepath, data: await loadJsonWithCache(filepath) };
    } catch {
      continue;
    }
  }

  return {};
}
