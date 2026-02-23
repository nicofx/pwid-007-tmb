import type { TurnPacket } from '@tmb/contracts';
import type { SessionState } from '@tmb/runtime';

interface SessionStateDbJson {
  sessionId: string;
  capsuleId: string;
  roleId: string;
  presetId: string;
  sceneId: string;
  beatId: string;
  locationId: string;
  turnNumber: number;
  stateText: SessionState['stateText'];
  leverage: string[];
  inventory: string[];
  clues: string[];
  repeatActionCounts: Record<string, number>;
  hotspotOverrides?: SessionState['hotspotOverrides'];
  locationOverrides?: SessionState['locationOverrides'];
  wed: SessionState['wed'];
  ended: boolean;
}

export function sessionStateToJson(state: SessionState): SessionStateDbJson {
  return {
    sessionId: state.sessionId,
    capsuleId: state.capsuleId,
    roleId: state.roleId,
    presetId: state.presetId,
    sceneId: state.sceneId,
    beatId: state.beatId,
    locationId: state.locationId,
    turnNumber: state.turnNumber,
    stateText: state.stateText,
    leverage: Array.from(state.leverage),
    inventory: Array.from(state.inventory),
    clues: Array.from(state.clues),
    repeatActionCounts: state.repeatActionCounts,
    hotspotOverrides: state.hotspotOverrides,
    locationOverrides: state.locationOverrides,
    wed: state.wed,
    ended: state.ended
  };
}

export function jsonToSessionState(input: unknown): SessionState {
  const json = input as SessionStateDbJson;
  return {
    sessionId: json.sessionId,
    capsuleId: json.capsuleId,
    roleId: json.roleId,
    presetId: json.presetId,
    sceneId: json.sceneId,
    beatId: json.beatId,
    locationId: json.locationId,
    turnNumber: json.turnNumber,
    stateText: json.stateText,
    leverage: new Set(json.leverage ?? []),
    inventory: new Set(json.inventory ?? []),
    clues: new Set(json.clues ?? []),
    repeatActionCounts: json.repeatActionCounts ?? {},
    hotspotOverrides: json.hotspotOverrides ?? { enable: [], disable: [] },
    locationOverrides: json.locationOverrides ?? { enable: [], disable: [] },
    wed: json.wed ?? {
      sceneBudgetUsed: {},
      capsuleBudgetUsed: { soft: 0, strong: 0 },
      mixCounts: { help: 0, shift: 0, friction: 0 },
      cooldowns: {},
      recentEvents: [],
      repeatsByVerb: {},
      repeatsByTarget: {}
    },
    ended: Boolean(json.ended)
  };
}

export function jsonToTurnPacket(input: unknown): TurnPacket {
  return input as TurnPacket;
}
