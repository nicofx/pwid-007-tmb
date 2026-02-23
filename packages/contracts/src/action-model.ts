export type ActionVerb = 'TALK' | 'SEARCH' | 'OBSERVE' | 'MOVE' | 'WAIT' | 'USE' | 'TAKE' | 'DROP';

export type ActionSource = 'explicit' | 'heuristic' | 'fallback';

export interface ActionInput {
  verb?: ActionVerb;
  targetId?: string;
  modifiers?: string[];
}

export interface ActionModel {
  verb: ActionVerb;
  targetId?: string;
  modifiers: string[];
  source: ActionSource;
  rawText?: string;
}

export interface TurnRequest {
  sessionId: string;
  turnId: string;
  playerText?: string;
  action?: ActionInput;
}
