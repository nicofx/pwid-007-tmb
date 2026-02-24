import type { DebugTraceTurn } from '../apiClient';
import type { DebugTurnEntry, DebugTurnRequest } from './types';

export function pushTurnHistory(
  history: DebugTurnEntry[],
  entry: DebugTurnEntry,
  limit = 20
): DebugTurnEntry[] {
  const deduped = history.filter((item) => item.request.turnId !== entry.request.turnId);
  return [...deduped, entry].slice(-limit);
}

export function traceToHistoryTurns(traceTurns: DebugTraceTurn[]): DebugTurnEntry[] {
  return traceTurns.map((turn) => {
    const request = (turn.request ?? {}) as Partial<DebugTurnRequest>;
    const outcome = (turn.outcome ?? {}) as {
      narrativeProvider?: 'llm' | 'placeholder' | 'unknown';
    };
    return {
      seq: turn.seq,
      request: {
        sessionId: request.sessionId ?? '',
        turnId: request.turnId ?? turn.turnId,
        playerText: request.playerText,
        action: request.action,
        source: 'resume_trace'
      },
      packet: turn.packet,
      narrativeProvider: outcome.narrativeProvider ?? 'unknown',
      sentAt: turn.createdAt,
      receivedAt: turn.createdAt,
      latencyMs: 0
    };
  });
}
