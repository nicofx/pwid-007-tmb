'use client';

import type { ActionVerb, PresetDefinition, TurnPacket } from '@tmb/contracts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ApiClientError,
  getCapsulePresets,
  getSessionTrace,
  resumeSession,
  sendTurn,
  startSession
} from './apiClient';
import { pushTurnHistory, traceToHistoryTurns } from './debug/history';
import type { DebugActionSource, DebugTurnEntry } from './debug/types';
import { getOrCreateDeviceId } from './deviceId';
import { PLAY_SCENARIOS, type PlayScenarioId, getScenarioById } from './scenarios';
import { flushTelemetry, trackClientEvent } from './telemetryClient';
import { createTurnId } from './turnId';

const STORAGE_KEY = 'tmb.play.session';
const PACKET_CACHE_KEY = 'tmb.play.packet.cache';
const PRESET_PREFS_KEY = 'tmb.play.preset.selection';
const SCENARIO_PREFS_KEY = 'tmb.play.scenario.selection';
const DEMO_MODE_PREFS_KEY = 'tmb.play.demo.enabled';
const DEMO_SEED = 'demo-berlin-1933';

interface StoredSession {
  sessionId: string;
  capsuleId: string;
  presetId?: string;
  seed?: string;
  scenarioId?: PlayScenarioId;
  demoMode?: boolean;
}

interface SendTurnOptions {
  turnId?: string;
  verb?: ActionVerb;
  targetId?: string;
  playerText?: string;
  source?: DebugActionSource;
}

const HISTORY_LIMIT = 20;

export function useGameStore() {
  const [deviceId, setDeviceId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionSeed, setSessionSeed] = useState<string | null>(null);
  const [capsuleId, setCapsuleId] = useState<string>('berlin-1933');
  const [packet, setPacket] = useState<TurnPacket | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | undefined>();
  const [selectedVerb, setSelectedVerb] = useState<ActionVerb | undefined>();
  const [selectedPresetId, setSelectedPresetId] = useState<string>('default');
  const [availablePresets, setAvailablePresets] = useState<PresetDefinition[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<PlayScenarioId>('core-a');
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [inputText, setInputText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTurnId, setLastTurnId] = useState('');
  const [lastLatencyMs, setLastLatencyMs] = useState<number>(0);
  const [turnHistory, setTurnHistory] = useState<DebugTurnEntry[]>([]);

  const selectedScenario = useMemo(() => getScenarioById(selectedScenarioId), [selectedScenarioId]);

  const loadPresets = useCallback(async (nextCapsuleId: string) => {
    try {
      const presets = await getCapsulePresets(nextCapsuleId);
      setAvailablePresets(presets);
      setSelectedPresetId((current) => {
        if (presets.some((preset) => preset.id === current)) {
          return current;
        }
        return presets[0]?.id ?? 'default';
      });
    } catch {
      setAvailablePresets([]);
    }
  }, []);

  useEffect(() => {
    const nextDeviceId = getOrCreateDeviceId();
    setDeviceId(nextDeviceId);
    trackClientEvent({
      eventName: 'device_id_ready',
      ts: new Date().toISOString(),
      payload: { deviceId: nextDeviceId }
    });

    const presetRaw = localStorage.getItem(PRESET_PREFS_KEY);
    if (presetRaw) {
      setSelectedPresetId(presetRaw);
    }

    const scenarioRaw = localStorage.getItem(SCENARIO_PREFS_KEY);
    if (scenarioRaw === 'core-a' || scenarioRaw === 'core-b' || scenarioRaw === 'core-c') {
      setSelectedScenarioId(scenarioRaw);
    }

    const demoRaw = localStorage.getItem(DEMO_MODE_PREFS_KEY);
    if (demoRaw === '0' || demoRaw === '1') {
      setDemoMode(demoRaw === '1');
    }

    const packetCacheRaw = localStorage.getItem(PACKET_CACHE_KEY);
    if (packetCacheRaw) {
      try {
        setPacket(JSON.parse(packetCacheRaw) as TurnPacket);
      } catch {
        localStorage.removeItem(PACKET_CACHE_KEY);
      }
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      void loadPresets('berlin-1933');
      return;
    }

    try {
      const parsed = JSON.parse(raw) as StoredSession;
      setSessionId(parsed.sessionId);
      setCapsuleId(parsed.capsuleId);
      setSessionSeed(parsed.seed ?? null);
      if (parsed.presetId) {
        setSelectedPresetId(parsed.presetId);
      }
      if (parsed.scenarioId) {
        setSelectedScenarioId(parsed.scenarioId);
      }
      if (typeof parsed.demoMode === 'boolean') {
        setDemoMode(parsed.demoMode);
      }

      trackClientEvent({
        eventName: 'ui_resume_attempt',
        ts: new Date().toISOString(),
        sessionId: parsed.sessionId,
        payload: {
          capsuleId: parsed.capsuleId,
          presetId: parsed.presetId,
          scenarioId: parsed.scenarioId,
          demoMode: parsed.demoMode
        }
      });

      void loadPresets(parsed.capsuleId);

      void resumeSession(parsed.sessionId)
        .then((response) => {
          setPacket(response.packet);
          setCapsuleId(response.capsuleId);
          setSessionSeed(response.seed);
          if (response.presetId) {
            setSelectedPresetId(response.presetId);
            localStorage.setItem(PRESET_PREFS_KEY, response.presetId);
          }
          localStorage.setItem(PACKET_CACHE_KEY, JSON.stringify(response.packet));
          trackClientEvent({
            eventName: 'ui_resume_success',
            ts: new Date().toISOString(),
            sessionId: parsed.sessionId,
            payload: { lastTurnSeq: response.lastTurnSeq, presetId: response.presetId }
          });
          void flushTelemetry(nextDeviceId);
        })
        .catch(() => {
          setSessionId(null);
          setPacket(null);
          setSessionSeed(null);
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(PACKET_CACHE_KEY);
          trackClientEvent({
            eventName: 'ui_resume_fail',
            ts: new Date().toISOString(),
            sessionId: parsed.sessionId
          });
        });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      void loadPresets('berlin-1933');
    }
  }, [loadPresets]);

  useEffect(() => {
    void loadPresets(capsuleId);
  }, [capsuleId, loadPresets]);

  const choosePreset = useCallback(
    (presetId: string) => {
      setSelectedPresetId(presetId);
      localStorage.setItem(PRESET_PREFS_KEY, presetId);
      trackClientEvent({
        eventName: 'ui_preset_select',
        ts: new Date().toISOString(),
        sessionId: sessionId ?? undefined,
        payload: { presetId }
      });
    },
    [sessionId]
  );

  const chooseScenario = useCallback(
    (scenarioId: PlayScenarioId) => {
      setSelectedScenarioId(scenarioId);
      localStorage.setItem(SCENARIO_PREFS_KEY, scenarioId);
      const scenario = getScenarioById(scenarioId);
      if (availablePresets.some((preset) => preset.id === scenario.recommendedPresetId)) {
        setSelectedPresetId(scenario.recommendedPresetId);
        localStorage.setItem(PRESET_PREFS_KEY, scenario.recommendedPresetId);
      }
      trackClientEvent({
        eventName: 'ui_scenario_select',
        ts: new Date().toISOString(),
        sessionId: sessionId ?? undefined,
        payload: { scenarioId }
      });
    },
    [sessionId, availablePresets]
  );

  const setDemo = useCallback((enabled: boolean) => {
    setDemoMode(enabled);
    localStorage.setItem(DEMO_MODE_PREFS_KEY, enabled ? '1' : '0');
  }, []);

  const start = useCallback(
    async (source: DebugActionSource = 'start') => {
      setError(null);
      setIsProcessing(true);
      try {
        const response = await startSession({
          capsuleId,
          presetId: selectedPresetId,
          seed: demoMode ? DEMO_SEED : undefined
        });
        setSessionId(response.sessionId);
        setSessionSeed(response.seed);
        setPacket(response.packet);
        setSelectedTarget(undefined);
        setSelectedVerb(undefined);
        setInputText('');
        setLastLatencyMs(0);
        const stored: StoredSession = {
          sessionId: response.sessionId,
          capsuleId,
          presetId: selectedPresetId,
          seed: response.seed,
          scenarioId: selectedScenarioId,
          demoMode
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
        localStorage.setItem(PACKET_CACHE_KEY, JSON.stringify(response.packet));
        localStorage.setItem(PRESET_PREFS_KEY, selectedPresetId);

        setTurnHistory((history) =>
          pushTurnHistory(
            source === 'reset_run' ? [] : history,
            {
              seq: response.packet.turnNumber,
              request: {
                sessionId: response.sessionId,
                turnId: response.packet.turnId,
                playerText: 'Inicio de sesión',
                action: response.packet.action,
                source
              },
              packet: response.packet,
              sentAt: new Date().toISOString(),
              receivedAt: new Date().toISOString(),
              latencyMs: 0
            },
            HISTORY_LIMIT
          )
        );
        trackClientEvent({
          sessionId: response.sessionId,
          eventName: 'session_started',
          ts: new Date().toISOString(),
          payload: {
            capsuleId,
            presetId: selectedPresetId,
            seed: response.seed,
            scenarioId: selectedScenarioId,
            demoMode
          }
        });
        void flushTelemetry(deviceId);
      } catch (cause) {
        const message =
          cause instanceof ApiClientError ? `${cause.code}: ${cause.message}` : 'falló el inicio';
        setError(message);
      } finally {
        setIsProcessing(false);
      }
    },
    [capsuleId, selectedPresetId, selectedScenarioId, demoMode, deviceId]
  );

  const send = useCallback(
    async (options?: SendTurnOptions) => {
      if (!sessionId || isProcessing) {
        return;
      }

      setIsProcessing(true);
      setError(null);
      const turnId = options?.turnId ?? createTurnId();
      const startedAt = performance.now();
      const requestPayload = {
        sessionId,
        turnId,
        playerText: options?.playerText ?? inputText,
        action: options?.verb
          ? {
              verb: options.verb,
              targetId: options.targetId ?? selectedTarget,
              modifiers: []
            }
          : selectedVerb
            ? { verb: selectedVerb, targetId: selectedTarget, modifiers: [] }
            : undefined
      };

      trackClientEvent({
        sessionId,
        turnId,
        eventName: 'turn_sent',
        ts: new Date().toISOString(),
        payload: { turnId }
      });

      try {
        const response = await sendTurn({
          ...requestPayload
        });

        const latencyMs = Math.round(performance.now() - startedAt);
        setLastLatencyMs(latencyMs);
        setLastTurnId(turnId);
        setPacket(response.packet);
        setInputText('');
        localStorage.setItem(PACKET_CACHE_KEY, JSON.stringify(response.packet));
        setTurnHistory((history) =>
          pushTurnHistory(
            history,
            {
              seq: response.packet.turnNumber,
              request: {
                ...requestPayload,
                source: options?.source ?? 'dock_submit'
              },
              packet: response.packet,
              sentAt: new Date(Date.now() - latencyMs).toISOString(),
              receivedAt: new Date().toISOString(),
              latencyMs,
              idempotencyHit: response.idempotencyHit,
              narrativeProvider: response.narrativeProvider
            },
            HISTORY_LIMIT
          )
        );

        trackClientEvent({
          sessionId,
          turnId,
          eventName: 'turn_received',
          ts: new Date().toISOString(),
          payload: { turnId, latency_ms: latencyMs, idempotencyHit: response.idempotencyHit }
        });
        trackClientEvent({
          sessionId,
          turnId,
          eventName: 'ui_turn_latency_ms',
          ts: new Date().toISOString(),
          payload: { latency_ms: latencyMs }
        });
        void flushTelemetry(deviceId);
      } catch (cause) {
        const message =
          cause instanceof ApiClientError ? `${cause.code}: ${cause.message}` : 'falló el turno';
        setError(message);
        trackClientEvent({
          sessionId,
          turnId,
          eventName: 'turn_error',
          ts: new Date().toISOString(),
          payload: { turnId, message }
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [sessionId, isProcessing, inputText, selectedTarget, selectedVerb, deviceId]
  );

  const resetRun = useCallback(async () => {
    if (isProcessing) {
      return;
    }
    trackClientEvent({
      sessionId: sessionId ?? undefined,
      eventName: 'ui_reset_run',
      ts: new Date().toISOString(),
      payload: {
        capsuleId,
        presetId: selectedPresetId,
        seed: demoMode ? DEMO_SEED : sessionSeed,
        scenarioId: selectedScenarioId
      }
    });
    await start('reset_run');
  }, [
    isProcessing,
    sessionId,
    capsuleId,
    selectedPresetId,
    demoMode,
    sessionSeed,
    selectedScenarioId,
    start
  ]);

  const restart = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PACKET_CACHE_KEY);
    setSessionId(null);
    setSessionSeed(null);
    setPacket(null);
    setSelectedTarget(undefined);
    setSelectedVerb(undefined);
    setError(null);
    setInputText('');
    setLastTurnId('');
    setLastLatencyMs(0);
    setTurnHistory([]);
  }, []);

  const loadTrace = useCallback(
    async (last = HISTORY_LIMIT) => {
      if (!sessionId) {
        return;
      }
      try {
        const trace = await getSessionTrace(sessionId, last);
        setTurnHistory(traceToHistoryTurns(trace.turns).slice(-HISTORY_LIMIT));
      } catch {
        // trace is optional in debug mode; keep local history if unavailable
      }
    },
    [sessionId]
  );

  return {
    deviceId,
    sessionId,
    sessionSeed,
    capsuleId,
    selectedPresetId,
    availablePresets,
    selectedScenario,
    selectedScenarioId,
    scenarios: PLAY_SCENARIOS,
    demoMode,
    demoSeed: DEMO_SEED,
    packet,
    selectedTarget,
    selectedVerb,
    inputText,
    isProcessing,
    error,
    lastTurnId,
    lastLatencyMs,
    turnHistory,
    setCapsuleId,
    choosePreset,
    chooseScenario,
    setDemo,
    setSelectedTarget,
    setSelectedVerb,
    setInputText,
    loadTrace,
    start,
    send,
    resetRun,
    restart
  };
}
