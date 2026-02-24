# Berlin 1933 Gap Notes v0

Date: February 23, 2026

Scope: content-only pass for current runtime subset (no new mechanics).

## Runtime/Schema Support Audit

| Area                                                                   | Capsule Usage                                                          | Runtime Support                                                               | Status | Decision                                                                  |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------- |
| Scenes/Beats/Hotspots core schema                                      | Uses full capsule structure (`scenes`, `beats`, `hotspots`, `initial`) | Supported by loader + contracts + engine                                      | ✅     | Keep schema baseline, expand content only                                 |
| `entryText` for guidance                                               | Used in scenes and beats with objective phrasing                       | Used by narrative placeholder context; not shown as dedicated objective field | 🟡     | Encode objective intent in `beat.entryText` and `suggestedActions.reason` |
| `allowedVerbs` + `activeHotspots`                                      | Used on every beat                                                     | Fully supported by `BeatValidator` + `AffordancesBuilder`                     | ✅     | Ensure >=2 hotspots/options per beat                                      |
| `advanceRules.onOutcomes` + `clockAtLeast`                             | Used to pace progression                                               | Supported subset in `BeatProgression`                                         | ✅     | Keep transitions within supported subset only                             |
| `end.conditions` (`clockAtLeast`, `requiresClues`, `requiresLeverage`) | Used for main ending                                                   | Supported by `BeatProgression.conditionsSatisfied`                            | ✅     | Use these as primary ending gates                                         |
| Multiple endings                                                       | Implemented as separate ending beats                                   | Supported (one `end` per beat, many beats)                                    | ✅     | Keep `clean-exit` and `caught-at-gate` endings                            |
| Active IU decision points                                              | Not encoded in capsule currently                                       | Packet supports `activeIU`; runtime does not generate from capsule yet        | ❌     | Mark `NOT_SUPPORTED_YET` and avoid blocking on IU in S09                  |
| Presets list (`default/guided/hardcore/chaos-lite`)                    | Declared in capsule + file presets                                     | Supported via preset provider and variability applier                         | ✅     | Keep all 4 aligned                                                        |
| World events catalog                                                   | 8 events with triggers/effects                                         | Supported v0 by WED + effect applier                                          | ✅     | Keep references aligned to new beat ids                                   |
| Suggested actions quality                                              | Derived from hotspot labels and verbs                                  | Supported by `AffordancesBuilder`                                             | 🟡     | Improve hotspot labels + beat composition (content-assisted)              |

## Mismatches Resolved in S09

1. Low-options beat in old `infiltration` (single hotspot).

- Resolution: expanded to multi-hotspot beats and 8-beat flow.

2. Preset mismatch warning (`guided` existed in preset file but not capsule list).

- Resolution: capsule now declares `default`, `guided`, `hardcore`, `chaos-lite`.

3. Short progression with limited route variety.

- Resolution: expanded to 3 scenes / 8 beats with clear bridge beats and dual ending outcomes.

## Explicit Not Supported Yet

- IU triggers generated from capsule content are not supported in runtime pipeline.
- Static capsule lint does not simulate probabilistic outcomes; it validates structure and static invariants only.
