import type {
  BeatEndingCondition,
  CapsuleBeat,
  CapsuleSchema,
  OutcomeType,
  TurnDeltas
} from '@tmb/contracts';
import type { ProgressionResult, SessionState } from '../domain/types.js';

function getBeatById(capsule: CapsuleSchema, beatId: string): CapsuleBeat {
  const beat = capsule.beats.find((candidate) => candidate.id === beatId);
  if (!beat) {
    throw new Error(`BEAT_NOT_FOUND:${beatId}`);
  }
  return beat;
}

function conditionsSatisfied(state: SessionState, conditions?: BeatEndingCondition): boolean {
  if (!conditions) {
    return true;
  }

  if (conditions.clockAtLeast !== undefined && state.stateText.clock < conditions.clockAtLeast) {
    return false;
  }

  if ((conditions.requiresClues ?? []).some((clue: string) => !state.clues.has(clue))) {
    return false;
  }

  if (
    (conditions.requiresLeverage ?? []).some((leverage: string) => !state.leverage.has(leverage))
  ) {
    return false;
  }

  return true;
}

export class BeatProgression {
  advanceBeat(params: {
    state: SessionState;
    capsule: CapsuleSchema;
    beat: CapsuleBeat;
    outcome: OutcomeType;
    deltas: TurnDeltas;
  }): ProgressionResult {
    const { state, capsule, beat, outcome, deltas } = params;
    const unsupportedRules: string[] = [];

    if (outcome === 'BLOCKED') {
      return { state, unsupportedRules };
    }

    let nextBeatId = state.beatId;
    for (const rule of beat.advanceRules ?? []) {
      if (rule.clockAtLeast !== undefined && state.stateText.clock < rule.clockAtLeast) {
        continue;
      }
      if (rule.onOutcomes && !rule.onOutcomes.includes(outcome)) {
        continue;
      }
      if (!rule.nextBeatId) {
        unsupportedRules.push('NOT_IMPLEMENTED:advance_rule_without_nextBeatId');
        continue;
      }
      nextBeatId = rule.nextBeatId;
      break;
    }

    let nextState = state;
    let beatChanged: ProgressionResult['beatChanged'];
    if (nextBeatId !== state.beatId) {
      const nextBeat = getBeatById(capsule, nextBeatId);
      nextState = {
        ...state,
        beatId: nextBeat.id,
        sceneId: nextBeat.sceneId
      };
      beatChanged = { from: state.beatId, to: nextBeat.id };
      deltas.beatChanged = beatChanged;
    }

    const currentBeat = getBeatById(capsule, nextState.beatId);
    const ending = currentBeat.end;
    if (ending && conditionsSatisfied(nextState, ending.conditions)) {
      return {
        state: {
          ...nextState,
          ended: true
        },
        unsupportedRules,
        beatChanged,
        end: {
          endingId: ending.id,
          title: ending.title,
          text: ending.text
        }
      };
    }

    return { state: nextState, unsupportedRules, beatChanged };
  }
}
