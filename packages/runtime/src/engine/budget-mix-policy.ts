import type {
  WedBudgetConfig,
  WedMixConfig,
  WorldEventDefinition,
  WorldEventFlavor
} from '@tmb/contracts';
import type { WedState } from '../domain/types.js';
import type { IRng } from '../ports/interfaces.js';

export type WedSkipReason =
  | 'WED_DISABLED'
  | 'NO_CANDIDATES'
  | 'BUDGET'
  | 'COOLDOWN'
  | 'MIX_CORRECTION'
  | 'ANTI_REPEAT'
  | 'FAIRNESS';

export interface SelectCandidateResult {
  event?: WorldEventDefinition;
  skipReason?: WedSkipReason;
  mixCorrectionApplied?: boolean;
}

export class BudgetMixPolicy {
  selectCandidate(params: {
    candidates: WorldEventDefinition[];
    wedState: WedState;
    sceneId: string;
    budget: WedBudgetConfig;
    mix: WedMixConfig;
    rng: IRng;
  }): SelectCandidateResult {
    const { candidates, wedState, sceneId, budget, mix, rng } = params;
    if (candidates.length === 0) {
      return { skipReason: 'NO_CANDIDATES' };
    }

    const sceneUsed = wedState.sceneBudgetUsed[sceneId] ?? { soft: 0, strong: 0 };
    let filtered = candidates.filter((candidate) => {
      if (candidate.intensity === 'strong') {
        return (
          sceneUsed.strong < budget.sceneStrongMax &&
          wedState.capsuleBudgetUsed.strong < budget.capsuleStrongMax
        );
      }
      return (
        sceneUsed.soft < budget.sceneSoftMax &&
        wedState.capsuleBudgetUsed.soft < budget.capsuleSoftMax
      );
    });
    if (filtered.length === 0) {
      return { skipReason: 'BUDGET' };
    }

    filtered = filtered.filter((candidate) => {
      const key = candidate.cooldownKey ?? candidate.eventId;
      return (wedState.cooldowns[key] ?? 0) <= 0;
    });
    if (filtered.length === 0) {
      return { skipReason: 'COOLDOWN' };
    }

    const lastTwo = wedState.recentEvents.slice(-2);
    const lastTwoFriction =
      lastTwo.length === 2 && lastTwo.every((id) => id.startsWith('friction:'));
    let mixCorrectionApplied = false;
    if (lastTwoFriction) {
      const withoutFriction = filtered.filter((event) => event.flavor !== 'friction');
      if (withoutFriction.length > 0) {
        filtered = withoutFriction;
        mixCorrectionApplied = true;
      }
    }

    const antiRepeat = filtered.filter(
      (event) => !wedState.recentEvents.some((entry) => entry.endsWith(`:${event.eventId}`))
    );
    if (antiRepeat.length > 0) {
      filtered = antiRepeat;
    } else if (filtered.length > 0) {
      return { skipReason: 'ANTI_REPEAT' };
    }

    const weighted = filtered.map((event) => ({
      event,
      weight: this.weightByMix(event.flavor, wedState, mix)
    }));
    const total = weighted.reduce((acc, item) => acc + item.weight, 0);
    let cursor = rng.nextFloat() * total;
    for (const item of weighted) {
      cursor -= item.weight;
      if (cursor <= 0) {
        return { event: item.event, mixCorrectionApplied };
      }
    }
    return { event: weighted[weighted.length - 1]?.event, mixCorrectionApplied };
  }

  private weightByMix(flavor: WorldEventFlavor, state: WedState, mix: WedMixConfig): number {
    const total = state.mixCounts.help + state.mixCounts.shift + state.mixCounts.friction;
    const currentRatio =
      total === 0
        ? 0
        : flavor === 'help'
          ? state.mixCounts.help / total
          : flavor === 'shift'
            ? state.mixCounts.shift / total
            : state.mixCounts.friction / total;

    const target = flavor === 'help' ? mix.help : flavor === 'shift' ? mix.shift : mix.friction;
    const correction = Math.max(0.1, target - currentRatio + 1);
    return correction;
  }
}
