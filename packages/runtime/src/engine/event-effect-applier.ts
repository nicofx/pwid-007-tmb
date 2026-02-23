import type {
  CapsuleSchema,
  TurnAffordances,
  TurnDeltas,
  WorldEventDefinition
} from '@tmb/contracts';
import type { SessionState } from '../domain/types.js';

interface ApplyEffectsResult {
  state: SessionState;
  affordances?: TurnAffordances;
  deltas: TurnDeltas;
  eventBlock: { kind: 'EVENT'; text: string };
  compensationUsed: boolean;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export class EventEffectApplier {
  apply(params: {
    event: WorldEventDefinition;
    state: SessionState;
    capsule: CapsuleSchema;
    affordances?: TurnAffordances;
    deltas: TurnDeltas;
  }): ApplyEffectsResult {
    const { event, state, capsule, affordances, deltas } = params;
    const nextState: SessionState = {
      ...state,
      leverage: new Set(state.leverage),
      clues: new Set(state.clues),
      hotspotOverrides: {
        enable: [...(state.hotspotOverrides?.enable ?? [])],
        disable: [...(state.hotspotOverrides?.disable ?? [])]
      },
      locationOverrides: {
        enable: [...(state.locationOverrides?.enable ?? [])],
        disable: [...(state.locationOverrides?.disable ?? [])]
      },
      stateText: { ...state.stateText, trustByNpc: { ...(state.stateText.trustByNpc ?? {}) } }
    };

    const eventDeltas: TurnDeltas = { ...deltas, state: { ...(deltas.state ?? {}) } };
    const stateDelta = event.effects.stateDelta ?? {};
    if (stateDelta.suspicion !== undefined) {
      eventDeltas.state!.suspicion = clamp(
        (eventDeltas.state!.suspicion ?? state.stateText.suspicion) + stateDelta.suspicion
      );
    }
    if (stateDelta.tension !== undefined) {
      eventDeltas.state!.tension = clamp(
        (eventDeltas.state!.tension ?? state.stateText.tension) + stateDelta.tension
      );
    }
    if (stateDelta.clock !== undefined) {
      eventDeltas.state!.clock = clamp(
        (eventDeltas.state!.clock ?? state.stateText.clock) + stateDelta.clock
      );
    }
    if (stateDelta.risk !== undefined) {
      eventDeltas.state!.risk = clamp(
        (eventDeltas.state!.risk ?? state.stateText.risk) + stateDelta.risk
      );
    }

    for (const clue of event.effects.addClue ?? []) {
      nextState.clues.add(clue);
    }
    if ((event.effects.addClue ?? []).length > 0) {
      eventDeltas.cluesAdded = [
        ...new Set([...(eventDeltas.cluesAdded ?? []), ...(event.effects.addClue ?? [])])
      ];
    }

    for (const leverage of event.effects.addLeverage ?? []) {
      nextState.leverage.add(leverage);
    }
    if ((event.effects.addLeverage ?? []).length > 0) {
      eventDeltas.leverageAdded = [
        ...new Set([...(eventDeltas.leverageAdded ?? []), ...(event.effects.addLeverage ?? [])])
      ];
    }

    for (const npc of event.effects.npcsDelta?.add ?? []) {
      nextState.stateText.trustByNpc![npc] = nextState.stateText.trustByNpc?.[npc] ?? 0;
    }
    for (const npc of event.effects.npcsDelta?.remove ?? []) {
      delete nextState.stateText.trustByNpc?.[npc];
    }

    nextState.hotspotOverrides!.enable = uniq([
      ...(nextState.hotspotOverrides?.enable ?? []),
      ...(event.effects.toggleHotspots?.enable ?? [])
    ]);
    nextState.hotspotOverrides!.disable = uniq([
      ...(nextState.hotspotOverrides?.disable ?? []),
      ...(event.effects.toggleHotspots?.disable ?? [])
    ]);
    nextState.locationOverrides!.enable = uniq([
      ...(nextState.locationOverrides?.enable ?? []),
      ...(event.effects.toggleLocations?.enable ?? [])
    ]);
    nextState.locationOverrides!.disable = uniq([
      ...(nextState.locationOverrides?.disable ?? []),
      ...(event.effects.toggleLocations?.disable ?? [])
    ]);

    if (eventDeltas.state && Object.keys(eventDeltas.state).length > 0) {
      nextState.stateText = {
        ...nextState.stateText,
        suspicion: eventDeltas.state.suspicion ?? nextState.stateText.suspicion,
        tension: eventDeltas.state.tension ?? nextState.stateText.tension,
        clock: eventDeltas.state.clock ?? nextState.stateText.clock,
        risk: eventDeltas.state.risk ?? nextState.stateText.risk
      };
    }

    const nextAffordances = this.applyAffordanceToggles(affordances, nextState, capsule);
    const compensationUsed = this.hasCompensation(event, eventDeltas, nextAffordances);

    return {
      state: nextState,
      affordances: nextAffordances,
      deltas: eventDeltas,
      eventBlock: {
        kind: 'EVENT',
        text: event.diegeticTextTemplate
      },
      compensationUsed
    };
  }

  private applyAffordanceToggles(
    affordances: TurnAffordances | undefined,
    state: SessionState,
    capsule: CapsuleSchema
  ): TurnAffordances | undefined {
    if (!affordances) {
      return affordances;
    }

    const allLocations = new Set(affordances.activeLocations);
    for (const location of state.locationOverrides?.enable ?? []) {
      allLocations.add(location);
    }
    for (const location of state.locationOverrides?.disable ?? []) {
      allLocations.delete(location);
    }

    const allHotspots = new Set(affordances.activeHotspots);
    for (const hotspot of state.hotspotOverrides?.enable ?? []) {
      allHotspots.add(hotspot);
    }
    for (const hotspot of state.hotspotOverrides?.disable ?? []) {
      allHotspots.delete(hotspot);
    }

    const activeHotspots = Array.from(allHotspots).filter((hotspotId) =>
      capsule.hotspots.some((hotspot) => hotspot.id === hotspotId)
    );
    const activeLocations = Array.from(allLocations).filter((locationId) =>
      capsule.scenes.some((scene) => scene.locations.some((location) => location.id === locationId))
    );

    const suggestedActions = affordances.suggestedActions.filter(
      (action) => !action.targetId || activeHotspots.includes(action.targetId)
    );

    return {
      ...affordances,
      activeHotspots,
      activeLocations,
      suggestedActions
    };
  }

  private hasCompensation(
    event: WorldEventDefinition,
    deltas: TurnDeltas,
    affordances?: TurnAffordances
  ): boolean {
    if (event.flavor !== 'friction') {
      return true;
    }
    if (event.fairnessCompensation) {
      return true;
    }
    if ((deltas.cluesAdded ?? []).length > 0 || (deltas.leverageAdded ?? []).length > 0) {
      return true;
    }
    return (affordances?.suggestedActions.length ?? 0) > 0;
  }
}

function uniq(values: string[]): string[] {
  return Array.from(new Set(values));
}
