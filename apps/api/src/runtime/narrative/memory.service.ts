import { Injectable } from '@nestjs/common';
import type { TurnPacket } from '@tmb/contracts';
import type { SessionMemory } from './narrative.types';

const MAX_MEMORY_BULLETS = 10;

@Injectable()
export class MemoryService {
  fromJson(input: unknown): SessionMemory {
    const json = input as SessionMemory | null | undefined;
    return {
      bullets: Array.isArray(json?.bullets)
        ? json.bullets.filter((entry) => typeof entry === 'string').slice(0, MAX_MEMORY_BULLETS)
        : []
    };
  }

  update(params: {
    memory: SessionMemory;
    packet: TurnPacket;
    blockedReason?: string;
  }): SessionMemory {
    const next = [...params.memory.bullets];
    const { packet } = params;

    if (params.blockedReason) {
      next.push(`Blocked: ${params.blockedReason}`);
    }

    if (packet.deltas?.beatChanged) {
      next.push(`Beat progressed to ${packet.deltas.beatChanged.to}`);
    }
    for (const clue of packet.deltas?.cluesAdded ?? []) {
      next.push(`Clue: ${clue}`);
    }
    for (const leverage of packet.deltas?.leverageAdded ?? []) {
      next.push(`Leverage: ${leverage}`);
    }
    for (const item of packet.deltas?.inventoryAdded ?? []) {
      next.push(`Inventory: ${item}`);
    }
    if (packet.deltas?.state && Object.keys(packet.deltas.state).length > 0) {
      next.push(
        `State now S:${packet.stateText.suspicion} T:${packet.stateText.tension} C:${packet.stateText.clock} R:${packet.stateText.risk}`
      );
    }
    if (packet.end) {
      next.push(`Ending reached: ${packet.end.endingId}`);
    }

    const deduped = this.dedupe(next);
    return {
      bullets: deduped.slice(-MAX_MEMORY_BULLETS)
    };
  }

  private dedupe(values: string[]): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (let index = values.length - 1; index >= 0; index -= 1) {
      const value = values[index];
      if (!value) {
        continue;
      }
      if (!seen.has(value)) {
        seen.add(value);
        out.unshift(value);
      }
    }
    return out;
  }
}
