import { Injectable } from '@nestjs/common';
import { validateWorldEventCatalog, type CapsuleSchema } from '@tmb/contracts';
import type { ICapsuleProvider } from '@tmb/runtime';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ApiError } from '../../common/api-error';

interface CachedCapsule {
  capsule: CapsuleSchema;
  mtimeMs: number;
}

@Injectable()
export class FileCapsuleProvider implements ICapsuleProvider {
  private readonly cache = new Map<string, CachedCapsule>();
  private readonly capsuleDir = path.resolve(process.cwd(), '../../docs/foundation/capsules');

  async getCapsule(capsuleId: string): Promise<CapsuleSchema> {
    const startedAt = Date.now();
    const filepath = path.join(this.capsuleDir, `${capsuleId}.json`);

    let stat;
    try {
      stat = await fs.stat(filepath);
    } catch {
      throw ApiError.capsuleNotFound(capsuleId);
    }

    const cacheEntry = this.cache.get(capsuleId);
    if (cacheEntry && cacheEntry.mtimeMs === stat.mtimeMs) {
      return cacheEntry.capsule;
    }

    const raw = await fs.readFile(filepath, 'utf8');
    const capsule = JSON.parse(raw) as CapsuleSchema;
    if (capsule.worldEvents) {
      const worldEventsValidation = validateWorldEventCatalog(capsule.worldEvents);
      if (!worldEventsValidation.ok) {
        throw new Error(`WORLD_EVENTS_INVALID:${worldEventsValidation.error}`);
      }
    }
    this.cache.set(capsuleId, { capsule, mtimeMs: stat.mtimeMs });

    const loadMs = Date.now() - startedAt;
    void loadMs;

    return capsule;
  }
}
