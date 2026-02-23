import type { ActionModel, ActionVerb, CapsuleSchema, TurnRequest } from '@tmb/contracts';
import type { SessionState } from '../domain/types.js';

const KEYWORDS: Array<{ regex: RegExp; verb: ActionVerb }> = [
  { regex: /\b(talk|speak|ask|convince|question)\b/i, verb: 'TALK' },
  { regex: /\b(search|look|scan|inspect|check)\b/i, verb: 'SEARCH' },
  { regex: /\b(observe|watch|notice|listen)\b/i, verb: 'OBSERVE' },
  { regex: /\b(move|go|walk|run|enter|leave)\b/i, verb: 'MOVE' },
  { regex: /\b(wait|hide|delay|pause)\b/i, verb: 'WAIT' }
];

function findTargetId(playerText: string | undefined, capsule: CapsuleSchema): string | undefined {
  if (!playerText) {
    return undefined;
  }
  const text = playerText.toLowerCase();
  return capsule.hotspots.find((hotspot) => text.includes(hotspot.id.toLowerCase()))?.id;
}

function findModifiers(playerText: string | undefined): string[] {
  if (!playerText) {
    return [];
  }
  const modifiers: string[] = [];
  if (/\b(silent|quiet|stealth)\b/i.test(playerText)) {
    modifiers.push('STEALTH');
  }
  if (/\b(fast|quick|rush)\b/i.test(playerText)) {
    modifiers.push('FAST');
  }
  if (/\b(careful|safe|slow)\b/i.test(playerText)) {
    modifiers.push('CAREFUL');
  }
  return modifiers;
}

export class ActionResolver {
  resolveAction(request: TurnRequest, state: SessionState, capsule: CapsuleSchema): ActionModel {
    const playerText = request.playerText?.trim();

    if (request.action?.verb) {
      return {
        verb: request.action.verb,
        targetId: request.action.targetId ?? findTargetId(playerText, capsule),
        modifiers: request.action.modifiers ?? [],
        source: 'explicit',
        rawText: playerText
      };
    }

    if (playerText) {
      const keyword = KEYWORDS.find((candidate) => candidate.regex.test(playerText));
      if (keyword) {
        return {
          verb: keyword.verb,
          targetId: findTargetId(playerText, capsule) ?? state.locationId,
          modifiers: findModifiers(playerText),
          source: 'heuristic',
          rawText: playerText
        };
      }
    }

    return {
      verb: 'OBSERVE',
      targetId: state.locationId,
      modifiers: [],
      source: 'fallback',
      rawText: playerText
    };
  }
}
