import type { TurnPacket } from '@tmb/contracts';
import { buildGuidanceSuggestion } from './GuidancePanel';

const packet: TurnPacket = {
  schemaVersion: '1.0.0',
  sessionId: 's1',
  turnId: 't1',
  turnNumber: 0,
  capsuleId: 'berlin-1933',
  scene: {
    sceneId: 'scene-a',
    beatId: 'beat-a',
    sceneTitle: 'Scene A',
    beatTitle: 'Beat A'
  },
  visual: { palette: 'cold', mood: 'tense', backdrop: 'tram-station' },
  action: { verb: 'OBSERVE', modifiers: [], source: 'fallback' },
  outcome: 'SUCCESS',
  narrativeBlocks: [{ kind: 'NARRATION', text: 'start' }],
  stateText: { suspicion: 0, tension: 0, clock: 0, risk: 0 },
  affordances: {
    activeLocations: ['service-door'],
    activeHotspots: ['courier-contact'],
    allowedVerbs: ['OBSERVE', 'TALK', 'MOVE'],
    suggestedActions: [{ verb: 'TALK', targetId: 'courier-contact', reason: 'Talk now' }]
  }
};

describe('buildGuidanceSuggestion', () => {
  it('prefers valid scenario step when executable', () => {
    const suggestion = buildGuidanceSuggestion({
      scenario: {
        id: 'core-a',
        label: 'Core A',
        description: 'x',
        recommendedPresetId: 'guided',
        steps: [
          {
            verb: 'OBSERVE',
            targetId: 'courier-contact',
            playerText: 'Observe courier',
            note: 'step note'
          }
        ]
      },
      packet,
      turnNumber: 0
    });

    expect(suggestion?.verb).toBe('OBSERVE');
    expect(suggestion?.targetId).toBe('courier-contact');
  });

  it('falls back to suggested action when scenario step is invalid', () => {
    const suggestion = buildGuidanceSuggestion({
      scenario: {
        id: 'core-a',
        label: 'Core A',
        description: 'x',
        recommendedPresetId: 'guided',
        steps: [
          {
            verb: 'SEARCH',
            targetId: 'not-active',
            playerText: 'Search invalid',
            note: 'invalid step'
          }
        ]
      },
      packet,
      turnNumber: 0
    });

    expect(suggestion?.verb).toBe('TALK');
    expect(suggestion?.targetId).toBe('courier-contact');
  });
});
