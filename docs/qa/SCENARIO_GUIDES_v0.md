# Scenario Guides v0 (S13)

Date: February 23, 2026

These are player-facing guided routes used by the `Guided Play` panel.

## Core A - Stealth Escape

- Intent: low-noise progression to exit with proof.
- Recommended preset: `guided`.
- Typical first steps:

1. `OBSERVE -> courier-contact`
2. `TALK -> officer`
3. `SEARCH -> service-door`
4. `MOVE -> service-door`
5. `SEARCH -> records-ledger`

## Core B - Social Route

- Intent: progress by conversation and social leverage.
- Recommended preset: `default`.
- Typical first steps:

1. `TALK -> officer`
2. `TALK -> courier-contact`
3. `OBSERVE -> service-door`
4. `MOVE -> service-door`

## Core C - Investigative

- Intent: maximize clue discovery.
- Recommended preset: `guided`.
- Typical first steps:

1. `SEARCH -> archive-lock`
2. `SEARCH -> records-ledger`
3. `SEARCH -> filing-cabinet`
4. `OBSERVE -> tram-platform`

## Guidance fallback policy

If scenario step is not currently executable:

1. Use `affordances.suggestedActions[0]`.
2. If empty, choose first allowed verb + first active hotspot/location.
3. If no affordances, hide guidance.
