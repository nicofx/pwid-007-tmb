'use client';

import type { ActionVerb, PresetDefinition, TurnPacket } from '@tmb/contracts';
import { useCallback, useEffect, useState } from 'react';
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
import { flushTelemetry, trackClientEvent } from './telemetryClient';
import { createTurnId } from './turnId';

const STORAGE_KEY = 'tmb.play.session';
const PACKET_CACHE_KEY = 'tmb.play.packet.cache';
const PRESET_PREFS_KEY = 'tmb.play.preset.selection';

interface StoredSession {
  sessionId: string;
  capsuleId: string;
  presetId?: string;
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
  const [capsuleId, setCapsuleId] = useState<string>('berlin-1933');
  const [packet, setPacket] = useState<TurnPacket | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | undefined>();
  const [selectedVerb, setSelectedVerb] = useState<ActionVerb | undefined>();
  const [selectedPresetId, setSelectedPresetId] = useState<string>('default');
  const [availablePresets, setAvailablePresets] = useState<PresetDefinition[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTurnId, setLastTurnId] = useState('');
  const [turnHistory, setTurnHistory] = useState<DebugTurnEntry[]>([]);

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

    const presetRaw = localStorage.getItem(PRESET_PREFS_KEY);
    if (presetRaw) {
      setSelectedPresetId(presetRaw);
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
      if (parsed.presetId) {
        setSelectedPresetId(parsed.presetId);
      }

      trackClientEvent({
        eventName: 'ui_resume_attempt',
        ts: new Date().toISOString(),
        sessionId: parsed.sessionId,
        payload: { capsuleId: parsed.capsuleId, presetId: parsed.presetId }
      });

      void loadPresets(parsed.capsuleId);

      void resumeSession(parsed.sessionId)
        .then((response) => {
          setPacket(response.packet);
          setCapsuleId(response.capsuleId);
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

  const start = useCallback(async () => {
    setError(null);
    setIsProcessing(true);
    try {
      const response = await startSession({ capsuleId, presetId: selectedPresetId });
      setSessionId(response.sessionId);
      setPacket(response.packet);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ sessionId: response.sessionId, capsuleId, presetId: selectedPresetId })
      );
      localStorage.setItem(PACKET_CACHE_KEY, JSON.stringify(response.packet));
      localStorage.setItem(PRESET_PREFS_KEY, selectedPresetId);
      setTurnHistory((history) =>
        pushTurnHistory(
          history,
          {
            seq: response.packet.turnNumber,
            request: {
              sessionId: response.sessionId,
              turnId: response.packet.turnId,
              playerText: 'Session start',
              action: response.packet.action,
              source: 'start'
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
        payload: { capsuleId, presetId: selectedPresetId }
      });
      void flushTelemetry(deviceId);
    } catch (cause) {
      const message =
        cause instanceof ApiClientError ? `${cause.code}: ${cause.message}` : 'start failed';
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  }, [capsuleId, selectedPresetId, deviceId]);

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
              idempotencyHit: response.idempotencyHit
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
        void flushTelemetry(deviceId);
      } catch (cause) {
        const message =
          cause instanceof ApiClientError ? `${cause.code}: ${cause.message}` : 'turn failed';
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

  const restart = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PACKET_CACHE_KEY);
    setSessionId(null);
    setPacket(null);
    setSelectedTarget(undefined);
    setSelectedVerb(undefined);
    setError(null);
    setInputText('');
    setLastTurnId('');
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
    capsuleId,
    selectedPresetId,
    availablePresets,
    packet,
    selectedTarget,
    selectedVerb,
    inputText,
    isProcessing,
    error,
    lastTurnId,
    turnHistory,
    setCapsuleId,
    choosePreset,
    setSelectedTarget,
    setSelectedVerb,
    setInputText,
    loadTrace,
    start,
    send,
    restart
  };
}
