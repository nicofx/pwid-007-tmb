import type {
  CapsuleBeat,
  CapsuleSchema,
  NarrativeBlock,
  TurnAffordances,
  TurnPacket
} from '@tmb/contracts';
import type { SessionState } from '../domain/types.js';

export class TurnPacketBuilder {
  buildTurnPacket(params: {
    state: SessionState;
    capsule: CapsuleSchema;
    beat: CapsuleBeat;
    turnId: string;
    action: TurnPacket['action'];
    outcome: TurnPacket['outcome'];
    narrativeBlocks: NarrativeBlock[];
    affordances?: TurnAffordances;
    deltas?: TurnPacket['deltas'];
    worldEvent?: TurnPacket['worldEvent'];
    end?: TurnPacket['end'];
  }): TurnPacket {
    const {
      state,
      capsule,
      beat,
      turnId,
      action,
      outcome,
      narrativeBlocks,
      affordances,
      deltas,
      worldEvent,
      end
    } = params;
    const scene = capsule.scenes.find((candidate) => candidate.id === beat.sceneId);

    if (!scene) {
      throw new Error(`SCENE_NOT_FOUND:${beat.sceneId}`);
    }

    return {
      schemaVersion: '1.0.0',
      sessionId: state.sessionId,
      turnId,
      turnNumber: state.turnNumber,
      capsuleId: state.capsuleId,
      scene: {
        sceneId: scene.id,
        beatId: beat.id,
        sceneTitle: scene.title,
        beatTitle: beat.title
      },
      visual: scene.visual,
      action,
      outcome,
      narrativeBlocks,
      stateText: state.stateText,
      affordances: end ? undefined : affordances,
      deltas,
      worldEvent,
      end
    };
  }
}
