import { Injectable } from '@nestjs/common';
import type { TurnPacket } from '@tmb/contracts';
import type { RunSummary, SessionMemory } from './narrative.types';

@Injectable()
export class RunSummaryService {
  fromJson(input: unknown): RunSummary | null {
    const json = input as RunSummary | null;
    if (!json || typeof json.endingId !== 'string' || !Array.isArray(json.highlights)) {
      return null;
    }
    return {
      endingId: json.endingId,
      outcome: json.outcome,
      highlights: json.highlights.filter((entry) => typeof entry === 'string').slice(0, 8)
    };
  }

  updateOnEnd(params: {
    packet: TurnPacket;
    memory: SessionMemory;
    existing: RunSummary | null;
  }): RunSummary | null {
    if (!params.packet.end) {
      return params.existing;
    }

    return {
      endingId: params.packet.end.endingId,
      outcome: params.packet.outcome,
      highlights: params.memory.bullets.slice(-6)
    };
  }
}
