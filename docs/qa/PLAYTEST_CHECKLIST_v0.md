# Playtest Checklist v0 (S13)

Date: February 23, 2026

## Before session

- [ ] API reachable at `http://localhost:3001/health`
- [ ] Web reachable at `http://localhost:3000/play`
- [ ] Presets load in start screen
- [ ] Scenario selector visible (`Core A/B/C`)

## During session

- [ ] Start works with demo seed
- [ ] Guidance proposes one action per turn
- [ ] Enter submits from ActionDock input
- [ ] Processing state appears during turn request
- [ ] Latency ms updates after each response
- [ ] BLOCKED helper appears with 2-4 alternatives when blocked
- [ ] Alternative chip click sends a new turn
- [ ] IU modal can be closed with Esc
- [ ] Debug drawer can be toggled and closed with Esc

## Reset / resume

- [ ] `Reset Run` starts turn 0 with same scenario/preset/seed
- [ ] Browser refresh resumes active session
- [ ] Turn history remains usable in debug

## Exit criteria

- [ ] A new player can complete 10 turns without external explanation
- [ ] No dead-end loop observed in guided flow
- [ ] No uncaught UI/API error during playtest run
