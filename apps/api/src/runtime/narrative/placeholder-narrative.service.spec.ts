import type { TurnPacket } from '@tmb/contracts';
import { PlaceholderNarrativeService } from './placeholder-narrative.service';

function basePacket(outcome: TurnPacket['outcome']): TurnPacket {
  return {
    schemaVersion: '1.0.0',
    sessionId: 's1',
    turnId: 't1',
    turnNumber: 1,
    capsuleId: 'berlin-1933',
    scene: {
      sceneId: 'scene-a',
      beatId: 'beat-a',
      sceneTitle: 'Scene',
      beatTitle: 'Beat'
    },
    visual: {
      palette: 'p',
      mood: 'm',
      backdrop: 'b'
    },
    action: {
      verb: 'OBSERVE',
      modifiers: [],
      source: 'explicit'
    },
    outcome,
    narrativeBlocks: [],
    stateText: {
      suspicion: 1,
      tension: 1,
      clock: 1,
      risk: 1
    },
    affordances: {
      activeLocations: ['loc-a'],
      activeHotspots: ['hs-a'],
      allowedVerbs: ['OBSERVE'],
      suggestedActions: [{ verb: 'OBSERVE', targetId: 'hs-a', reason: 'Focus' }]
    }
  };
}

describe('PlaceholderNarrativeService', () => {
  const service = new PlaceholderNarrativeService();

  it.each(['SUCCESS', 'PARTIAL', 'FAIL_FORWARD', 'BLOCKED'] as const)(
    'always returns at least one block for %s',
    (outcome) => {
      const blocks = service.render(basePacket(outcome));
      expect(blocks.length).toBeGreaterThan(0);
      expect(blocks.length).toBeLessThanOrEqual(3);
    }
  );
});
