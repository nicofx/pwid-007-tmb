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
      reason: hotspot ? `Try ${verb} on ${hotspot.label}` : `Try ${verb} in current beat`
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
      reason: `Interact with ${hotspot.label}`
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
        blockedReason: `Verb ${action.verb} is not allowed in this beat`,
        alternatives
      };
    }

    if (
      action.targetId &&
      !beat.activeHotspots.includes(action.targetId) &&
      action.targetId !== 'current'
    ) {
      return {
        allowed: false,
        blockedReason: `Target ${action.targetId} is not active`,
        alternatives
      };
    }

    return { allowed: true, alternatives };
  }
}
