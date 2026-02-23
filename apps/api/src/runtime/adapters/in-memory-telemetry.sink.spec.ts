import { InMemoryTelemetrySink } from './in-memory-telemetry.sink';

describe('InMemoryTelemetrySink', () => {
  it('stores telemetry events in memory', () => {
    const sink = new InMemoryTelemetrySink();
    sink.emitSessionEvent({
      type: 'session_started',
      sessionId: 's1',
      capsuleId: 'c1',
      roleId: 'r1',
      presetId: 'p1'
    });

    sink.emitTurnEvent({
      type: 'turn_processed',
      sessionId: 's1',
      turnId: 't1',
      turnNumber: 1,
      verb: 'OBSERVE',
      actionSource: 'fallback',
      outcome: 'SUCCESS',
      sceneId: 'scene',
      beatId: 'beat',
      presetId: 'p1',
      variabilityTags: ['risk_mid'],
      idempotencyHit: false
    });

    expect(sink.events).toHaveLength(2);
  });
});
