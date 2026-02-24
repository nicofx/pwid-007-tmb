import {
  DIAL_REGISTRY,
  clampPreset,
  validateCapsuleSchema,
  validatePreset,
  validateWorldEventCatalog,
  type CapsuleSchema,
  type PresetDials
} from '@tmb/contracts';
import type { LintIssue } from './types.js';

function issue(
  severity: 'ERROR' | 'WARN',
  code: string,
  message: string,
  path: string,
  suggestion: string
): LintIssue {
  return { severity, code, message, path, suggestion };
}

function countById(ids: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const id of ids) {
    map.set(id, (map.get(id) ?? 0) + 1);
  }
  return map;
}

function collectKnownIds(capsule: CapsuleSchema) {
  const sceneIds = new Set(capsule.scenes.map((scene) => scene.id));
  const beatIds = new Set(capsule.beats.map((beat) => beat.id));
  const hotspotIds = new Set(capsule.hotspots.map((hotspot) => hotspot.id));
  const locationIds = new Set(
    capsule.scenes.flatMap((scene) => scene.locations.map((location) => location.id))
  );
  const clueIds = new Set(capsule.hotspots.flatMap((hotspot) => hotspot.rewards?.clues ?? []));
  const leverageIds = new Set(
    capsule.hotspots.flatMap((hotspot) => hotspot.rewards?.leverage ?? [])
  );
  const npcIds = new Set<string>([
    ...Object.keys(capsule.initial.stateText.trustByNpc ?? {}),
    ...capsule.hotspots.map((hotspot) => hotspot.id)
  ]);

  return {
    sceneIds,
    beatIds,
    hotspotIds,
    locationIds,
    clueIds,
    leverageIds,
    npcIds
  };
}

export function validateSchema(raw: unknown): { capsule?: CapsuleSchema; issues: LintIssue[] } {
  const parsed = validateCapsuleSchema(raw);
  if (parsed.ok) {
    return { capsule: parsed.value, issues: [] };
  }

  return {
    issues: parsed.issues.map((schemaIssue) =>
      issue(
        'ERROR',
        'CAPSULE_SCHEMA_INVALID',
        schemaIssue.message,
        schemaIssue.path,
        'Fix the capsule JSON shape to match docs/foundation/04_capsule_schema.md.'
      )
    )
  };
}

export function validateReferentialIntegrity(capsule: CapsuleSchema): LintIssue[] {
  const issues: LintIssue[] = [];
  const ids = collectKnownIds(capsule);

  for (const [kind, values] of [
    ['scene', capsule.scenes.map((scene) => scene.id)],
    ['beat', capsule.beats.map((beat) => beat.id)],
    ['hotspot', capsule.hotspots.map((hotspot) => hotspot.id)],
    ['location', capsule.scenes.flatMap((scene) => scene.locations.map((location) => location.id))]
  ] as const) {
    const counts = countById(values);
    for (const [id, count] of counts.entries()) {
      if (count > 1) {
        issues.push(
          issue(
            'ERROR',
            'DUPLICATE_ID',
            `Duplicate ${kind} id "${id}" (${count} occurrences).`,
            `${kind}s`,
            `Keep each ${kind} id unique.`
          )
        );
      }
    }
  }

  if (!ids.sceneIds.has(capsule.initial.sceneId)) {
    issues.push(
      issue(
        'ERROR',
        'MISSING_REF',
        `initial.sceneId "${capsule.initial.sceneId}" does not exist.`,
        'initial.sceneId',
        'Point initial.sceneId to an existing scene id.'
      )
    );
  }

  if (!ids.beatIds.has(capsule.initial.beatId)) {
    issues.push(
      issue(
        'ERROR',
        'MISSING_REF',
        `initial.beatId "${capsule.initial.beatId}" does not exist.`,
        'initial.beatId',
        'Point initial.beatId to an existing beat id.'
      )
    );
  }

  if (!ids.locationIds.has(capsule.initial.locationId)) {
    issues.push(
      issue(
        'ERROR',
        'MISSING_REF',
        `initial.locationId "${capsule.initial.locationId}" does not exist.`,
        'initial.locationId',
        'Point initial.locationId to an existing location id.'
      )
    );
  }

  capsule.hotspots.forEach((hotspot, index) => {
    if (!ids.locationIds.has(hotspot.locationId)) {
      issues.push(
        issue(
          'ERROR',
          'MISSING_REF',
          `Hotspot "${hotspot.id}" references unknown location "${hotspot.locationId}".`,
          `hotspots.${index}.locationId`,
          'Use a location id declared in scene.locations.'
        )
      );
    }
  });

  capsule.beats.forEach((beat, beatIndex) => {
    if (!ids.sceneIds.has(beat.sceneId)) {
      issues.push(
        issue(
          'ERROR',
          'MISSING_REF',
          `Beat "${beat.id}" references unknown scene "${beat.sceneId}".`,
          `beats.${beatIndex}.sceneId`,
          'Set beat.sceneId to an existing scene id.'
        )
      );
    }

    beat.activeHotspots.forEach((hotspotId, hotspotIndex) => {
      if (!ids.hotspotIds.has(hotspotId)) {
        issues.push(
          issue(
            'ERROR',
            'MISSING_REF',
            `Beat "${beat.id}" references unknown hotspot "${hotspotId}".`,
            `beats.${beatIndex}.activeHotspots.${hotspotIndex}`,
            'Use hotspot ids declared in capsule.hotspots.'
          )
        );
      }
    });

    beat.advanceRules?.forEach((rule, ruleIndex) => {
      if (!ids.beatIds.has(rule.nextBeatId)) {
        issues.push(
          issue(
            'ERROR',
            'MISSING_REF',
            `Beat "${beat.id}" advances to unknown beat "${rule.nextBeatId}".`,
            `beats.${beatIndex}.advanceRules.${ruleIndex}.nextBeatId`,
            'Set advanceRules.nextBeatId to an existing beat id.'
          )
        );
      }
    });
  });

  return issues;
}

export function validateGameplayInvariants(capsule: CapsuleSchema): LintIssue[] {
  const issues: LintIssue[] = [];

  capsule.scenes.forEach((scene, index) => {
    const sceneBeats = capsule.beats.filter((beat) => beat.sceneId === scene.id);
    if (sceneBeats.length === 0) {
      issues.push(
        issue(
          'WARN',
          'SCENE_EMPTY',
          `Scene "${scene.id}" has no beats.`,
          `scenes.${index}.id`,
          'Attach at least one beat to this scene.'
        )
      );
    }

    if (!scene.entryText || scene.entryText.trim().length === 0) {
      issues.push(
        issue(
          'WARN',
          'SCENE_EMPTY',
          `Scene "${scene.id}" has empty entryText.`,
          `scenes.${index}.entryText`,
          'Provide a short scene entry text.'
        )
      );
    }
  });

  capsule.beats.forEach((beat, index) => {
    if (beat.allowedVerbs.length === 0) {
      issues.push(
        issue(
          'ERROR',
          'EMPTY_AFFORDANCES',
          `Beat "${beat.id}" has no allowedVerbs.`,
          `beats.${index}.allowedVerbs`,
          'Provide at least one allowed verb for each beat.'
        )
      );
    }

    if (beat.activeHotspots.length === 0 && !beat.end) {
      issues.push(
        issue(
          'ERROR',
          'NO_OPTIONS_DEAD_END',
          `Beat "${beat.id}" has no activeHotspots and no end.`,
          `beats.${index}`,
          'Provide activeHotspots, an IU route, or an end condition.'
        )
      );
    }

    if (beat.activeHotspots.length <= 1 && !beat.end) {
      issues.push(
        issue(
          'WARN',
          'EMPTY_AFFORDANCES',
          `Beat "${beat.id}" has limited choices (${beat.activeHotspots.length} hotspot).`,
          `beats.${index}.activeHotspots`,
          'Consider adding alternatives to reduce dead-end feel.'
        )
      );
    }
  });

  return issues;
}

function validatePresetDialShape(
  dials: unknown,
  pathPrefix: string,
  knownDials: ReadonlySet<string>
): LintIssue[] {
  const issues: LintIssue[] = [];
  if (!dials || typeof dials !== 'object') {
    return issues;
  }

  for (const key of Object.keys(dials as Record<string, unknown>)) {
    if (!knownDials.has(key)) {
      issues.push(
        issue(
          'WARN',
          'UNKNOWN_DIAL',
          `Unknown dial "${key}" will be ignored.`,
          `${pathPrefix}.${key}`,
          'Use supported dials: riskTolerance, costSeverity, hintDensity, pacing.'
        )
      );
    }
  }

  return issues;
}

export function validatePresets(
  capsule: CapsuleSchema,
  presetFileData?: unknown,
  presetFilePath?: string
): LintIssue[] {
  const issues: LintIssue[] = [];
  if (!presetFileData) {
    issues.push(
      issue(
        'WARN',
        'PRESET_INVALID',
        `No preset file found for capsule "${capsule.capsuleId}".`,
        presetFilePath ?? 'capsules/presets',
        'Add docs/foundation/capsules/presets/<capsuleId>.presets.json.'
      )
    );
    return issues;
  }

  if (!Array.isArray(presetFileData)) {
    issues.push(
      issue(
        'ERROR',
        'PRESET_INVALID',
        'Preset file must contain an array.',
        presetFilePath ?? 'capsules/presets',
        'Wrap presets in a JSON array.'
      )
    );
    return issues;
  }

  const knownDials = new Set<keyof PresetDials>(
    Object.keys(DIAL_REGISTRY) as Array<keyof PresetDials>
  );
  const declaredPresetIds = new Set(capsule.presets);

  presetFileData.forEach((entry, index) => {
    issues.push(
      ...validatePresetDialShape(
        (entry as { dials?: unknown })?.dials,
        `presets.${index}.dials`,
        knownDials
      )
    );

    const validated = validatePreset(entry);
    if (!validated.ok) {
      issues.push(
        issue(
          'ERROR',
          'PRESET_INVALID',
          validated.error,
          `presets.${index}`,
          'Fix preset schema: id/label/description/dials/tags.'
        )
      );
      return;
    }

    const clamped = clampPreset(validated.value);
    if (clamped.clamped) {
      issues.push(
        issue(
          'WARN',
          'PRESET_CLAMPED',
          `Preset "${validated.value.id}" dials were clamped (${clamped.clampNotes.join(', ')}).`,
          `presets.${index}.dials`,
          'Keep dial values in [0..1] to avoid implicit clamp.'
        )
      );
    }

    if (!declaredPresetIds.has(validated.value.id)) {
      issues.push(
        issue(
          'WARN',
          'INVALID_TARGET',
          `Preset "${validated.value.id}" exists in file but is not listed in capsule.presets.`,
          `presets.${index}.id`,
          'Add the preset id to capsule.presets or remove the unused preset.'
        )
      );
    }
  });

  for (const presetId of capsule.presets) {
    const exists = presetFileData.some(
      (entry) =>
        typeof entry === 'object' && entry !== null && (entry as { id?: unknown }).id === presetId
    );
    if (!exists) {
      issues.push(
        issue(
          'ERROR',
          'MISSING_REF',
          `capsule.presets includes "${presetId}" but preset file is missing it.`,
          'capsule.presets',
          'Add this preset to the presets file or remove from capsule.presets.'
        )
      );
    }
  }

  return issues;
}

export function validateWorldEvents(capsule: CapsuleSchema): LintIssue[] {
  const issues: LintIssue[] = [];
  if (!capsule.worldEvents) {
    return issues;
  }

  const schemaCheck = validateWorldEventCatalog(capsule.worldEvents);
  if (!schemaCheck.ok) {
    issues.push(
      issue(
        'ERROR',
        'EVENT_SCHEMA_INVALID',
        schemaCheck.error,
        'worldEvents',
        'Fix worldEvents shape to match contracts world-events schema.'
      )
    );
    return issues;
  }

  const ids = collectKnownIds(capsule);

  for (const [eventIndex, eventDef] of capsule.worldEvents.events.entries()) {
    for (const [idx, beatId] of (eventDef.allowedBeats ?? []).entries()) {
      if (!ids.beatIds.has(beatId)) {
        issues.push(
          issue(
            'ERROR',
            'EVENT_UNKNOWN_ID',
            `Event "${eventDef.eventId}" references unknown beat "${beatId}".`,
            `worldEvents.events.${eventIndex}.allowedBeats.${idx}`,
            'Use an existing beat id.'
          )
        );
      }
    }

    for (const [idx, sceneId] of (eventDef.allowedScenes ?? []).entries()) {
      if (!ids.sceneIds.has(sceneId)) {
        issues.push(
          issue(
            'ERROR',
            'EVENT_UNKNOWN_ID',
            `Event "${eventDef.eventId}" references unknown scene "${sceneId}".`,
            `worldEvents.events.${eventIndex}.allowedScenes.${idx}`,
            'Use an existing scene id.'
          )
        );
      }
    }

    for (const condition of eventDef.triggers.allOf) {
      if (condition.kind === 'beat') {
        if (condition.beatId && !ids.beatIds.has(condition.beatId)) {
          issues.push(
            issue(
              'ERROR',
              'EVENT_UNKNOWN_ID',
              `Event "${eventDef.eventId}" trigger uses unknown beat "${condition.beatId}".`,
              `worldEvents.events.${eventIndex}.triggers.allOf`,
              'Use an existing beat id in trigger conditions.'
            )
          );
        }
        if (condition.sceneId && !ids.sceneIds.has(condition.sceneId)) {
          issues.push(
            issue(
              'ERROR',
              'EVENT_UNKNOWN_ID',
              `Event "${eventDef.eventId}" trigger uses unknown scene "${condition.sceneId}".`,
              `worldEvents.events.${eventIndex}.triggers.allOf`,
              'Use an existing scene id in trigger conditions.'
            )
          );
        }
      }
      if (
        condition.kind === 'preset' &&
        condition.requiredTag === undefined &&
        condition.dial === undefined
      ) {
        issues.push(
          issue(
            'WARN',
            'EVENT_TRIGGER_NOT_SUPPORTED',
            `Event "${eventDef.eventId}" has a preset trigger without dial/tag filter.`,
            `worldEvents.events.${eventIndex}.triggers.allOf`,
            'Provide requiredTag or dial/op/value so the trigger is actionable.'
          )
        );
      }
    }

    for (const hotspotId of eventDef.effects.toggleHotspots?.enable ?? []) {
      if (!ids.hotspotIds.has(hotspotId)) {
        issues.push(
          issue(
            'ERROR',
            'EVENT_UNKNOWN_ID',
            `Event "${eventDef.eventId}" enables unknown hotspot "${hotspotId}".`,
            `worldEvents.events.${eventIndex}.effects.toggleHotspots.enable`,
            'Use hotspot ids declared in capsule.hotspots.'
          )
        );
      }
    }

    for (const hotspotId of eventDef.effects.toggleHotspots?.disable ?? []) {
      if (!ids.hotspotIds.has(hotspotId)) {
        issues.push(
          issue(
            'ERROR',
            'EVENT_UNKNOWN_ID',
            `Event "${eventDef.eventId}" disables unknown hotspot "${hotspotId}".`,
            `worldEvents.events.${eventIndex}.effects.toggleHotspots.disable`,
            'Use hotspot ids declared in capsule.hotspots.'
          )
        );
      }
    }

    for (const locationId of eventDef.effects.toggleLocations?.enable ?? []) {
      if (!ids.locationIds.has(locationId)) {
        issues.push(
          issue(
            'ERROR',
            'EVENT_UNKNOWN_ID',
            `Event "${eventDef.eventId}" enables unknown location "${locationId}".`,
            `worldEvents.events.${eventIndex}.effects.toggleLocations.enable`,
            'Use location ids declared in scene.locations.'
          )
        );
      }
    }

    for (const locationId of eventDef.effects.toggleLocations?.disable ?? []) {
      if (!ids.locationIds.has(locationId)) {
        issues.push(
          issue(
            'ERROR',
            'EVENT_UNKNOWN_ID',
            `Event "${eventDef.eventId}" disables unknown location "${locationId}".`,
            `worldEvents.events.${eventIndex}.effects.toggleLocations.disable`,
            'Use location ids declared in scene.locations.'
          )
        );
      }
    }

    for (const npcId of eventDef.effects.npcsDelta?.add ?? []) {
      if (!ids.npcIds.has(npcId)) {
        issues.push(
          issue(
            'ERROR',
            'EVENT_UNKNOWN_ID',
            `Event "${eventDef.eventId}" adds unknown npc "${npcId}".`,
            `worldEvents.events.${eventIndex}.effects.npcsDelta.add`,
            'Use an npc id already present in trustByNpc or known capsule entities.'
          )
        );
      }
    }

    for (const npcId of eventDef.effects.npcsDelta?.remove ?? []) {
      if (!ids.npcIds.has(npcId)) {
        issues.push(
          issue(
            'ERROR',
            'EVENT_UNKNOWN_ID',
            `Event "${eventDef.eventId}" removes unknown npc "${npcId}".`,
            `worldEvents.events.${eventIndex}.effects.npcsDelta.remove`,
            'Use an npc id already present in trustByNpc or known capsule entities.'
          )
        );
      }
    }

    for (const clueId of eventDef.effects.addClue ?? []) {
      if (!ids.clueIds.has(clueId)) {
        issues.push(
          issue(
            'WARN',
            'EVENT_TRIGGER_NOT_SUPPORTED',
            `Event "${eventDef.eventId}" introduces clue "${clueId}" not present in hotspot rewards.`,
            `worldEvents.events.${eventIndex}.effects.addClue`,
            'Define clue ids in canonical content lists to tighten static validation.'
          )
        );
      }
    }

    for (const leverageId of eventDef.effects.addLeverage ?? []) {
      if (!ids.leverageIds.has(leverageId)) {
        issues.push(
          issue(
            'WARN',
            'EVENT_TRIGGER_NOT_SUPPORTED',
            `Event "${eventDef.eventId}" introduces leverage "${leverageId}" not present in hotspot rewards.`,
            `worldEvents.events.${eventIndex}.effects.addLeverage`,
            'Define leverage ids in canonical content lists to tighten static validation.'
          )
        );
      }
    }
  }

  return issues;
}
