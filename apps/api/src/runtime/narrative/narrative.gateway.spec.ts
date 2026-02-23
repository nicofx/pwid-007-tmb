import { NarrativeGateway } from './narrative.gateway';
import { PlaceholderNarrativeService } from './placeholder-narrative.service';
import type { NarrativeContext } from './narrative.types';
import type { TurnPacket } from '@tmb/contracts';

function packet(): TurnPacket {
  return {
    schemaVersion: '1.0.0',
    sessionId: 'session-1',
    turnId: 'turn-1',
    turnNumber: 1,
    capsuleId: 'berlin-1933',
    scene: {
      sceneId: 'scene',
      beatId: 'beat',
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
    narrativeBlocks: [{ kind: 'EVENT', text: 'base' }],
    stateText: {
      suspicion: 1,
      tension: 1,
      clock: 1,
      risk: 1
    },
    affordances: {
      activeLocations: ['loc-1'],
      activeHotspots: ['hs-1'],
      allowedVerbs: ['OBSERVE'],
      suggestedActions: []
    }
  };
}

const context: NarrativeContext = {
  sessionId: 'session-1',
  turnId: 'turn-1',
  capsuleId: 'berlin-1933',
  truths: [],
  toneTags: [],
  eraLabel: 'Berlin 1933',
  allowedLocationIds: ['loc-1'],
  allowedHotspotIds: ['hs-1'],
  allowedNpcIds: [],
  allowedItemTags: [],
  allowedLabels: [],
  actionSummary: 'OBSERVE',
  outcomeSummary: 'SUCCESS',
  deltaSummary: [],
  memoryBullets: []
};

describe('NarrativeGateway', () => {
  const originalMode = process.env.NARRATIVE_MODE;

  afterEach(() => {
    process.env.NARRATIVE_MODE = originalMode;
  });

  it('uses placeholder mode directly', async () => {
    process.env.NARRATIVE_MODE = 'placeholder';
    const placeholder = new PlaceholderNarrativeService();
    const llm = {
      render: jest.fn().mockResolvedValue({
        blocks: [{ kind: 'NARRATION', text: 'llm' }],
        provider: 'llm',
        fallbackUsed: false,
        cacheHit: false
      })
    };
    const gateway = new NarrativeGateway(placeholder, llm as never);
    const result = await gateway.renderTurnNarrative({
      sessionId: 'session-1',
      turnId: 'turn-1',
      packetBase: packet(),
      ctx: context
    });

    expect(result.meta.provider).toBe('placeholder');
    expect(llm.render).not.toHaveBeenCalled();
  });

  it('falls back when llm provider fails', async () => {
    process.env.NARRATIVE_MODE = 'llm';
    const placeholder = new PlaceholderNarrativeService();
    const llm = {
      render: jest.fn().mockRejectedValue(new Error('boom'))
    };
    const gateway = new NarrativeGateway(placeholder, llm as never);
    const result = await gateway.renderTurnNarrative({
      sessionId: 'session-1',
      turnId: 'turn-1',
      packetBase: packet(),
      ctx: context
    });

    expect(result.meta.fallbackUsed).toBe(true);
    expect(result.meta.provider).toBe('placeholder');
    expect(result.blocks.length).toBeGreaterThan(0);
  });
});
