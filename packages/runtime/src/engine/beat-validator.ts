import type { ActionModel, ActionVerb, CapsuleBeat, CapsuleSchema } from '@tmb/contracts';
import type { ValidationResult } from '../domain/types.js';

function buildAlternatives(
  beat: CapsuleBeat,
  capsule: CapsuleSchema,
  maxSuggestions = 4
): ValidationResult['alternatives'] {
  const hotspotChoices = beat.activeHotspots
    .map((id) => capsule.hotspots.find((hotspot) => hotspot.id === id))
    .filter((hotspot): hotspot is NonNullable<typeof hotspot> => Boolean(hotspot));

  const alternatives: ValidationResult['alternatives'] = [];
  for (const verb of beat.allowedVerbs.slice(0, Math.max(2, maxSuggestions))) {
    const hotspot = hotspotChoices.find((candidate) => candidate.verbs.includes(verb));
    alternatives.push({
      verb,
      targetId: hotspot?.id,
      reason: hotspot
        ? `${verb} -> ${hotspot.label} is available now`
        : `${verb} is available in this beat`
    });
  }

  if (alternatives.length < 2 && hotspotChoices.length > 0) {
    const hotspot = hotspotChoices[0];
    if (!hotspot) {
      return alternatives.slice(0, 4);
    }
    const fallbackVerb: ActionVerb = hotspot.verbs[0] ?? beat.allowedVerbs[0] ?? 'OBSERVE';
    alternatives.push({
      verb: fallbackVerb,
      targetId: hotspot.id,
      reason: `Use ${hotspot.label} to keep momentum`
    });
  }

  return alternatives.slice(0, Math.max(1, maxSuggestions));
}

export class BeatValidator {
  validateActionAgainstBeat(
    action: ActionModel,
    beat: CapsuleBeat,
    capsule: CapsuleSchema,
    options?: { maxSuggestions?: number }
  ): ValidationResult {
    const alternatives = buildAlternatives(beat, capsule, options?.maxSuggestions);

    if (!beat.allowedVerbs.includes(action.verb)) {
      return {
        allowed: false,
        blockedReason: `Verb ${action.verb} is not available in beat ${beat.id}. Use one of: ${beat.allowedVerbs.join(', ')}`,
        alternatives
      };
    }

    if (
      action.targetId &&
      !beat.activeHotspots.includes(action.targetId) &&
      action.targetId !== 'current'
    ) {
      const activeLabels = beat.activeHotspots
        .map((id) => capsule.hotspots.find((hotspot) => hotspot.id === id)?.label)
        .filter((label): label is string => Boolean(label))
        .slice(0, 4);
      return {
        allowed: false,
        blockedReason:
          activeLabels.length > 0
            ? `Target ${action.targetId} is not active in beat ${beat.id}. Active hotspots: ${activeLabels.join(', ')}`
            : `Target ${action.targetId} is not active in beat ${beat.id}`,
        alternatives
      };
    }

    return { allowed: true, alternatives };
  }
}
