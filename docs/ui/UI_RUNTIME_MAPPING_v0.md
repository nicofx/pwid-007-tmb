# UI Runtime Mapping v0

## TurnPacket -> Componentes

- `scene.sceneTitle`, `scene.beatTitle`, `scene.sceneId/beatId` -> `SceneHeader`
- `visual.backdrop`, `visual.mood` -> `AssetRegistry` -> `VisualStage`
- `narrativeBlocks[]` -> `RendererRegistry` -> `NarrativeFeed`
- `stateText.*`, `stateText.trustByNpc` -> `StatePanel`
- `affordances.activeHotspots` -> `HotspotPanel`
- `affordances.activeLocations` + `allowedVerbs` -> `MiniMap`
- `affordances.allowedVerbs`, `suggestedActions` -> `ActionDock`
- `activeIU` -> `IuModal`
- `end` -> `EndingPostal`

## Registros y extensiones

- `renderers/renderer-registry.tsx`: agregar nuevo tipo de `NarrativeBlock`.
- `lib/assetRegistry.ts`: agregar mapeo de claves visuales.
- `viewmodels/turn-packet-vm.ts`: aisla fallbacks y normalización para UI.

## Convenciones

- Fallo de claves visuales: fallback + evento `visual_key_unknown`.
- Sin hotspots metadata UI: no overlay, se usa panel clickable.
- Debug overlay activable con `?debug=1`.
