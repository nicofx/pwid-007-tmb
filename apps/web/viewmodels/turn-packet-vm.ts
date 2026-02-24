import type { NarrativeBlock, TurnPacket } from '@tmb/contracts';
import { resolveStageAsset } from '@/lib/assetRegistry';

export interface TurnPacketViewModel {
  sceneTitle: string;
  beatTitle: string;
  locationTimeLabel: string;
  objectiveNow: string;
  narrativeBlocks: NarrativeBlock[];
  stateText: TurnPacket['stateText'];
  npcsPresent: string[];
  activeHotspots: string[];
  activeLocations: string[];
  allowedVerbs: TurnPacket['action']['verb'][];
  suggestedActions: NonNullable<TurnPacket['affordances']>['suggestedActions'];
  stage: ReturnType<typeof resolveStageAsset>;
  end?: TurnPacket['end'];
  activeIU?: TurnPacket['activeIU'];
  packet: TurnPacket;
}

const FALLBACK_BLOCK: NarrativeBlock = {
  kind: 'SYSTEM',
  text: 'El runtime no devolvió bloques narrativos.'
};

export function toTurnPacketViewModel(packet: TurnPacket): TurnPacketViewModel {
  const stage = resolveStageAsset({
    backdrop: packet.visual.backdrop,
    mood: packet.visual.mood
  });

  const objectiveNow =
    packet.affordances?.suggestedActions[0]?.reason ??
    (packet.end ? 'Revisar detalles del final' : 'Explorar el tramo actual');

  return {
    sceneTitle: packet.scene.sceneTitle,
    beatTitle: packet.scene.beatTitle,
    locationTimeLabel: `${packet.scene.sceneId} / ${packet.scene.beatId}`,
    objectiveNow,
    narrativeBlocks: packet.narrativeBlocks.length > 0 ? packet.narrativeBlocks : [FALLBACK_BLOCK],
    stateText: packet.stateText,
    npcsPresent: Object.keys(packet.stateText.trustByNpc ?? {}),
    activeHotspots: packet.affordances?.activeHotspots ?? [],
    activeLocations: packet.affordances?.activeLocations ?? [],
    allowedVerbs: packet.affordances?.allowedVerbs ?? [],
    suggestedActions: packet.affordances?.suggestedActions ?? [],
    stage,
    end: packet.end,
    activeIU: packet.activeIU,
    packet
  };
}
