'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ApiClientError,
  deleteSession,
  exportProfile,
  getProfileSessions,
  wipeProfile,
  type ProfileSessionSummary
} from '@/lib/apiClient';
import { trackClientEvent } from '@/lib/telemetryClient';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Panel, PanelBody, PanelHeader } from '@/components/ui/Panel';
import { tSessionStatus } from '@/lib/i18n-game';

const PLAY_STORAGE_KEY = 'tmb.play.session';
const PLAY_PACKET_CACHE_KEY = 'tmb.play.packet.cache';

function downloadJson(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function HistoryPage(): React.ReactElement {
  const router = useRouter();
  const [sessions, setSessions] = useState<ProfileSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busySessionId, setBusySessionId] = useState<string | null>(null);
  const [wiping, setWiping] = useState(false);

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const response = await getProfileSessions(20);
      setSessions(response.sessions);
    } catch (cause) {
      const message =
        cause instanceof ApiClientError ? `${cause.code}: ${cause.message}` : 'No se pudo cargar el historial';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    trackClientEvent({ eventName: 'ui_history_view', ts: new Date().toISOString() });
    void load();
  }, []);

  const lastSession = useMemo(() => sessions[0] ?? null, [sessions]);

  function openRun(session: ProfileSessionSummary): void {
    trackClientEvent({
      eventName: 'ui_history_open_run',
      ts: new Date().toISOString(),
      sessionId: session.sessionId
    });
    router.push(`/history/${session.sessionId}`);
  }

  function resumeRun(session: ProfileSessionSummary): void {
    localStorage.setItem(
      PLAY_STORAGE_KEY,
      JSON.stringify({
        sessionId: session.sessionId,
        capsuleId: session.capsuleId,
        presetId: session.presetId,
        seed: session.seed
      })
    );
    localStorage.removeItem(PLAY_PACKET_CACHE_KEY);
    router.push('/play');
  }

  async function onDeleteRun(session: ProfileSessionSummary): Promise<void> {
    const confirmed = window.confirm(
      `Vas a borrar la partida ${session.sessionId}.\n\nEsto elimina turnos, snapshots y telemetría de esa sesión.`
    );
    if (!confirmed) {
      return;
    }

    trackClientEvent({
      eventName: 'ui_history_delete_click',
      ts: new Date().toISOString(),
      sessionId: session.sessionId
    });
    trackClientEvent({
      eventName: 'ui_delete_confirmed',
      ts: new Date().toISOString(),
      sessionId: session.sessionId
    });

    setBusySessionId(session.sessionId);
    setError(null);
    try {
      await deleteSession(session.sessionId);
      await load();
    } catch (cause) {
      const message =
        cause instanceof ApiClientError ? `${cause.code}: ${cause.message}` : 'No se pudo borrar la partida';
      setError(message);
    } finally {
      setBusySessionId(null);
    }
  }

  async function onExportProfile(): Promise<void> {
    trackClientEvent({ eventName: 'ui_export_clicked', ts: new Date().toISOString() });
    try {
      const payload = await exportProfile({ includeTelemetry: false, turnLimitPerSession: 200 });
      const date = new Date().toISOString().replaceAll(':', '-');
      downloadJson(`tmb_export_${date}.json`, payload);
      trackClientEvent({ eventName: 'ui_export_success', ts: new Date().toISOString() });
    } catch (cause) {
      trackClientEvent({ eventName: 'ui_export_fail', ts: new Date().toISOString() });
      const message =
        cause instanceof ApiClientError ? `${cause.code}: ${cause.message}` : 'No se pudo exportar';
      setError(message);
    }
  }

  async function onWipeAll(): Promise<void> {
    const typed = window.prompt('Para confirmar wipe total, escribí DELETE');
    if (typed !== 'DELETE') {
      return;
    }

    trackClientEvent({ eventName: 'ui_wipe_confirmed', ts: new Date().toISOString() });
    setWiping(true);
    setError(null);
    try {
      await wipeProfile();
      localStorage.removeItem(PLAY_STORAGE_KEY);
      localStorage.removeItem(PLAY_PACKET_CACHE_KEY);
      await load();
      router.push('/lobby');
    } catch (cause) {
      const message =
        cause instanceof ApiClientError ? `${cause.code}: ${cause.message}` : 'No se pudo resetear el perfil';
      setError(message);
    } finally {
      setWiping(false);
    }
  }

  return (
    <main className="play-shell disconnected-shell">
      <Panel className="start-card tmb-frame tmb-texture">
        <PanelHeader>
          <h1>Historial</h1>
        </PanelHeader>
        <PanelBody>
          <p className="muted">Partidas recientes de este dispositivo.</p>

          <div className="scene-meta-row">
            <Button variant="ghost" onClick={() => router.push('/lobby')}>
              Volver a lobby
            </Button>
            <Button variant="secondary" onClick={() => void load()} disabled={loading}>
              {loading ? 'Cargando...' : 'Refrescar'}
            </Button>
            <Button variant="primary" onClick={() => void onExportProfile()}>
              Exportar JSON
            </Button>
            <Button variant="danger" onClick={() => void onWipeAll()} disabled={wiping}>
              {wiping ? 'Reseteando...' : 'Borrar todo'}
            </Button>
          </div>

          {lastSession ? (
            <div className="scene-meta-row">
              <Button variant="primary" onClick={() => resumeRun(lastSession)}>
                Continuar última partida
              </Button>
            </div>
          ) : null}

          {loading ? <LoadingState title="Cargando partidas..." message="Leyendo historial local." /> : null}

          {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}

          {sessions.length === 0 && !loading ? (
            <EmptyState
              title="No hay partidas todavía"
              message="Empezá una partida para ver el historial acá."
              ctaLabel="Ir a jugar"
              ctaHref="/play"
            />
          ) : null}

          <div className="scenario-list">
            {sessions.map((session) => (
              <article key={session.sessionId} className="scenario-btn tmb-frame">
                <strong>{session.capsuleId}</strong>
                <span>
                  preset={session.presetId ?? 'default'} | turno={session.lastTurnSeq} | estado=
                  {tSessionStatus(session.status)}
                </span>
                <span>{new Date(session.updatedAt).toLocaleString()}</span>
                <div className="scene-meta-row">
                  <Button variant="ghost" size="sm" onClick={() => openRun(session)}>
                    Abrir
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => resumeRun(session)}>
                    Reanudar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => void onDeleteRun(session)}
                    disabled={busySessionId === session.sessionId}
                  >
                    {busySessionId === session.sessionId ? 'Borrando...' : 'Eliminar'}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </PanelBody>
      </Panel>
    </main>
  );
}
