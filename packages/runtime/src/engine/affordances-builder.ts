import type { CapsuleBeat, CapsuleSchema, TurnAffordances } from '@tmb/contracts';
import type { SessionState } from '../domain/types.js';

export class AffordancesBuilder {
  buildAffordances(
    state: SessionState,
    beat: CapsuleBeat,
    capsule: CapsuleSchema,
    options?: { maxSuggestions?: number }
  ): TurnAffordances {
    const scene = capsule.scenes.find((candidate) => candidate.id === beat.sceneId);
    const maxSuggestions = Math.max(1, Math.min(4, options?.maxSuggestions ?? 4));
    const baseLocations = scene?.locations.map((location) => location.id) ?? [state.locationId];
    const locations = new Set(baseLocations);
    const hotspots = new Set(beat.activeHotspots);

    for (const location of state.locationOverrides?.enable ?? []) {
      locations.add(location);
    }
    for (const location of state.locationOverrides?.disable ?? []) {
      locations.delete(location);
    }
    for (const hotspot of state.hotspotOverrides?.enable ?? []) {
      hotspots.add(hotspot);
    }
    for (const hotspot of state.hotspotOverrides?.disable ?? []) {
      hotspots.delete(hotspot);
    }
    const activeHotspots = Array.from(hotspots);

    return {
      activeLocations: Array.from(locations),
      activeHotspots,
      allowedVerbs: beat.allowedVerbs,
      suggestedActions: activeHotspots.slice(0, maxSuggestions).map((hotspotId) => {
        const hotspot = capsule.hotspots.find((candidate) => candidate.id === hotspotId);
        const verb = hotspot?.verbs.find((candidate) => beat.allowedVerbs.includes(candidate));
        return {
          verb: verb ?? beat.allowedVerbs[0] ?? 'OBSERVE',
          targetId: hotspot?.id,
          reason: hotspot ? `Focus on ${hotspot.label}` : 'Explore the current beat'
        };
      })
    };
  }
}
