import type { ActionModel, CapsuleBeat, CapsuleSchema, TurnDeltas } from '@tmb/contracts';
import type { OutcomeResolution, SessionState } from '../domain/types.js';
import type { IRng } from '../ports/interfaces.js';

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function repeatKey(state: SessionState, action: ActionModel): string {
  return `${state.beatId}:${action.verb}:${action.targetId ?? 'none'}`;
}

export class OutcomeResolver {
  resolveOutcome(params: {
    action: ActionModel;
    beat: CapsuleBeat;
    capsule: CapsuleSchema;
    state: SessionState;
    rng: IRng;
    blocked: boolean;
    riskBias?: number;
    costScale?: number;
  }): OutcomeResolution {
    const { action, capsule, state, rng, blocked } = params;

    if (blocked) {
      return {
        outcome: 'BLOCKED',
        deltas: {},
        costApplied: { repeatedActionPenalty: false, riskyActionPenalty: false }
      };
    }

    const hotspot = action.targetId
      ? capsule.hotspots.find((candidate) => candidate.id === action.targetId)
      : undefined;

    const repetition = state.repeatActionCounts[repeatKey(state, action)] ?? 0;
    const riskPenalty = hotspot?.risk ?? 0;
    const repeatPenalty = repetition > 1 ? 0.2 : 0;
    const score = rng.nextFloat() - riskPenalty - repeatPenalty + (params.riskBias ?? 0);

    const outcome = score >= 0.45 ? 'SUCCESS' : score >= 0.2 ? 'PARTIAL' : 'FAIL_FORWARD';

    const deltas: TurnDeltas = {
      state: {}
    };

    const costScale = Math.max(0.2, params.costScale ?? 1);

    if (repetition > 1) {
      deltas.state = {
        ...deltas.state,
        tension: clamp(state.stateText.tension + scaleCost(8, costScale)),
        clock: clamp(state.stateText.clock + scaleCost(1, costScale))
      };
    }

    if (outcome === 'FAIL_FORWARD') {
      deltas.state = {
        ...deltas.state,
        suspicion: clamp(state.stateText.suspicion + scaleCost(6, costScale)),
        clock: clamp(
          Math.max(state.stateText.clock + scaleCost(1, costScale), deltas.state?.clock ?? 0)
        )
      };
    }

    if (outcome === 'PARTIAL') {
      deltas.state = {
        ...deltas.state,
        tension: clamp(state.stateText.tension + scaleCost(2, costScale)),
        clock: clamp(
          Math.max(state.stateText.clock + scaleCost(1, costScale), deltas.state?.clock ?? 0)
        )
      };
    }

    if (outcome === 'SUCCESS' || outcome === 'PARTIAL') {
      if (hotspot?.rewards?.clues?.length) {
        deltas.cluesAdded = hotspot.rewards.clues.slice(0, 1);
      }
      if (hotspot?.rewards?.leverage?.length) {
        deltas.leverageAdded = hotspot.rewards.leverage.slice(0, 1);
      }
      if (hotspot?.rewards?.inventory?.length) {
        deltas.inventoryAdded = hotspot.rewards.inventory.slice(0, 1);
      }
    }

    return {
      outcome,
      deltas,
      costApplied: {
        repeatedActionPenalty: repetition > 1,
        riskyActionPenalty: riskPenalty > 0
      }
    };
  }
}

function scaleCost(base: number, scale: number): number {
  return Math.max(1, Math.round(base * scale));
}
