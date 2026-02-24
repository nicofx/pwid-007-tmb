import type { TurnPacket } from '@tmb/contracts';
import { OutcomeBadge } from '@/components/ui/OutcomeBadge';

export interface TurnSummary {
  title: string;
  details: string[];
}

interface TurnSummaryBarProps {
  packet: TurnPacket;
}

export function buildTurnSummary(packet: TurnPacket): TurnSummary {
  const details: string[] = [];
  const state = packet.deltas?.state ?? {};

  const pushState = (label: string, value?: number) => {
    if (!value) {
      return;
    }
    const sign = value > 0 ? '+' : '';
    details.push(`${label} ${sign}${value}`);
  };

  pushState('Sospecha', state.suspicion);
  pushState('Tensión', state.tension);
  pushState('Reloj', state.clock);
  pushState('Riesgo', state.risk);

  const clue = packet.deltas?.cluesAdded?.[0];
  if (clue) {
    details.push(`Pista: ${clue}`);
  }

  const leverage = packet.deltas?.leverageAdded?.[0];
  if (leverage) {
    details.push(`Ventaja: ${leverage}`);
  }

  if (packet.outcome === 'BLOCKED') {
    const reason = packet.narrativeBlocks.find((block) => block.kind === 'SYSTEM')?.text;
    return {
      title: 'Bloqueado',
      details: [reason ?? 'Esa acción no aplica en este momento.'].concat(details).slice(0, 3)
    };
  }

  return {
    title:
      packet.outcome === 'SUCCESS'
        ? 'Éxito'
        : packet.outcome === 'PARTIAL'
          ? 'Progreso parcial'
          : 'Fallo con avance',
    details: (details.length > 0 ? details : ['Sin cambios relevantes en este turno.']).slice(0, 3)
  };
}

export function TurnSummaryBar(props: TurnSummaryBarProps): React.ReactElement {
  const summary = buildTurnSummary(props.packet);

  return (
    <section className="play-card tmb-frame tmb-texture turn-summary-bar" role="status" aria-live="polite">
      <div className="scene-meta-row">
        <strong>Resultado: {summary.title}</strong>
        <OutcomeBadge outcome={props.packet.outcome} />
      </div>
      <p className="muted">{summary.details.join(' • ')}</p>
    </section>
  );
}
