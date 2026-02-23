import type { TurnPacket } from '@tmb/contracts';
import type { DebugDiff } from './diff-builder';

export function buildExplainBullets(params: { packet: TurnPacket; diff: DebugDiff }): string[] {
  const { packet, diff } = params;
  const bullets: string[] = [];

  bullets.push(`Outcome: ${packet.outcome}.`);

  if (packet.outcome === 'BLOCKED') {
    bullets.push('Action was blocked by beat affordance rules.');
    const suggestion = packet.affordances?.suggestedActions[0];
    if (suggestion) {
      bullets.push(
        `Try ${suggestion.verb}${suggestion.targetId ? ` on ${suggestion.targetId}` : ''}: ${suggestion.reason}`
      );
    }
  }

  const stateChanges = diff.state
    .filter((item) => item.delta !== 0)
    .map((item) => `${item.key} ${item.delta > 0 ? '+' : ''}${item.delta}`);
  if (stateChanges.length > 0) {
    bullets.push(`State deltas: ${stateChanges.join(', ')}.`);
  }

  if (diff.cluesAdded.length > 0) {
    bullets.push(`Clues gained: ${diff.cluesAdded.join(', ')}.`);
  }
  if (diff.leverageAdded.length > 0) {
    bullets.push(`Leverage gained: ${diff.leverageAdded.join(', ')}.`);
  }
  if (diff.inventoryAdded.length > 0) {
    bullets.push(`Inventory gained: ${diff.inventoryAdded.join(', ')}.`);
  }

  if (diff.hotspotsAdded.length > 0 || diff.hotspotsRemoved.length > 0) {
    bullets.push(
      `Hotspots changed (+${diff.hotspotsAdded.length}/-${diff.hotspotsRemoved.length}).`
    );
  }

  if (packet.worldEvent?.fired) {
    bullets.push(
      `WED fired ${packet.worldEvent.eventId} (${packet.worldEvent.flavor}/${packet.worldEvent.intensity}).`
    );
  } else if (packet.worldEvent?.skipReason) {
    bullets.push(`WED skipped: ${packet.worldEvent.skipReason}.`);
  }

  return bullets.slice(0, 8);
}
