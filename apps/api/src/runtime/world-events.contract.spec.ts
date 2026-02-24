import { validateWorldEventCatalog, validateWorldEventCatalogDetailed } from '@tmb/contracts';

describe('WorldEvent contracts', () => {
  it('validates catalog shape', () => {
    const result = validateWorldEventCatalog({
      events: [
        {
          eventId: 'evt-1',
          flavor: 'help',
          intensity: 'soft',
          triggers: { allOf: [] },
          effects: { addClue: ['lock-model'] },
          diegeticTextTemplate: 'A whisper slips through the queue.'
        }
      ]
    });

    expect(result.ok).toBe(true);
  });

  it('rejects invalid catalog', () => {
    const result = validateWorldEventCatalog({
      events: [{ eventId: '', flavor: 'bad', intensity: 'soft', triggers: {}, effects: {} }]
    });

    expect(result.ok).toBe(false);
  });

  it('returns issue paths with detailed validator', () => {
    const result = validateWorldEventCatalogDetailed({
      events: [{ eventId: '', flavor: 'bad', intensity: 'soft', triggers: {}, effects: {} }]
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0]?.path).toBeDefined();
    }
  });
});
