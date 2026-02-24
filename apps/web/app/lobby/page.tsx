'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ApiClientError,
  getProfile,
  getProfileSessions,
  startSession,
  updateProfile,
  type ProfileSessionSummary
} from '@/lib/apiClient';
import { trackClientEvent } from '@/lib/telemetryClient';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Panel, PanelBody, PanelHeader } from '@/components/ui/Panel';
import { tSessionStatus } from '@/lib/i18n-game';

const PLAY_STORAGE_KEY = 'tmb.play.session';
const PLAY_PACKET_CACHE_KEY = 'tmb.play.packet.cache';

export default function LobbyPage(): React.ReactElement {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ id: string; deviceId: string; displayName: string } | null>(
    null
  );
  const [displayName, setDisplayName] = useState('');
  const [sessions, setSessions] = useState<ProfileSessionSummary[]>([]);

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, sessionsRes] = await Promise.all([getProfile(), getProfileSessions(10)]);
      setProfile(profileRes);
      setDisplayName(profileRes.displayName);
      setSessions(sessionsRes.sessions);
    } catch (cause) {
      const message =
        cause instanceof ApiClientError ? `${cause.code}: ${cause.message}` : 'No se pudo cargar el perfil';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    trackClientEvent({
      eventName: 'ui_lobby_view',
      ts: new Date().toISOString()
    });
    void load();
  }, []);

  const lastSession = useMemo(() => sessions[0] ?? null, [sessions]);

  async function onSaveName(): Promise<void> {
    if (!displayName.trim()) {
      return;
    }
    setSavingName(true);
    setError(null);
    try {
      const updated = await updateProfile({ displayName: displayName.trim() });
      setProfile(updated);
      setDisplayName(updated.displayName);
    } catch (cause) {
      const message =
        cause instanceof ApiClientError
          ? `${cause.code}: ${cause.message}`
          : 'No se pudo guardar el nombre';
      setError(message);
    } finally {
      setSavingName(false);
    }
  }

  function continueSession(session: ProfileSessionSummary): void {
    trackClientEvent({
      eventName: 'ui_lobby_continue',
      ts: new Date().toISOString(),
      sessionId: session.sessionId
    });
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

  async function startNewRun(): Promise<void> {
    setStarting(true);
    setError(null);
    try {
      trackClientEvent({
        eventName: 'ui_lobby_start_new',
        ts: new Date().toISOString(),
        payload: { capsuleId: 'berlin-1933', presetId: 'guided' }
      });
      const response = await startSession({ capsuleId: 'berlin-1933', presetId: 'guided' });
      localStorage.setItem(
        PLAY_STORAGE_KEY,
        JSON.stringify({
          sessionId: response.sessionId,
          capsuleId: response.packet.capsuleId,
          presetId: 'guided',
          seed: response.seed
        })
      );
      localStorage.setItem(PLAY_PACKET_CACHE_KEY, JSON.stringify(response.packet));
      router.push('/play');
    } catch (cause) {
      const message =
        cause instanceof ApiClientError
          ? `${cause.code}: ${cause.message}`
          : 'No se pudo iniciar una nueva partida';
      setError(message);
    } finally {
      setStarting(false);
    }
  }

  return (
    <main className="play-shell disconnected-shell">
      <Panel className="start-card">
        <PanelHeader>
          <h1>Perfil</h1>
          <Badge tone="info">Identidad local</Badge>
        </PanelHeader>
        <PanelBody>
          <p className="muted">Perfil local por dispositivo (sin login).</p>

          {loading ? <p className="muted">Cargando perfil...</p> : null}

          {profile ? (
            <>
              <p className="muted">ID de dispositivo: {profile.deviceId}</p>
              <label htmlFor="displayName">Nombre</label>
              <div className="scene-meta-row">
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  disabled={savingName}
                  placeholder="Nombre de perfil"
                />
                <Button variant="secondary" onClick={() => void onSaveName()} disabled={savingName}>
                  {savingName ? 'Guardando...' : 'Guardar nombre'}
                </Button>
              </div>
            </>
          ) : null}

          <div className="scene-meta-row">
            <Button
              variant="primary"
              onClick={() => {
                if (!lastSession) {
                  return;
                }
                continueSession(lastSession);
              }}
              disabled={!lastSession}
            >
              Continuar última partida
            </Button>
            <Button variant="secondary" onClick={() => void startNewRun()} disabled={starting}>
              {starting ? 'Iniciando...' : 'Nueva partida'}
            </Button>
          </div>

          <h2>Partidas recientes</h2>
          {sessions.length === 0 ? (
            <p className="muted">
              Todavía no hay partidas. <Link href="/play">Iniciá una en Jugar</Link>.
            </p>
          ) : null}
          <div className="scenario-list">
            {sessions.map((session) => (
              <button
                key={session.sessionId}
                type="button"
                className="scenario-btn"
                onClick={() => {
                  trackClientEvent({
                    eventName: 'ui_lobby_open_run',
                    ts: new Date().toISOString(),
                    sessionId: session.sessionId
                  });
                  continueSession(session);
                }}
              >
                <strong>{session.capsuleId}</strong>
                <span>
                  preset={session.presetId ?? 'default'} | turno={session.lastTurnSeq} | estado=
                  {tSessionStatus(session.status)}
                </span>
                <span>{new Date(session.updatedAt).toLocaleString()}</span>
              </button>
            ))}
          </div>

          <div className="scene-meta-row">
            <Button variant="ghost" onClick={() => router.push('/play')}>
              Ir a Jugar
            </Button>
            <Button variant="ghost" onClick={() => router.push('/history')}>
              Ir a Historial
            </Button>
            <Button variant="ghost" onClick={() => void load()}>
              Refrescar
            </Button>
          </div>

          {error ? <p className="error-text">{error}</p> : null}
        </PanelBody>
      </Panel>
    </main>
  );
}
