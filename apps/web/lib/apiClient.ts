import type { ActionInput, PresetDefinition, TurnPacket } from '@tmb/contracts';

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
}

interface StartSessionResponse {
  sessionId: string;
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
}

interface ResumeSessionResponse {
  sessionId: string;
  capsuleId: string;
  presetId?: string;
  lastTurnSeq: number;
  packet: TurnPacket;
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

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw await normalizeError(response);
  }

  return (await response.json()) as StartSessionResponse;
}

export async function getCapsulePresets(capsuleId: string): Promise<PresetDefinition[]> {
  const response = await fetch(`${getBaseUrl()}/sessions/presets/${capsuleId}`);
  if (!response.ok) {
    throw await normalizeError(response);
  }
  return (await response.json()) as PresetDefinition[];
}

export async function resumeSession(sessionId: string): Promise<ResumeSessionResponse> {
  const response = await fetch(`${getBaseUrl()}/sessions/${sessionId}/resume`);
  if (!response.ok) {
    throw await normalizeError(response);
  }
  return (await response.json()) as ResumeSessionResponse;
}

export async function sendTurn(payload: SendTurnPayload): Promise<SendTurnResponse> {
  const response = await fetch(`${getBaseUrl()}/turns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw await normalizeError(response);
  }

  return (await response.json()) as SendTurnResponse;
}

export async function sendClientEvents(params: {
  deviceId: string;
  events: ClientTelemetryEvent[];
}): Promise<void> {
  const response = await fetch(`${getBaseUrl()}/telemetry/client`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
  const response = await fetch(`${getBaseUrl()}/debug/sessions/${sessionId}/trace?last=${last}`);
  if (!response.ok) {
    throw await normalizeError(response);
  }
  return (await response.json()) as { sessionId: string; last: number; turns: DebugTraceTurn[] };
}
