import { Injectable } from '@nestjs/common';
import type { TurnPacket } from '@tmb/contracts';
import type { SceneSummary, SessionMemory } from './narrative.types';

@Injectable()
export class SceneSummaryService {
  fromJson(input: unknown): SceneSummary | null {
    const json = input as SceneSummary | null;
    if (!json || typeof json.sceneId !== 'string' || typeof json.beatId !== 'string') {
      return null;
    }
    return json;
  }

  updateOnTurn(params: {
    previousPacket: TurnPacket;
    currentPacket: TurnPacket;
    memory: SessionMemory;
    existing: SceneSummary | null;
  }): SceneSummary | null {
    const sceneChanged =
      params.previousPacket.scene.sceneId !== params.currentPacket.scene.sceneId ||
      params.previousPacket.scene.beatId !== params.currentPacket.scene.beatId;

    if (!sceneChanged && params.existing) {
      return params.existing;
    }

    const highlights = params.memory.bullets.slice(-3).join(' | ') || 'No notable changes yet.';
    return {
      sceneId: params.currentPacket.scene.sceneId,
      beatId: params.currentPacket.scene.beatId,
      summary: `Scene ${params.currentPacket.scene.sceneTitle}: ${highlights}`
    };
  }
}
