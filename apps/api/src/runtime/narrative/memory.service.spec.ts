import { MemoryService } from './memory.service';
import type { TurnPacket } from '@tmb/contracts';

function packet(partial?: Partial<TurnPacket>): TurnPacket {
  return {
    schemaVersion: '1.0.0',
    sessionId: 'session-1',
    turnId: 'turn-1',
    turnNumber: 1,
    capsuleId: 'berlin-1933',
    scene: {
      sceneId: 's1',
      beatId: 'b1',
      sceneTitle: 'Scene',
      beatTitle: 'Beat'
    },
    visual: {
      palette: 'gray',
      mood: 'tense',
      backdrop: 'street'
    },
    action: {
      verb: 'OBSERVE',
      modifiers: [],
      source: 'explicit'
    },
    outcome: 'SUCCESS',
    narrativeBlocks: [{ kind: 'EVENT', text: 'ok' }],
    stateText: {
      suspicion: 1,
      tension: 2,
      clock: 3,
      risk: 1
    },
    affordances: {
      activeLocations: ['street'],
      activeHotspots: ['checkpoint'],
      allowedVerbs: ['OBSERVE', 'SEARCH'],
      suggestedActions: []
    },
    ...partial
  };
}

describe('MemoryService', () => {
  const service = new MemoryService();

  it('compacts and deduplicates memory bullets to max 10', () => {
    let memory = { bullets: [] as string[] };

    for (let index = 0; index < 14; index += 1) {
      memory = service.update({
        memory,
        packet: packet({
          turnId: `turn-${index}`,
          deltas: {
            cluesAdded: [`clue-${index}`]
          }
        })
      });
    }

    expect(memory.bullets.length).toBeLessThanOrEqual(10);
    expect(new Set(memory.bullets).size).toBe(memory.bullets.length);
  });

  it('loads invalid json as empty memory', () => {
    expect(service.fromJson({ notBullets: true })).toEqual({ bullets: [] });
  });
});
