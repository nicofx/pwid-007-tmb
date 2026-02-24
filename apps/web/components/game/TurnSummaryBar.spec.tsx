import type { TurnPacket } from '@tmb/contracts';
import { buildTurnSummary } from './TurnSummaryBar';

function basePacket(outcome: TurnPacket['outcome']): TurnPacket {
  return {
    schemaVersion: '1.0.0',
    sessionId: 's',
    turnId: 't',
    turnNumber: 2,
    capsuleId: 'c',
    scene: { sceneId: 'scene-a', beatId: 'beat-a', sceneTitle: 'S', beatTitle: 'B' },
    visual: { palette: 'p', mood: 'm', backdrop: 'b' },
    action: { verb: 'SEARCH', targetId: 'hs-a', modifiers: [], source: 'heuristic' },
    outcome,
    narrativeBlocks: [{ kind: 'SYSTEM', text: 'No podés hacer eso ahora.' }],
    stateText: { suspicion: 1, tension: 1, clock: 1, risk: 1 },
    deltas: { state: { suspicion: 1 }, cluesAdded: ['clue-a'] },
    affordances: {
      activeLocations: ['loc-a'],
      activeHotspots: ['hs-a'],
      allowedVerbs: ['SEARCH'],
      suggestedActions: [{ verb: 'SEARCH', targetId: 'hs-a', reason: 'probá esto' }]
    }
  };
}

describe('buildTurnSummary', () => {
  it('summarizes blocked turns briefly', () => {
    const summary = buildTurnSummary(basePacket('BLOCKED'));
    expect(summary.title).toBe('Bloqueado');
    expect(summary.details.length).toBeGreaterThan(0);
  });

  it('summarizes success turns with deltas', () => {
    const summary = buildTurnSummary(basePacket('SUCCESS'));
    expect(summary.title).toBe('Éxito');
    expect(summary.details.some((line) => line.includes('Sospecha'))).toBe(true);
  });
});
