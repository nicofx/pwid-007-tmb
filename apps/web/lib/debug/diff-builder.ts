import type { TurnPacket } from '@tmb/contracts';

export interface DebugDiff {
  state: Array<{
    key: 'suspicion' | 'tension' | 'clock' | 'risk';
    from: number;
    to: number;
    delta: number;
  }>;
  cluesAdded: string[];
  cluesRemoved: string[];
  leverageAdded: string[];
  leverageRemoved: string[];
  inventoryAdded: string[];
  inventoryRemoved: string[];
  hotspotsAdded: string[];
  hotspotsRemoved: string[];
  locationsAdded: string[];
  locationsRemoved: string[];
}

const stateKeys = ['suspicion', 'tension', 'clock', 'risk'] as const;

export function buildTurnDiff(prev: TurnPacket | null, current: TurnPacket): DebugDiff {
  const state = stateKeys.map((key) => {
    const from = prev?.stateText[key] ?? current.stateText[key];
    const to = current.stateText[key];
    return { key, from, to, delta: to - from };
  });

  return {
    state,
    cluesAdded: current.deltas?.cluesAdded ?? [],
    cluesRemoved: [],
    leverageAdded: current.deltas?.leverageAdded ?? [],
    leverageRemoved: [],
    inventoryAdded: current.deltas?.inventoryAdded ?? [],
    inventoryRemoved: [],
    hotspotsAdded: difference(
      current.affordances?.activeHotspots ?? [],
      prev?.affordances?.activeHotspots ?? []
    ),
    hotspotsRemoved: difference(
      prev?.affordances?.activeHotspots ?? [],
      current.affordances?.activeHotspots ?? []
    ),
    locationsAdded: difference(
      current.affordances?.activeLocations ?? [],
      prev?.affordances?.activeLocations ?? []
    ),
    locationsRemoved: difference(
      prev?.affordances?.activeLocations ?? [],
      current.affordances?.activeLocations ?? []
    )
  };
}

function difference(left: string[], right: string[]): string[] {
  const rightSet = new Set(right);
  return left.filter((item) => !rightSet.has(item));
}
