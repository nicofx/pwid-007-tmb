import type { TurnPacket } from '@tmb/contracts';
import { buildTurnDiff } from './diff-builder';
import { buildExplainBullets } from './explain-builder';

const packet: TurnPacket = {
  schemaVersion: '1.0.0',
  sessionId: 's1',
  turnId: 't1',
  turnNumber: 1,
  capsuleId: 'berlin-1933',
  scene: { sceneId: 'scene-a', beatId: 'beat-a', sceneTitle: 'Scene', beatTitle: 'Beat' },
  visual: { palette: 'p', mood: 'm', backdrop: 'b' },
  action: { verb: 'OBSERVE', modifiers: [], source: 'explicit' },
  outcome: 'BLOCKED',
  narrativeBlocks: [],
  stateText: { suspicion: 10, tension: 10, clock: 1, risk: 8 },
  affordances: {
    activeLocations: ['loc-a'],
    activeHotspots: ['hs-a'],
    allowedVerbs: ['OBSERVE'],
    suggestedActions: [{ verb: 'OBSERVE', targetId: 'hs-a', reason: 'Try hotspot' }]
  },
  worldEvent: { fired: false, skipReason: 'BUDGET' }
};

describe('buildExplainBullets', () => {
  it('explains blocked turns with suggestion and wed skip reason', () => {
    const diff = buildTurnDiff(null, packet);
    const bullets = buildExplainBullets({ packet, diff });
    expect(bullets.some((line) => line.includes('blocked'))).toBe(true);
    expect(bullets.some((line) => line.includes('WED skipped'))).toBe(true);
  });
});
