import { Injectable } from '@nestjs/common';
import type { TurnPacket } from '@tmb/contracts';
import type { CapsuleSchema } from '@tmb/contracts';
import type { NarrativeContext, SessionMemory } from './narrative.types';

@Injectable()
export class NarrativeContextBuilder {
  build(params: {
    packetBase: TurnPacket;
    capsule?: CapsuleSchema;
    sessionId: string;
    turnId: string;
    memory: SessionMemory;
  }): NarrativeContext {
    const { packetBase, capsule, sessionId, turnId, memory } = params;

    const scene = capsule?.scenes.find((candidate) => candidate.id === packetBase.scene.sceneId);
    const hotspotLabels = (packetBase.affordances?.activeHotspots ?? [])
      .map((id) => capsule?.hotspots.find((hotspot) => hotspot.id === id)?.label)
      .filter((label): label is string => Boolean(label));

    const locationLabels = (scene?.locations ?? [])
      .filter((location) => packetBase.affordances?.activeLocations.includes(location.id))
      .map((location) => location.label);

    return {
      sessionId,
      turnId,
      capsuleId: packetBase.capsuleId,
      truths: [
        `Outcome is ${packetBase.outcome}`,
        `Scene is ${packetBase.scene.sceneId}`,
        `Beat is ${packetBase.scene.beatId}`
      ],
      toneTags: [packetBase.visual.mood, 'grounded', 'concise'],
      eraLabel: packetBase.capsuleId === 'berlin-1933' ? 'Berlin 1933' : 'Historical setting',
      allowedLocationIds: packetBase.affordances?.activeLocations ?? [],
      allowedHotspotIds: packetBase.affordances?.activeHotspots ?? [],
      allowedNpcIds: Object.keys(packetBase.stateText.trustByNpc ?? {}),
      allowedItemTags: [],
      allowedLabels: [...hotspotLabels, ...locationLabels],
      actionSummary: `${packetBase.action.verb} ${packetBase.action.targetId ?? 'current'}`,
      outcomeSummary: packetBase.outcome,
      deltaSummary: [
        ...(packetBase.deltas?.cluesAdded?.map((clue) => `clue:${clue}`) ?? []),
        ...(packetBase.deltas?.leverageAdded?.map((leverage) => `leverage:${leverage}`) ?? []),
        ...(packetBase.deltas?.inventoryAdded?.map((item) => `inventory:${item}`) ?? [])
      ],
      memoryBullets: memory.bullets.slice(0, 10)
    };
  }
}
