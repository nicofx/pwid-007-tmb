import type { ActionInput, PresetDefinition, TurnPacket } from '@tmb/contracts';
import { getOrCreateDeviceId } from './deviceId';

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status?: number
  ) {
    super(message);
  }
}

interface StartSessionPayload {
  capsuleId: string;
  roleId?: string;
  presetId?: string;
  seed?: string;
}

interface StartSessionResponse {
  sessionId: string;
  seed: string;
  profileId?: string;
  packet: TurnPacket;
}

interface SendTurnPayload {
  sessionId: string;
  turnId: string;
  playerText?: string;
  action?: ActionInput;
}

interface SendTurnResponse {
  packet: TurnPacket;
  idempotencyHit: boolean;
  narrativeProvider?: 'llm' | 'placeholder' | 'unknown';
}

interface ResumeSessionResponse {
  sessionId: string;
  capsuleId: string;
  presetId?: string;
  seed: string;
  profileId?: string;
  lastTurnSeq: number;
  packet: TurnPacket;
}

export interface CapsuleOverview {
  capsuleId: string;
  title: string;
  scenes: Array<{ id: string; title: string; beatIds: string[] }>;
  hotspots: Array<{ id: string; label: string; locationId: string }>;
}

export interface ClientTelemetryEvent {
  eventName: string;
  ts: string;
  sessionId?: string;
  turnId?: string;
  payload?: Record<string, unknown>;
}

export interface DebugTraceTurn {
  seq: number;
  turnId: string;
  request: unknown;
  outcome: unknown;
  deltas: unknown;
  packet: TurnPacket;
  wed?: unknown;
  createdAt: string;
}

export interface AdminRuntimeConfig {
  narrativeMode: 'placeholder' | 'llm' | 'hybrid';
  llmAdapter: 'mock' | 'http';
  llmModel: string;
  narrativeTimeoutMs: number;
  narrativeCacheSize: number;
  llmBaseUrl?: string;
  llmApiKey?: string;
  wedEnabled: boolean;
}

export interface AdminBalanceReport {
  totalTurns: number;
  avgLatencyMs: number;
  presets: Array<{
    presetId: string;
    totalTurns: number;
    outcomes: Record<'SUCCESS' | 'PARTIAL' | 'FAIL_FORWARD' | 'BLOCKED', number>;
    blockedRate: number;
    avgDeltaAbs: {
      suspicion: number;
      tension: number;
      clock: number;
      risk: number;
    };
  }>;
}

export interface ProfileResponse {
  id: string;
  deviceId: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileSessionSummary {
  sessionId: string;
  capsuleId: string;
  presetId?: string;
  seed: string;
  status: 'ACTIVE' | 'ENDED';
  lastTurnSeq: number;
  updatedAt: string;
  createdAt: string;
}

export interface SessionTurnTimelineItem {
  seq: number;
  turnId: string;
  action: unknown;
  outcome: unknown;
  deltas: unknown;
  createdAt: string;
  packet?: TurnPacket;
  narrativeProvider?: string;
  worldEvent?: unknown;
}

export interface SessionTurnsResponse {
  sessionMeta: {
    sessionId: string;
    capsuleId: string;
    presetId?: string;
    seed: string;
    lastTurnSeq: number;
    status: 'ACTIVE' | 'ENDED';
  };
  turns: SessionTurnTimelineItem[];
  limit: number;
  fromSeq: number;
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
}

function withDeviceHeaders(base?: HeadersInit): HeadersInit {
  return {
    ...base,
    'X-Tmb-Device-Id': getOrCreateDeviceId()
  };
}

export async function normalizeError(response: Response): Promise<ApiClientError> {
  let payload: { code?: string; message?: string } | null = null;
  try {
    payload = (await response.json()) as { code?: string; message?: string };
  } catch {
    payload = null;
  }

  const code = payload?.code ?? `HTTP_${response.status}`;
  const message = payload?.message ?? `Request failed with status ${response.status}`;
  return new ApiClientError(code, message, response.status);
}

export async function startSession(payload: StartSessionPayload): Promise<StartSessionResponse> {
  const response = await fetch(`${getBaseUrl()}/sessions/start`, {
    method: 'POST',
    headers: withDeviceHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw await normalizeError(response);
  }

  return (await response.json()) as StartSessionResponse;
}

export async function getCapsulePresets(capsuleId: string): Promise<PresetDefinition[]> {
  const response = await fetch(`${getBaseUrl()}/sessions/presets/${capsuleId}`, {
    headers: withDeviceHeaders()
  });
  if (!response.ok) {
    throw await normalizeError(response);
  }
  return (await response.json()) as PresetDefinition[];
}

export async function getCapsuleOverview(capsuleId: string): Promise<CapsuleOverview> {
  const response = await fetch(`${getBaseUrl()}/sessions/capsules/${capsuleId}/overview`, {
    headers: withDeviceHeaders()
  });
  if (!response.ok) {
    throw await normalizeError(response);
  }
  return (await response.json()) as CapsuleOverview;
}

export async function resumeSession(sessionId: string): Promise<ResumeSessionResponse> {
  const response = await fetch(`${getBaseUrl()}/sessions/${sessionId}/resume`, {
    headers: withDeviceHeaders()
  });
  if (!response.ok) {
    throw await normalizeError(response);
  }
  return (await response.json()) as ResumeSessionResponse;
}

export async function sendTurn(payload: SendTurnPayload): Promise<SendTurnResponse> {
  const response = await fetch(`${getBaseUrl()}/turns`, {
    method: 'POST',
    headers: withDeviceHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw await normalizeError(response);
  }

  const data = (await response.json()) as SendTurnResponse;
  const headerProvider = response.headers.get('x-tmb-narrative-provider');
  if (
    headerProvider === 'llm' ||
    headerProvider === 'placeholder' ||
    headerProvider === 'unknown'
  ) {
    data.narrativeProvider = headerProvider;
  }
  return data;
}

export async function sendClientEvents(params: {
  deviceId: string;
  events: ClientTelemetryEvent[];
}): Promise<void> {
  const response = await fetch(`${getBaseUrl()}/telemetry/client`, {
    method: 'POST',
    headers: withDeviceHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    throw await normalizeError(response);
  }
}

export async function getSessionTrace(
  sessionId: string,
  last = 20
): Promise<{ sessionId: string; last: number; turns: DebugTraceTurn[] }> {
  const response = await fetch(`${getBaseUrl()}/debug/sessions/${sessionId}/trace?last=${last}`, {
    headers: withDeviceHeaders()
  });
  if (!response.ok) {
    throw await normalizeError(response);
  }
  return (await response.json()) as { sessionId: string; last: number; turns: DebugTraceTurn[] };
}

export async function getProfile(): Promise<ProfileResponse> {
  const response = await fetch(`${getBaseUrl()}/profile`, {
    headers: withDeviceHeaders()
  });
  if (!response.ok) {
    throw await normalizeError(response);
  }
  return (await response.json()) as ProfileResponse;
}

export async function updateProfile(payload: { displayName: string }): Promise<ProfileResponse> {
  const response = await fetch(`${getBaseUrl()}/profile`, {
    method: 'PATCH',
    headers: withDeviceHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw await normalizeError(response);
  }
  return (await response.json()) as ProfileResponse;
}

export async function getProfileSessions(limit = 10): Promise<{
  sessions: ProfileSessionSummary[];
  limit: number;
}> {
  const response = await fetch(`${getBaseUrl()}/profile/sessions?limit=${limit}`, {
    headers: withDeviceHeaders()
  });
  if (!response.ok) {
    throw await normalizeError(response);
  }
  return (await response.json()) as { sessions: ProfileSessionSummary[]; limit: number };
}

export async function getSessionTurns(params: {
  sessionId: string;
  limit?: number;
  fromSeq?: number;
  includePacket?: boolean;
}): Promise<SessionTurnsResponse> {
  const search = new URLSearchParams();
  if (params.limit !== undefined) {
    search.set('limit', String(params.limit));
  }
  if (params.fromSeq !== undefined) {
    search.set('fromSeq', String(params.fromSeq));
  }
  if (params.includePacket) {
    search.set('includePacket', '1');
  }
  const response = await fetch(`${getBaseUrl()}/sessions/${params.sessionId}/turns?${search.toString()}`, {
    headers: withDeviceHeaders()
  });
  if (!response.ok) {
    throw await normalizeError(response);
  }
  return (await response.json()) as SessionTurnsResponse;
}

export async function deleteSession(sessionId: string): Promise<{ ok: true }> {
  const response = await fetch(`${getBaseUrl()}/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: withDeviceHeaders()
  });
  if (!response.ok) {
    throw await normalizeError(response);
  }
  return (await response.json()) as { ok: true };
}

export async function wipeProfile(): Promise<{ ok: true }> {
  const response = await fetch(`${getBaseUrl()}/profile`, {
    method: 'DELETE',
    headers: withDeviceHeaders()
  });
  if (!response.ok) {
    throw await normalizeError(response);
  }
  return (await response.json()) as { ok: true };
}

export async function exportProfile(params?: {
  includeTelemetry?: boolean;
  turnLimitPerSession?: number;
}): Promise<unknown> {
  const search = new URLSearchParams();
  if (params?.includeTelemetry) {
    search.set('includeTelemetry', '1');
  }
  if (params?.turnLimitPerSession !== undefined) {
    search.set('turnLimitPerSession', String(params.turnLimitPerSession));
  }
  const url = `${getBaseUrl()}/profile/export${search.size > 0 ? `?${search.toString()}` : ''}`;
  const response = await fetch(url, {
    headers: withDeviceHeaders()
  });
  if (!response.ok) {
    throw await normalizeError(response);
  }
  return (await response.json()) as unknown;
}

function withAdminHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Admin-Token': token
  };
}

export async function getAdminConfig(token: string): Promise<AdminRuntimeConfig> {
  const response = await fetch(`${getBaseUrl()}/admin/config`, {
    headers: withAdminHeaders(token)
  });
  if (!response.ok) {
    throw await normalizeError(response);
  }
  return (await response.json()) as AdminRuntimeConfig;
}

export async function updateAdminConfig(
  token: string,
  patch: Partial<AdminRuntimeConfig>
): Promise<AdminRuntimeConfig> {
  const response = await fetch(`${getBaseUrl()}/admin/config`, {
    method: 'POST',
    headers: withAdminHeaders(token),
    body: JSON.stringify(patch)
  });
  if (!response.ok) {
    throw await normalizeError(response);
  }
  return (await response.json()) as AdminRuntimeConfig;
}

export async function getAdminBalance(token: string): Promise<AdminBalanceReport> {
  const response = await fetch(`${getBaseUrl()}/admin/balance`, {
    headers: withAdminHeaders(token)
  });
  if (!response.ok) {
    throw await normalizeError(response);
  }
  return (await response.json()) as AdminBalanceReport;
}
