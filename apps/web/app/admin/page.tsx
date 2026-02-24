'use client';

import { useState } from 'react';
import {
  ApiClientError,
  getAdminBalance,
  getAdminConfig,
  updateAdminConfig,
  type AdminBalanceReport,
  type AdminRuntimeConfig
} from '@/lib/apiClient';

const TOKEN_STORAGE_KEY = 'tmb.admin.token';

export default function AdminPage(): React.ReactElement {
  const [token, setToken] = useState<string>(() => {
    if (typeof window === 'undefined') {
      return '';
    }
    return localStorage.getItem(TOKEN_STORAGE_KEY) ?? '';
  });
  const [config, setConfig] = useState<AdminRuntimeConfig | null>(null);
  const [balance, setBalance] = useState<AdminBalanceReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load(): Promise<void> {
    if (!token) {
      setError('Falta ADMIN_TOKEN');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const next = await getAdminConfig(token);
      setConfig(next);
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch (cause) {
      const message =
        cause instanceof ApiClientError
          ? `${cause.code}: ${cause.message}`
          : 'No se pudo cargar la configuración';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function save(): Promise<void> {
    if (!token || !config) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const next = await updateAdminConfig(token, config);
      setConfig(next);
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch (cause) {
      const message =
        cause instanceof ApiClientError
          ? `${cause.code}: ${cause.message}`
          : 'No se pudo guardar la configuración';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function loadBalance(): Promise<void> {
    if (!token) {
      setError('Falta ADMIN_TOKEN');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const report = await getAdminBalance(token);
      setBalance(report);
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch (cause) {
      const message =
        cause instanceof ApiClientError
          ? `${cause.code}: ${cause.message}`
          : 'No se pudo cargar el reporte de balance';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="play-shell disconnected-shell">
      <section className="play-card start-card">
        <h1>Panel de Administración (Dev)</h1>
        <p>Controles del motor en tiempo real y reporte de balance sin reiniciar.</p>

        <label htmlFor="adminToken">ADMIN_TOKEN</label>
        <input
          id="adminToken"
          type="password"
          value={token}
          onChange={(event) => setToken(event.target.value)}
        />

        <div className="scene-meta-row">
          <button type="button" disabled={loading} onClick={() => void load()}>
            {loading ? 'Cargando...' : 'Cargar config'}
          </button>
          <button type="button" disabled={loading || !config} onClick={() => void save()}>
            {loading ? 'Guardando...' : 'Guardar config'}
          </button>
          <button type="button" disabled={loading} onClick={() => void loadBalance()}>
            {loading ? 'Procesando...' : 'Ver balance'}
          </button>
        </div>

        {config ? (
          <>
            <label htmlFor="mode">Modo narrativo</label>
            <select
              id="mode"
              value={config.narrativeMode}
              onChange={(event) =>
                setConfig((current) =>
                  current
                    ? {
                        ...current,
                        narrativeMode: event.target.value as AdminRuntimeConfig['narrativeMode']
                      }
                    : current
                )
              }
            >
              <option value="placeholder">plantilla</option>
              <option value="llm">llm</option>
              <option value="hybrid">híbrido</option>
            </select>

            <label htmlFor="adapter">Adaptador LLM</label>
            <select
              id="adapter"
              value={config.llmAdapter}
              onChange={(event) =>
                setConfig((current) =>
                  current
                    ? {
                        ...current,
                        llmAdapter: event.target.value as AdminRuntimeConfig['llmAdapter']
                      }
                    : current
                )
              }
            >
              <option value="mock">simulado</option>
              <option value="http">http</option>
            </select>

            <label htmlFor="model">Modelo LLM</label>
            <input
              id="model"
              value={config.llmModel}
              onChange={(event) =>
                setConfig((current) =>
                  current ? { ...current, llmModel: event.target.value } : current
                )
              }
            />

            <label htmlFor="timeout">Timeout narrativo (ms)</label>
            <input
              id="timeout"
              type="number"
              min={200}
              max={20000}
              value={config.narrativeTimeoutMs}
              onChange={(event) =>
                setConfig((current) =>
                  current
                    ? {
                        ...current,
                        narrativeTimeoutMs: Number(event.target.value || current.narrativeTimeoutMs)
                      }
                    : current
                )
              }
            />

            <label htmlFor="cache">Tamaño cache narrativa</label>
            <input
              id="cache"
              type="number"
              min={10}
              max={10000}
              value={config.narrativeCacheSize}
              onChange={(event) =>
                setConfig((current) =>
                  current
                    ? {
                        ...current,
                        narrativeCacheSize: Number(event.target.value || current.narrativeCacheSize)
                      }
                    : current
                )
              }
            />

            <label htmlFor="wedEnabled">WED habilitado</label>
            <select
              id="wedEnabled"
              value={String(config.wedEnabled)}
              onChange={(event) =>
                setConfig((current) =>
                  current ? { ...current, wedEnabled: event.target.value === 'true' } : current
                )
              }
            >
              <option value="true">sí</option>
              <option value="false">no</option>
            </select>
          </>
        ) : null}

        {balance ? (
          <section className="play-card tmb-frame admin-balance-panel">
            <h2>Balance v0</h2>
            <p className="muted">
              Turnos: {balance.totalTurns} | Latencia promedio: {balance.avgLatencyMs}ms
            </p>
            {balance.presets.map((row) => (
              <article key={row.presetId} className="play-card tmb-frame admin-balance-row">
                <strong>Preset: {row.presetId}</strong>
                <p className="muted">
                  Turnos: {row.totalTurns} | Tasa de bloqueos: {(row.blockedRate * 100).toFixed(1)}%
                </p>
                <p className="muted">
                  Resultados: Éxito {row.outcomes.SUCCESS} / Parcial {row.outcomes.PARTIAL} /
                  Fallo con avance {row.outcomes.FAIL_FORWARD} / Bloqueado {row.outcomes.BLOCKED}
                </p>
                <p className="muted">
                  Cambio abs promedio: Sosp {row.avgDeltaAbs.suspicion} | Tens{' '}
                  {row.avgDeltaAbs.tension} | Reloj {row.avgDeltaAbs.clock} | Riesgo{' '}
                  {row.avgDeltaAbs.risk}
                </p>
              </article>
            ))}
          </section>
        ) : null}

        {error ? <p className="error-text">{error}</p> : null}
      </section>
    </main>
  );
}
