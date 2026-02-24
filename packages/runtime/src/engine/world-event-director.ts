import type {
  CapsuleSchema,
  SelectedPreset,
  WedBudgetConfig,
  WedMixConfig,
  WorldEventDefinition
} from '@tmb/contracts';
import type { SessionState, TurnContext, WedState } from '../domain/types.js';
import type { IRng } from '../ports/interfaces.js';
import { BudgetMixPolicy, type WedSkipReason } from './budget-mix-policy.js';
import { EventEffectApplier } from './event-effect-applier.js';
import { TriggerEvaluator } from './trigger-evaluator.js';

export interface WorldEventApplyResult {
  state: SessionState;
  deltas: import('@tmb/contracts').TurnDeltas;
  affordances?: import('@tmb/contracts').TurnAffordances;
  eventBlock?: { kind: 'EVENT'; text: string };
  fired: boolean;
  eventId?: string;
  flavor?: 'help' | 'shift' | 'friction';
  intensity?: 'soft' | 'strong';
  skipReason?: WedSkipReason;
  compensationUsed?: boolean;
  matchedCandidates: number;
  totalEvents: number;
}

const DEFAULT_BUDGET: WedBudgetConfig = {
  sceneStrongMax: Number(process.env.WED_SCENE_STRONG_MAX ?? 1),
  sceneSoftMax: Number(process.env.WED_SCENE_SOFT_MAX ?? 2),
  capsuleStrongMax: Number(process.env.WED_CAPSULE_STRONG_MAX ?? 2),
  capsuleSoftMax: Number(process.env.WED_CAPSULE_SOFT_MAX ?? 4),
  strongCooldownTurns: Number(process.env.WED_STRONG_COOLDOWN_TURNS ?? 3)
};

const DEFAULT_MIX: WedMixConfig = {
  help: Number(process.env.WED_MIX_HELP ?? 0.3),
  shift: Number(process.env.WED_MIX_SHIFT ?? 0.4),
  friction: Number(process.env.WED_MIX_FRICTION ?? 0.3)
};

export class WorldEventDirector {
  private readonly triggerEvaluator = new TriggerEvaluator();
  private readonly budgetPolicy = new BudgetMixPolicy();
  private readonly effectApplier = new EventEffectApplier();

  maybeApply(params: {
    context: TurnContext;
    state: SessionState;
    capsule: CapsuleSchema;
    preset?: SelectedPreset;
    rng: IRng;
    deltas: import('@tmb/contracts').TurnDeltas;
    affordances?: import('@tmb/contracts').TurnAffordances;
  }): WorldEventApplyResult {
    if ((process.env.WED_ENABLED ?? 'true').toLowerCase() !== 'true') {
      return {
        state: this.tickCooldowns(this.bumpRepetition(params.state, params.context)),
        deltas: params.deltas,
        affordances: params.affordances,
        fired: false,
        skipReason: 'WED_DISABLED',
        matchedCandidates: 0,
        totalEvents: 0
      };
    }

    const state = this.tickCooldowns(this.bumpRepetition(params.state, params.context));
    const catalog = params.capsule.worldEvents;
    const events = catalog?.events ?? [];

    const candidates = events.filter((event) =>
      this.triggerEvaluator.matches(event, {
        state,
        beatId: state.beatId,
        sceneId: state.sceneId,
        actionVerb: params.context.request.action?.verb ?? 'OBSERVE',
        actionTargetId: params.context.request.action?.targetId,
        preset: params.preset
      })
    );

    const budget = this.resolveBudget(catalog?.overrides?.budget);
    const mix = this.resolveMix(catalog?.overrides?.mix);

    const selected = this.budgetPolicy.selectCandidate({
      candidates,
      wedState: state.wed,
      sceneId: state.sceneId,
      budget,
      mix,
      rng: params.rng
    });

    if (!selected.event) {
      return {
        state: {
          ...state,
          wed: {
            ...state.wed,
            lastSkipReason: selected.skipReason
          }
        },
        deltas: params.deltas,
        affordances: params.affordances,
        fired: false,
        skipReason: selected.skipReason,
        matchedCandidates: candidates.length,
        totalEvents: events.length
      };
    }

    const applied = this.effectApplier.apply({
      event: selected.event,
      state,
      capsule: params.capsule,
      affordances: params.affordances,
      deltas: params.deltas
    });

    if (selected.event.flavor === 'friction' && !applied.compensationUsed) {
      return {
        state: {
          ...state,
          wed: {
            ...state.wed,
            lastSkipReason: 'FAIRNESS'
          }
        },
        deltas: params.deltas,
        affordances: params.affordances,
        fired: false,
        skipReason: 'FAIRNESS',
        matchedCandidates: candidates.length,
        totalEvents: events.length
      };
    }

    const updatedWed = this.consumeBudget({
      wed: applied.state.wed,
      event: selected.event,
      sceneId: applied.state.sceneId,
      strongCooldownTurns: budget.strongCooldownTurns
    });

    return {
      state: {
        ...applied.state,
        wed: updatedWed
      },
      deltas: applied.deltas,
      affordances: applied.affordances,
      eventBlock: applied.eventBlock,
      fired: true,
      eventId: selected.event.eventId,
      flavor: selected.event.flavor,
      intensity: selected.event.intensity,
      compensationUsed: applied.compensationUsed,
      matchedCandidates: candidates.length,
      totalEvents: events.length
    };
  }

  private resolveBudget(overrides?: Partial<WedBudgetConfig>): WedBudgetConfig {
    return {
      sceneStrongMax: clampInt(overrides?.sceneStrongMax ?? DEFAULT_BUDGET.sceneStrongMax, 0, 5),
      sceneSoftMax: clampInt(overrides?.sceneSoftMax ?? DEFAULT_BUDGET.sceneSoftMax, 0, 6),
      capsuleStrongMax: clampInt(
        overrides?.capsuleStrongMax ?? DEFAULT_BUDGET.capsuleStrongMax,
        0,
        8
      ),
      capsuleSoftMax: clampInt(overrides?.capsuleSoftMax ?? DEFAULT_BUDGET.capsuleSoftMax, 0, 12),
      strongCooldownTurns: clampInt(
        overrides?.strongCooldownTurns ?? DEFAULT_BUDGET.strongCooldownTurns,
        0,
        12
      )
    };
  }

  private resolveMix(overrides?: Partial<WedMixConfig>): WedMixConfig {
    const help = clamp01(overrides?.help ?? DEFAULT_MIX.help);
    const shift = clamp01(overrides?.shift ?? DEFAULT_MIX.shift);
    const friction = clamp01(overrides?.friction ?? DEFAULT_MIX.friction);
    const total = help + shift + friction || 1;
    return {
      help: help / total,
      shift: shift / total,
      friction: friction / total
    };
  }

  private tickCooldowns(state: SessionState): SessionState {
    const cooldowns: Record<string, number> = {};
    for (const [key, value] of Object.entries(state.wed.cooldowns)) {
      cooldowns[key] = Math.max(0, value - 1);
    }
    return {
      ...state,
      wed: {
        ...state.wed,
        cooldowns
      }
    };
  }

  private bumpRepetition(state: SessionState, context: TurnContext): SessionState {
    const verb = context.request.action?.verb ?? 'OBSERVE';
    const target = context.request.action?.targetId ?? 'none';
    return {
      ...state,
      wed: {
        ...state.wed,
        repeatsByVerb: {
          ...state.wed.repeatsByVerb,
          [verb]: (state.wed.repeatsByVerb[verb] ?? 0) + 1
        },
        repeatsByTarget: {
          ...state.wed.repeatsByTarget,
          [target]: (state.wed.repeatsByTarget[target] ?? 0) + 1
        }
      }
    };
  }

  private consumeBudget(params: {
    wed: WedState;
    event: WorldEventDefinition;
    sceneId: string;
    strongCooldownTurns: number;
  }): WedState {
    const { wed, event, sceneId, strongCooldownTurns } = params;
    const sceneBudget = wed.sceneBudgetUsed[sceneId] ?? { soft: 0, strong: 0 };
    const nextSceneBudget = {
      ...sceneBudget,
      [event.intensity]: sceneBudget[event.intensity] + 1
    };

    const cooldownKey = event.cooldownKey ?? event.eventId;
    const mixCounts = {
      ...wed.mixCounts,
      [event.flavor]: wed.mixCounts[event.flavor] + 1
    };

    return {
      ...wed,
      sceneBudgetUsed: {
        ...wed.sceneBudgetUsed,
        [sceneId]: nextSceneBudget
      },
      capsuleBudgetUsed: {
        ...wed.capsuleBudgetUsed,
        [event.intensity]: wed.capsuleBudgetUsed[event.intensity] + 1
      },
      mixCounts,
      cooldowns: {
        ...wed.cooldowns,
        [cooldownKey]: event.intensity === 'strong' ? strongCooldownTurns : 1
      },
      recentEvents: [...wed.recentEvents.slice(-9), `${event.flavor}:${event.eventId}`],
      lastEvent: {
        eventId: event.eventId,
        flavor: event.flavor,
        intensity: event.intensity
      },
      lastSkipReason: undefined
    };
  }
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}
