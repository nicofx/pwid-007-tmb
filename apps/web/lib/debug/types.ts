import type { ActionInput, TurnPacket } from '@tmb/contracts';

export type DebugActionSource =
  | 'start'
  | 'dock_submit'
  | 'verb_button'
  | 'chip'
  | 'hotspot'
  | 'overlay'
  | 'move'
  | 'iu'
  | 'resume_trace'
  | 'guidance'
  | 'blocked_alternative'
  | 'reset_run';

export interface DebugTurnRequest {
  sessionId: string;
  turnId: string;
  playerText?: string;
  action?: ActionInput;
  source: DebugActionSource;
}

export interface DebugTurnEntry {
  seq?: number;
  request: DebugTurnRequest;
  packet: TurnPacket;
  sentAt: string;
  receivedAt: string;
  latencyMs: number;
  idempotencyHit?: boolean;
  narrativeProvider?: 'llm' | 'placeholder' | 'unknown';
}

export type DebugTab = 'request' | 'explain' | 'diff' | 'raw';
