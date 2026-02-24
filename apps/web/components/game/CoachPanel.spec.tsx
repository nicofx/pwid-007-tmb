import type { TurnPacket } from '@tmb/contracts';
import { buildCoachSuggestions } from './CoachPanel';

const packet: TurnPacket = {
  schemaVersion: '1.0.0',
  sessionId: 's',
  turnId: 't',
  turnNumber: 1,
  capsuleId: 'c',
  scene: { sceneId: 'scene-a', beatId: 'beat-a', sceneTitle: 'S', beatTitle: 'B' },
  visual: { palette: 'p', mood: 'm', backdrop: 'b' },
  action: { verb: 'OBSERVE', modifiers: [], source: 'fallback' },
  outcome: 'SUCCESS',
  narrativeBlocks: [{ kind: 'NARRATION', text: 'x' }],
  stateText: { suspicion: 0, tension: 0, clock: 0, risk: 0 },
  affordances: {
    activeLocations: ['loc-a'],
    activeHotspots: ['hs-a'],
    allowedVerbs: ['OBSERVE', 'MOVE'],
    suggestedActions: [{ verb: 'OBSERVE', targetId: 'hs-a', reason: 'Mirá hs-a' }]
  }
};

describe('buildCoachSuggestions', () => {
  it('returns suggestions from affordances only', () => {
    const suggestions = buildCoachSuggestions(packet);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.every((item) => packet.affordances?.allowedVerbs.includes(item.verb))).toBe(
      true
    );
    expect(
      suggestions.every(
        (item) =>
          !item.targetId ||
          packet.affordances?.activeHotspots.includes(item.targetId) ||
          packet.affordances?.activeLocations.includes(item.targetId)
      )
    ).toBe(true);
  });
});
