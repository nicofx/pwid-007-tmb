import type { TurnPacket } from '@tmb/contracts';
import { buildTurnDiff } from './diff-builder';

function packet(overrides?: Partial<TurnPacket>): TurnPacket {
  return {
    schemaVersion: '1.0.0',
    sessionId: 's1',
    turnId: 't1',
    turnNumber: 1,
    capsuleId: 'berlin-1933',
    scene: { sceneId: 'scene-a', beatId: 'beat-a', sceneTitle: 'Scene', beatTitle: 'Beat' },
    visual: { palette: 'p', mood: 'm', backdrop: 'b' },
    action: { verb: 'OBSERVE', modifiers: [], source: 'explicit' },
    outcome: 'SUCCESS',
    narrativeBlocks: [],
    stateText: { suspicion: 10, tension: 12, clock: 1, risk: 9 },
    affordances: {
      activeLocations: ['loc-a'],
      activeHotspots: ['hs-a'],
      allowedVerbs: ['OBSERVE'],
      suggestedActions: []
    },
    ...overrides
  };
}

describe('buildTurnDiff', () => {
  it('builds state and affordance differences', () => {
    const prev = packet({
      stateText: { suspicion: 8, tension: 12, clock: 0, risk: 9 },
      affordances: {
        activeLocations: ['loc-a'],
        activeHotspots: ['hs-a'],
        allowedVerbs: ['OBSERVE'],
        suggestedActions: []
      }
    });
    const current = packet({
      deltas: { cluesAdded: ['c1'], leverageAdded: ['l1'] },
      affordances: {
        activeLocations: ['loc-a', 'loc-b'],
        activeHotspots: ['hs-b'],
        allowedVerbs: ['OBSERVE'],
        suggestedActions: []
      }
    });

    const diff = buildTurnDiff(prev, current);
    expect(diff.state.find((item) => item.key === 'suspicion')?.delta).toBe(2);
    expect(diff.cluesAdded).toEqual(['c1']);
    expect(diff.hotspotsAdded).toEqual(['hs-b']);
    expect(diff.hotspotsRemoved).toEqual(['hs-a']);
  });
});
