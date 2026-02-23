import { NarrativeGuardrailsService } from './narrative-guardrails.service';
import type { NarrativeContext } from './narrative.types';

const context: NarrativeContext = {
  sessionId: 'session-1',
  turnId: 'turn-1',
  capsuleId: 'berlin-1933',
  truths: ['Outcome is SUCCESS'],
  toneTags: ['grounded'],
  eraLabel: 'Berlin 1933',
  allowedLocationIds: ['loc-a'],
  allowedHotspotIds: ['hs-a'],
  allowedNpcIds: ['npc-a'],
  allowedItemTags: ['item-a'],
  allowedLabels: ['Archive Room'],
  actionSummary: 'OBSERVE hs-a',
  outcomeSummary: 'SUCCESS',
  deltaSummary: [],
  memoryBullets: []
};

describe('NarrativeGuardrailsService', () => {
  const service = new NarrativeGuardrailsService();

  it('rejects invalid structure', () => {
    const result = service.validateStructure({ blocks: [] });
    expect(result.ok).toBe(false);
  });

  it('rejects canon violations', () => {
    const canon = service.validateCanon(
      [{ kind: 'NARRATION', text: 'You move to LOC_ID:invalid-loc' }],
      context
    );
    expect(canon.ok).toBe(false);
  });

  it('sanitizes whitespace and accepts clean content', () => {
    const result = service.sanitizeBlocks([{ kind: 'SYSTEM', text: 'line   with    spaces' }]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0]?.text).toBe('line with spaces');
    }
  });
});
