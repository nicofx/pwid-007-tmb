import type { StateText, TurnDeltas } from '@tmb/contracts';
import type { SessionState } from '../domain/types.js';

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function mergeStateText(base: StateText, delta?: Partial<StateText>): StateText {
  if (!delta) {
    return base;
  }

  return {
    suspicion: clamp(delta.suspicion ?? base.suspicion),
    tension: clamp(delta.tension ?? base.tension),
    clock: clamp(delta.clock ?? base.clock),
    risk: clamp(delta.risk ?? base.risk),
    trustByNpc: delta.trustByNpc ?? base.trustByNpc
  };
}

export class StateReducer {
  applyDeltas(state: SessionState, deltas: TurnDeltas): SessionState {
    const next = {
      ...state,
      stateText: mergeStateText(state.stateText, deltas.state),
      leverage: new Set(state.leverage),
      inventory: new Set(state.inventory),
      clues: new Set(state.clues)
    };

    for (const clue of deltas.cluesAdded ?? []) {
      next.clues.add(clue);
    }
    for (const leverage of deltas.leverageAdded ?? []) {
      next.leverage.add(leverage);
    }
    for (const item of deltas.inventoryAdded ?? []) {
      next.inventory.add(item);
    }

    return next;
  }
}
