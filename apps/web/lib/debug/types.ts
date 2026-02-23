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
  | 'resume_trace';

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
}

export type DebugTab = 'request' | 'explain' | 'diff' | 'raw';
