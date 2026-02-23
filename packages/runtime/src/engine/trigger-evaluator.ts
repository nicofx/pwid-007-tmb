import type { SelectedPreset, WorldEventCondition, WorldEventDefinition } from '@tmb/contracts';
import type { SessionState } from '../domain/types.js';

export interface TriggerContext {
  state: SessionState;
  beatId: string;
  sceneId: string;
  actionVerb: string;
  actionTargetId?: string;
  preset?: SelectedPreset;
}

export class TriggerEvaluator {
  matches(event: WorldEventDefinition, ctx: TriggerContext): boolean {
    if (
      event.allowedBeats &&
      event.allowedBeats.length > 0 &&
      !event.allowedBeats.includes(ctx.beatId)
    ) {
      return false;
    }

    if (
      event.allowedScenes &&
      event.allowedScenes.length > 0 &&
      !event.allowedScenes.includes(ctx.sceneId)
    ) {
      return false;
    }

    return event.triggers.allOf.every((condition) => this.matchCondition(condition, ctx));
  }

  private matchCondition(condition: WorldEventCondition, ctx: TriggerContext): boolean {
    if (condition.kind === 'state') {
      const current = ctx.state.stateText[condition.metric];
      return compare(current, condition.op, condition.value);
    }

    if (condition.kind === 'repetition') {
      const value =
        condition.mode === 'verb'
          ? (ctx.state.wed.repeatsByVerb[condition.key] ?? 0)
          : (ctx.state.wed.repeatsByTarget[condition.key] ?? 0);
      return compare(value, condition.op, condition.value);
    }

    if (condition.kind === 'beat') {
      if (condition.beatId && condition.beatId !== ctx.beatId) {
        return false;
      }
      if (condition.sceneId && condition.sceneId !== ctx.sceneId) {
        return false;
      }
      return true;
    }

    if (condition.requiredTag && !ctx.preset?.tags.includes(condition.requiredTag)) {
      return false;
    }
    if (condition.dial && condition.op && condition.value !== undefined) {
      const dialValue = ctx.preset?.dials[condition.dial];
      if (dialValue === undefined) {
        return false;
      }
      return compare(dialValue, condition.op, condition.value);
    }
    return true;
  }
}

function compare(left: number, op: 'gte' | 'lte' | 'eq', right: number): boolean {
  if (op === 'gte') {
    return left >= right;
  }
  if (op === 'lte') {
    return left <= right;
  }
  return left === right;
}
