import { validateWorldEventCatalog } from '@tmb/contracts';

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
});
