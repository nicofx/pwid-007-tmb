import { Injectable } from '@nestjs/common';
import type { NarrativeBlock, TurnPacket } from '@tmb/contracts';

function translateVerb(verb: TurnPacket['action']['verb']): string {
  if (verb === 'TALK') return 'hablar';
  if (verb === 'SEARCH') return 'buscar';
  if (verb === 'OBSERVE') return 'observar';
  if (verb === 'MOVE') return 'moverse';
  if (verb === 'WAIT') return 'esperar';
  if (verb === 'USE') return 'usar';
  if (verb === 'TAKE') return 'tomar';
  if (verb === 'DROP') return 'soltar';
  return String(verb).toLowerCase();
}

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
          text: `Probá ${translateVerb(hint.verb)}${hint.targetId ? ` en ${hint.targetId}` : ''}.`
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
        text: `Ganás terreno. ${translateVerb(packet.action.verb)} funciona y la escena se inclina a tu favor.`
      };
    }
    if (packet.outcome === 'PARTIAL') {
      return {
        kind: 'EVENT',
        text: 'Conseguís parte de lo que buscabas, pero la presión sube.'
      };
    }
    if (packet.outcome === 'FAIL_FORWARD') {
      return {
        kind: 'EVENT',
        text: 'Avanzás con costo. La misión sigue bajo mayor vigilancia.'
      };
    }
    return {
      kind: 'SYSTEM',
      text: `${translateVerb(packet.action.verb)} está bloqueado en este tramo. Elegí otro enfoque.`
    };
  }

  private deltaNotes(packet: TurnPacket): string[] {
    const out: string[] = [];
    if (packet.deltas?.cluesAdded?.length) {
      out.push(`Pista +${packet.deltas.cluesAdded.join(', ')}`);
    }
    if (packet.deltas?.leverageAdded?.length) {
      out.push(`Ventaja +${packet.deltas.leverageAdded.join(', ')}`);
    }
    if (packet.deltas?.inventoryAdded?.length) {
      out.push(`Inventario +${packet.deltas.inventoryAdded.join(', ')}`);
    }
    if (packet.deltas?.state) {
      out.push('Estado actualizado');
    }
    return out;
  }
}
