import type { CapsuleSchema } from '@tmb/contracts';
import type { IStateFactory } from '../ports/interfaces.js';
import type { SessionState } from '../domain/types.js';

export class SessionStateFactory implements IStateFactory {
  createInitial(params: {
    sessionId: string;
    seed: string;
    capsule: CapsuleSchema;
    roleId?: string;
    presetId?: string;
  }): SessionState {
    const { sessionId, seed, capsule, roleId, presetId } = params;

    return {
      sessionId,
      seed,
      capsuleId: capsule.capsuleId,
      roleId: roleId ?? capsule.defaultRoleId,
      presetId: presetId ?? capsule.defaultPresetId,
      sceneId: capsule.initial.sceneId,
      beatId: capsule.initial.beatId,
      locationId: capsule.initial.locationId,
      turnNumber: 0,
      stateText: {
        ...capsule.initial.stateText,
        trustByNpc: capsule.initial.stateText.trustByNpc ?? {}
      },
      leverage: new Set<string>(),
      inventory: new Set<string>(),
      clues: new Set<string>(),
      repeatActionCounts: {},
      hotspotOverrides: { enable: [], disable: [] },
      locationOverrides: { enable: [], disable: [] },
      wed: {
        sceneBudgetUsed: {},
        capsuleBudgetUsed: { soft: 0, strong: 0 },
        mixCounts: { help: 0, shift: 0, friction: 0 },
        cooldowns: {},
        recentEvents: [],
        repeatsByVerb: {},
        repeatsByTarget: {}
      },
      ended: false
    };
  }
}
