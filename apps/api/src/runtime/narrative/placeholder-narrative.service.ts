import { Injectable } from '@nestjs/common';
import type { NarrativeBlock, TurnPacket } from '@tmb/contracts';

@Injectable()
export class PlaceholderNarrativeService {
  render(packetBase: TurnPacket): NarrativeBlock[] {
    const primary = this.primaryBlock(packetBase);
    const blocks: NarrativeBlock[] = [primary];

    if (packetBase.outcome === 'BLOCKED') {
      const hint = packetBase.affordances?.suggestedActions[0];
      if (hint) {
        blocks.push({
          kind: 'SYSTEM',
          text: `Try ${hint.verb}${hint.targetId ? ` on ${hint.targetId}` : ''}.`
        });
      }
      return blocks;
    }

    const deltaNotes = this.deltaNotes(packetBase);
    if (deltaNotes.length > 0) {
      blocks.push({
        kind: 'SYSTEM',
        text: deltaNotes.join(' | ')
      });
    }

    return blocks.slice(0, 3);
  }

  private primaryBlock(packet: TurnPacket): NarrativeBlock {
    if (packet.outcome === 'SUCCESS') {
      return {
        kind: 'EVENT',
        text: `You press the advantage. ${packet.action.verb} holds and the scene shifts in your favor.`
      };
    }
    if (packet.outcome === 'PARTIAL') {
      return {
        kind: 'EVENT',
        text: `You get part of what you wanted, but the pressure ticks upward.`
      };
    }
    if (packet.outcome === 'FAIL_FORWARD') {
      return {
        kind: 'EVENT',
        text: `You move forward at a cost. The mission continues under tighter scrutiny.`
      };
    }
    return {
      kind: 'SYSTEM',
      text: `${packet.action.verb} is blocked in this beat. Pick another approach.`
    };
  }

  private deltaNotes(packet: TurnPacket): string[] {
    const out: string[] = [];
    if (packet.deltas?.cluesAdded?.length) {
      out.push(`Clue +${packet.deltas.cluesAdded.join(', ')}`);
    }
    if (packet.deltas?.leverageAdded?.length) {
      out.push(`Leverage +${packet.deltas.leverageAdded.join(', ')}`);
    }
    if (packet.deltas?.inventoryAdded?.length) {
      out.push(`Inventory +${packet.deltas.inventoryAdded.join(', ')}`);
    }
    if (packet.deltas?.state) {
      out.push('State shifted');
    }
    return out;
  }
}
