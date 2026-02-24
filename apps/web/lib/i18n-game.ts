import type { ActionVerb, OutcomeType } from '@tmb/contracts';

const VERB_LABELS: Record<ActionVerb, string> = {
  TALK: 'Hablar',
  SEARCH: 'Buscar',
  OBSERVE: 'Observar',
  MOVE: 'Moverse',
  WAIT: 'Esperar',
  USE: 'Usar',
  TAKE: 'Tomar',
  DROP: 'Soltar'
};

const OUTCOME_LABELS: Record<OutcomeType, string> = {
  SUCCESS: 'Éxito',
  PARTIAL: 'Parcial',
  FAIL_FORWARD: 'Fallo con avance',
  BLOCKED: 'Bloqueado'
};

export function tVerb(verb: ActionVerb): string {
  return VERB_LABELS[verb] ?? verb;
}

export function tOutcome(outcome: OutcomeType): string {
  return OUTCOME_LABELS[outcome] ?? outcome;
}

export function tOutcomeFromUnknown(outcome: unknown): string {
  if (typeof outcome !== 'string') {
    return String(outcome ?? '—');
  }
  if (outcome === 'SUCCESS' || outcome === 'PARTIAL' || outcome === 'FAIL_FORWARD' || outcome === 'BLOCKED') {
    return tOutcome(outcome);
  }
  return outcome;
}

export function tActionSource(source: 'explicit' | 'heuristic' | 'fallback'): string {
  if (source === 'explicit') {
    return 'explícita';
  }
  if (source === 'heuristic') {
    return 'interpretada';
  }
  return 'respaldo';
}

export function tSessionStatus(status: 'ACTIVE' | 'ENDED'): string {
  return status === 'ACTIVE' ? 'activa' : 'finalizada';
}
