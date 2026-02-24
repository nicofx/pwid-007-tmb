# Preset QA Guide v0

Date: February 23, 2026

## Goal

Validate that Berlin 1933 presets produce deterministic and observable runtime differences without breaking turn flow.

## Presets Under Test

- `default`
- `guided`
- `hardcore`
- `chaos-lite`

## Preconditions

1. `docker compose up -d`
2. `pnpm dev`
3. API reachable at `http://localhost:3001`

## Automated Smoke

Run:

```bash
pnpm qa:presets
```

What it does:

1. Calls `GET /sessions/presets/berlin-1933`.
2. Starts one session per preset.
3. Runs up to 10 scripted turns per preset.
4. Asserts:

- no HTTP 500
- packet shape remains valid (`packet` always present)
- non-ending turns keep affordances + allowed verbs

Expected runtime:

- under 90 seconds local.

## Manual Comparison Checklist

For each preset, compare:

1. Outcome distribution (`SUCCESS/PARTIAL/FAIL_FORWARD/BLOCKED`)
2. Delta magnitude trend (`suspicion/tension/clock/risk`)
3. Suggested action density (`suggestion_count`)
4. Ending reached vs fail-forward path

## Telemetry Fields to Inspect

In `telemetry_events` (`source=server`, event `turn_processed`):

- `presetId`
- `outcome_kind`
- `suggestion_count`
- `delta_magnitude`
- `variability_tags`

In `telemetry_events` (`eventName=variability_applied`):

- dial summary per turn (`dials`)
- `presetId`

## Failure Triage

1. If preset start fails:

- verify preset id exists in `docs/foundation/capsules/presets/berlin-1933.presets.json`
- run `pnpm capsule:lint -- --capsule berlin-1933`

2. If turn flow breaks:

- inspect last packet in Debug Drawer raw tab
- check `turn_processed` payload for missing affordances

3. If differences are not observable:

- compare `variability_applied.dials` and `turn_processed.suggestion_count`
- verify runtime is using intended preset (`resume` payload includes `presetId`)
