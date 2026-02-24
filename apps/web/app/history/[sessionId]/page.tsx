'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ApiClientError, getSessionTurns, type SessionTurnTimelineItem } from '@/lib/apiClient';
import { trackClientEvent } from '@/lib/telemetryClient';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { OutcomeBadge } from '@/components/ui/OutcomeBadge';
import { Panel, PanelBody, PanelHeader } from '@/components/ui/Panel';
import type { OutcomeType } from '@tmb/contracts';
import { tOutcomeFromUnknown, tSessionStatus, tVerb } from '@/lib/i18n-game';

function isOutcomeType(value: string): value is OutcomeType {
  return value === 'SUCCESS' || value === 'PARTIAL' || value === 'FAIL_FORWARD' || value === 'BLOCKED';
}

function formatAction(action: unknown): string {
  if (!action || typeof action !== 'object') {
    return '—';
  }
  const value = action as { verb?: string; targetId?: string };
  if (!value.verb) {
    return '—';
  }
  const verbLabel =
    value.verb === 'TALK' ||
    value.verb === 'SEARCH' ||
    value.verb === 'OBSERVE' ||
    value.verb === 'MOVE' ||
    value.verb === 'WAIT'
      ? tVerb(value.verb)
      : value.verb;
  return value.targetId ? `${verbLabel} → ${value.targetId}` : verbLabel;
}

function formatOutcome(outcome: unknown): string {
  if (!outcome) return '—';
  if (typeof outcome === 'string') return tOutcomeFromUnknown(outcome);
  if (typeof outcome === 'object') {
    const value = outcome as { kind?: string };
    return value.kind ? tOutcomeFromUnknown(value.kind) : JSON.stringify(outcome);
  }
  return tOutcomeFromUnknown(String(outcome));
}

export default function HistoryRunPage(): React.ReactElement {
  const router = useRouter();
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [turns, setTurns] = useState<SessionTurnTimelineItem[]>([]);
  const [meta, setMeta] = useState<{
    capsuleId: string;
    presetId?: string;
    seed: string;
    lastTurnSeq: number;
    status: 'ACTIVE' | 'ENDED';
  } | null>(null);
  const [selectedSeq, setSelectedSeq] = useState<number | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await getSessionTurns({ sessionId, limit: 200, includePacket: true });
      setTurns(response.turns);
      setMeta(response.sessionMeta);
      if (response.turns.length > 0) {
        setSelectedSeq(response.turns[response.turns.length - 1]?.seq ?? null);
      }
    } catch (cause) {
      const message =
        cause instanceof ApiClientError
          ? `${cause.code}: ${cause.message}`
          : 'No se pudo cargar la línea de tiempo';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    trackClientEvent({ eventName: 'ui_run_view', ts: new Date().toISOString(), sessionId });
    void load();
  }, [load, sessionId]);

  const selectedTurn = useMemo(
    () => turns.find((turn) => turn.seq === selectedSeq) ?? null,
    [turns, selectedSeq]
  );

  return (
    <main className="play-shell disconnected-shell">
      <Panel className="start-card tmb-frame tmb-texture history-run-card">
        <PanelHeader>
          <h1>Partida {sessionId}</h1>
        </PanelHeader>
        <PanelBody>
          <p className="muted">Línea de tiempo persistida (sin re-simular motor).</p>

          <div className="scene-meta-row">
            <Button variant="ghost" onClick={() => router.push('/history')}>
              Volver a historial
            </Button>
            <Button variant="secondary" onClick={() => router.push('/play')}>
              Ir a /play
            </Button>
            <Button variant="secondary" onClick={() => void load()} disabled={loading}>
              {loading ? 'Cargando...' : 'Refrescar'}
            </Button>
          </div>

          {meta ? (
            <p className="muted">
              cápsula={meta.capsuleId} | preset={meta.presetId ?? 'default'} | seed={meta.seed} | último turno=
              {meta.lastTurnSeq} | estado={tSessionStatus(meta.status)}
            </p>
          ) : null}

          {loading ? <LoadingState title="Cargando turnos..." message="Armando la línea de tiempo." /> : null}

          {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}

          <div className="play-grid history-grid">
            <div className="play-side-column">
              <h2>Línea de tiempo</h2>
              <div className="scenario-list">
                {turns.map((turn) => {
                  const outcome = formatOutcome(turn.outcome);
                  const outcomeType = isOutcomeType(outcome) ? outcome : null;
                  return (
                    <button
                      key={turn.seq}
                      type="button"
                      className="scenario-btn tmb-frame"
                      aria-pressed={turn.seq === selectedSeq}
                      onClick={() => {
                        setSelectedSeq(turn.seq);
                        trackClientEvent({
                          eventName: 'ui_turn_inspect',
                          ts: new Date().toISOString(),
                          sessionId,
                          turnId: turn.turnId
                        });
                      }}
                    >
                      <strong>#{turn.seq}</strong>
                      <span>{formatAction(turn.action)}</span>
                      {outcomeType ? <OutcomeBadge outcome={outcomeType} /> : <span>{outcome}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="play-main-column">
              <h2>Inspector</h2>
              {selectedTurn ? (
                <article className="play-card tmb-frame tmb-texture">
                  <p>
                    <strong>Turno:</strong> #{selectedTurn.seq} ({selectedTurn.turnId})
                  </p>
                  <p>
                    <strong>Acción:</strong> {formatAction(selectedTurn.action)}
                  </p>
                  <p>
                    <strong>Resultado:</strong>{' '}
                    {(() => {
                      const outcome = formatOutcome(selectedTurn.outcome);
                      return isOutcomeType(outcome) ? (
                        <OutcomeBadge outcome={outcome} className="history-inline-outcome" />
                      ) : (
                        outcome
                      );
                    })()}
                  </p>
                  <p>
                    <strong>Proveedor narrativo:</strong> {selectedTurn.narrativeProvider ?? '—'}
                  </p>
                  <details>
                    <summary>Packet crudo</summary>
                    <pre>{JSON.stringify(selectedTurn.packet ?? null, null, 2)}</pre>
                  </details>
                </article>
              ) : (
                <p className="muted">Seleccioná un turno para inspeccionar.</p>
              )}
            </div>
          </div>
        </PanelBody>
      </Panel>
    </main>
  );
}
