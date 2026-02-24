import type { TurnPacket } from '@tmb/contracts';
import { tOutcome, tVerb } from '@/lib/i18n-game';
import type { DebugDiff } from './diff-builder';

export function buildExplainBullets(params: { packet: TurnPacket; diff: DebugDiff }): string[] {
  const { packet, diff } = params;
  const bullets: string[] = [];
  const stateLabel: Record<string, string> = {
    suspicion: 'sospecha',
    tension: 'tensión',
    clock: 'reloj',
    risk: 'riesgo'
  };

  bullets.push(`Resultado: ${tOutcome(packet.outcome)}.`);

  if (packet.outcome === 'BLOCKED') {
    bullets.push('La acción quedó bloqueada por las reglas del tramo actual.');
    const suggestion = packet.affordances?.suggestedActions[0];
    if (suggestion) {
      bullets.push(
        `Probá ${tVerb(suggestion.verb)}${suggestion.targetId ? ` en ${suggestion.targetId}` : ''}: ${suggestion.reason}`
      );
    }
  }

  const stateChanges = diff.state
    .filter((item) => item.delta !== 0)
    .map((item) => `${stateLabel[item.key] ?? item.key} ${item.delta > 0 ? '+' : ''}${item.delta}`);
  if (stateChanges.length > 0) {
    bullets.push(`Cambios de estado: ${stateChanges.join(', ')}.`);
  }

  if (diff.cluesAdded.length > 0) {
    bullets.push(`Pistas ganadas: ${diff.cluesAdded.join(', ')}.`);
  }
  if (diff.leverageAdded.length > 0) {
    bullets.push(`Ventajas ganadas: ${diff.leverageAdded.join(', ')}.`);
  }
  if (diff.inventoryAdded.length > 0) {
    bullets.push(`Inventario ganado: ${diff.inventoryAdded.join(', ')}.`);
  }

  if (diff.hotspotsAdded.length > 0 || diff.hotspotsRemoved.length > 0) {
    bullets.push(
      `Puntos de interés cambiaron (+${diff.hotspotsAdded.length}/-${diff.hotspotsRemoved.length}).`
    );
  }

  if (packet.worldEvent?.fired) {
    bullets.push(
      `WED disparó ${packet.worldEvent.eventId} (${packet.worldEvent.flavor}/${packet.worldEvent.intensity}).`
    );
  } else if (packet.worldEvent?.skipReason) {
    bullets.push(`WED se omitió: ${packet.worldEvent.skipReason}.`);
  }

  return bullets.slice(0, 8);
}
