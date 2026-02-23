import { Injectable, Logger } from '@nestjs/common';
import {
  clampPreset,
  validatePreset,
  type PresetDefinition,
  type SelectedPreset
} from '@tmb/contracts';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ApiError } from '../../common/api-error';

interface CachedPresets {
  presets: PresetDefinition[];
  mtimeMs: number;
}

@Injectable()
export class FilePresetProvider {
  private readonly logger = new Logger(FilePresetProvider.name);
  private readonly cache = new Map<string, CachedPresets>();
  private readonly capsuleDir = path.resolve(process.cwd(), '../../docs/foundation/capsules');
  private readonly presetsDir = path.resolve(
    process.cwd(),
    '../../docs/foundation/capsules/presets'
  );

  async getPresets(capsuleId: string): Promise<PresetDefinition[]> {
    const filepath = await this.resolvePresetFile(capsuleId);
    const stat = await fs.stat(filepath);
    const cached = this.cache.get(capsuleId);

    if (cached && cached.mtimeMs === stat.mtimeMs) {
      return cached.presets;
    }

    const raw = await fs.readFile(filepath, 'utf8');
    const data = JSON.parse(raw) as unknown[];
    if (!Array.isArray(data) || data.length === 0) {
      throw ApiError.presetNotFound('default');
    }

    const presets: PresetDefinition[] = [];
    for (const item of data) {
      const validated = validatePreset(item);
      if (!validated.ok) {
        throw new Error(`PRESET_SCHEMA_INVALID:${validated.error}`);
      }
      const clamped = clampPreset(validated.value);
      presets.push(clamped.preset);
      if (clamped.clamped) {
        this.logger.warn(
          JSON.stringify({
            event: 'preset_clamped',
            capsuleId,
            presetId: clamped.preset.id,
            notes: clamped.clampNotes
          })
        );
      }
    }

    this.cache.set(capsuleId, { presets, mtimeMs: stat.mtimeMs });
    return presets;
  }

  async getSelectedPreset(params: {
    capsuleId: string;
    presetId?: string;
  }): Promise<SelectedPreset> {
    const presets = await this.getPresets(params.capsuleId);
    const selectedId = params.presetId ?? 'default';
    const found = presets.find((preset) => preset.id === selectedId);
    if (!found) {
      throw ApiError.presetNotFound(selectedId);
    }

    const clamped = clampPreset(found);
    return {
      capsuleId: params.capsuleId,
      presetId: found.id,
      dials: clamped.preset.dials,
      tags: found.tags,
      clamped: clamped.clamped,
      clampNotes: clamped.clampNotes
    };
  }

  private async resolvePresetFile(capsuleId: string): Promise<string> {
    const candidates = [
      path.join(this.presetsDir, `${capsuleId}.presets.json`),
      path.join(this.capsuleDir, `${capsuleId}.presets.json`)
    ];

    for (const candidate of candidates) {
      try {
        await fs.stat(candidate);
        return candidate;
      } catch {
        continue;
      }
    }

    throw ApiError.presetNotFound('default');
  }
}
