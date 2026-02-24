import type { ActionVerb, TurnPacket } from '@tmb/contracts';
import { tTargetLabel } from '@/lib/i18n-content';
import { tVerb } from '@/lib/i18n-game';

export type CoachMode = 'off' | 'compact' | 'on';

export interface CoachSuggestion {
  verb: ActionVerb;
  targetId?: string;
  reason: string;
  playerText: string;
}

interface CoachPanelProps {
  mode: CoachMode;
  packet: TurnPacket;
  disabled?: boolean;
  onSelect: (suggestion: CoachSuggestion) => void;
}

export function buildCoachSuggestions(packet: TurnPacket): CoachSuggestion[] {
  const affordances = packet.affordances;
  if (!affordances) {
    return [];
  }

  const topSuggested = affordances.suggestedActions.slice(0, 2).map((action) => ({
    verb: action.verb,
    targetId: action.targetId,
    reason: action.reason,
    playerText: `Intento ${tVerb(action.verb).toLowerCase()} ${action.targetId ?? 'aquí'}`
  }));

  if (topSuggested.length > 0) {
    return topSuggested;
  }

  const fallback: CoachSuggestion[] = [];
  const firstVerb = affordances.allowedVerbs[0];
  const firstHotspot = affordances.activeHotspots[0];
  const firstLocation = affordances.activeLocations[0];

  if (firstVerb && firstHotspot) {
    fallback.push({
      verb: firstVerb,
      targetId: firstHotspot,
      reason: 'Sugerencia basada en hotspot activo',
      playerText: `Probar ${tVerb(firstVerb).toLowerCase()} en ${firstHotspot}`
    });
  }

  if (affordances.allowedVerbs.includes('MOVE') && firstLocation) {
    fallback.push({
      verb: 'MOVE',
      targetId: firstLocation,
      reason: 'Moverte puede destrabar este tramo',
      playerText: `Moverme a ${firstLocation}`
    });
  }

  return fallback.slice(0, 3);
}

export function CoachPanel(props: CoachPanelProps): React.ReactElement | null {
  if (props.mode === 'off') {
    return null;
  }

  const suggestions = buildCoachSuggestions(props.packet);
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <section className="play-card tmb-frame coach-panel" aria-live="polite">
      <div className="scene-meta-row">
        <h2>Asistente</h2>
        <span className="muted">Qué podés hacer ahora</span>
      </div>
      {props.mode === 'on' ? (
        <p className="muted">
          Elegí una sugerencia o usá texto libre; siempre podés cambiar de plan.
        </p>
      ) : null}
      <div className="chip-row">
        {suggestions.map((suggestion, index) => (
          <button
            key={`${suggestion.verb}-${suggestion.targetId ?? 'none'}-${index}`}
            type="button"
            className="chip"
            disabled={props.disabled}
            onClick={() => props.onSelect(suggestion)}
          >
            {tVerb(suggestion.verb)} {tTargetLabel(suggestion.targetId)}
          </button>
        ))}
      </div>
    </section>
  );
}
