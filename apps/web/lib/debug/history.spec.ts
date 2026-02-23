import { pushTurnHistory, traceToHistoryTurns } from './history';

describe('debug history helpers', () => {
  it('keeps only latest entries and dedupes turnId', () => {
    const h1 = pushTurnHistory(
      [],
      {
        request: { sessionId: 's', turnId: 't1', source: 'dock_submit' },
        packet: { turnId: 't1' } as never,
        sentAt: '2026-01-01T00:00:00.000Z',
        receivedAt: '2026-01-01T00:00:00.100Z',
        latencyMs: 100
      },
      2
    );
    const h2 = pushTurnHistory(
      h1,
      {
        request: { sessionId: 's', turnId: 't2', source: 'dock_submit' },
        packet: { turnId: 't2' } as never,
        sentAt: '2026-01-01T00:00:01.000Z',
        receivedAt: '2026-01-01T00:00:01.100Z',
        latencyMs: 100
      },
      2
    );
    const h3 = pushTurnHistory(
      h2,
      {
        request: { sessionId: 's', turnId: 't1', source: 'dock_submit' },
        packet: { turnId: 't1' } as never,
        sentAt: '2026-01-01T00:00:02.000Z',
        receivedAt: '2026-01-01T00:00:02.100Z',
        latencyMs: 100
      },
      2
    );
    expect(h3).toHaveLength(2);
    expect(h3[1]?.request.turnId).toBe('t1');
  });

  it('converts api trace to local history', () => {
    const history = traceToHistoryTurns([
      {
        seq: 1,
        turnId: 't1',
        request: { sessionId: 's', turnId: 't1' },
        outcome: {},
        deltas: {},
        packet: { turnId: 't1' } as never,
        createdAt: '2026-01-01T00:00:00.000Z'
      }
    ]);

    expect(history[0]?.request.source).toBe('resume_trace');
    expect(history[0]?.seq).toBe(1);
  });
});
