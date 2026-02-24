import type { ActionVerb, TurnPacket } from '@tmb/contracts';
import type { PlayScenario } from '@/lib/scenarios';
import { Button } from '@/components/ui/Button';
import { tTargetLabel } from '@/lib/i18n-content';
import { tVerb } from '@/lib/i18n-game';

export interface GuidanceSuggestion {
  verb: ActionVerb;
  targetId?: string;
  playerText: string;
  reason: string;
}

interface GuidancePanelProps {
  scenario: PlayScenario;
  packet: TurnPacket;
  turnNumber: number;
  disabled?: boolean;
  onTry: (suggestion: GuidanceSuggestion) => void;
}

export function buildGuidanceSuggestion(params: {
  scenario: PlayScenario;
  packet: TurnPacket;
  turnNumber: number;
}): GuidanceSuggestion | null {
  const affordances = params.packet.affordances;
  if (!affordances) {
    return null;
  }

  const scenarioStep = params.scenario.steps[params.turnNumber] ?? params.scenario.steps.at(-1);
  if (
    scenarioStep &&
    affordances.allowedVerbs.includes(scenarioStep.verb) &&
    (!scenarioStep.targetId ||
      affordances.activeHotspots.includes(scenarioStep.targetId) ||
      affordances.activeLocations.includes(scenarioStep.targetId))
  ) {
    return {
      verb: scenarioStep.verb,
      targetId: scenarioStep.targetId,
      playerText: scenarioStep.playerText,
      reason: `Paso del escenario: ${scenarioStep.note}`
    };
  }

  const chip = affordances.suggestedActions[0];
  if (chip) {
    return {
      verb: chip.verb,
      targetId: chip.targetId,
      playerText: `Probar ${tVerb(chip.verb).toLowerCase()} ${chip.targetId ?? 'aquí'}`,
      reason: chip.reason
    };
  }

  const fallbackVerb = affordances.allowedVerbs[0];
  if (!fallbackVerb) {
    return null;
  }

  const fallbackTarget = affordances.activeHotspots[0] ?? affordances.activeLocations[0];
  return {
    verb: fallbackVerb,
    targetId: fallbackTarget,
    playerText: `Probar ${tVerb(fallbackVerb).toLowerCase()} ${fallbackTarget ?? 'aquí'}`,
    reason: 'Sugerencia de respaldo según opciones disponibles'
  };
}

export function GuidancePanel(props: GuidancePanelProps): React.ReactElement | null {
  const suggestion = buildGuidanceSuggestion({
    scenario: props.scenario,
    packet: props.packet,
    turnNumber: props.turnNumber
  });

  if (!suggestion) {
    return null;
  }

  return (
    <section className="play-card tmb-frame guidance-panel">
      <h2>Juego guiado</h2>
      <p className="muted">{props.scenario.label}</p>
      <p>
        Recomendado: <strong>{tVerb(suggestion.verb)}</strong>{' '}
        {suggestion.targetId ? <code>{tTargetLabel(suggestion.targetId)}</code> : <span>contexto actual</span>}
      </p>
      <p className="muted">{suggestion.reason}</p>
      <Button
        type="button"
        disabled={props.disabled}
        variant="secondary"
        onClick={() => props.onTry(suggestion)}
        suppressHydrationWarning
      >
        Probar esto
      </Button>
    </section>
  );
}
