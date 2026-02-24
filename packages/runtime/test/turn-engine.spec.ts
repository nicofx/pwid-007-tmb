import type { CapsuleSchema } from '@tmb/contracts';
import { TurnEngine } from '../src/engine/turn-engine.js';
import { SessionStateFactory } from '../src/engine/session-state-factory.js';
import type { IRuntimeDeps, ITelemetrySink } from '../src/ports/interfaces.js';
import { SystemClockPolicy } from '../src/utils/clock.js';
import { SeededRngFactory } from '../src/utils/rng.js';

const capsule: CapsuleSchema = {
  schemaVersion: '1.0.0',
  capsuleId: 'c1',
  title: 'Capsule',
  synopsis: 'Synopsis',
  roles: ['reporter'],
  presets: ['default'],
  defaultRoleId: 'reporter',
  defaultPresetId: 'default',
  initial: {
    sceneId: 'scene-a',
    beatId: 'beat-a',
    locationId: 'loc-a',
    stateText: { suspicion: 10, tension: 10, clock: 0, risk: 10 }
  },
  scenes: [
    {
      id: 'scene-a',
      title: 'Scene A',
      entryText: 'Entry',
      visual: { palette: 'p', mood: 'm', backdrop: 'b' },
      locations: [{ id: 'loc-a', label: 'Loc A' }]
    }
  ],
  hotspots: [
    {
      id: 'hotspot-a',
      label: 'Hotspot A',
      locationId: 'loc-a',
      verbs: ['OBSERVE', 'SEARCH'],
      rewards: { clues: ['clue-a'] }
    }
  ],
  beats: [
    {
      id: 'beat-a',
      sceneId: 'scene-a',
      title: 'Beat A',
      allowedVerbs: ['OBSERVE', 'SEARCH'],
      activeHotspots: ['hotspot-a']
    }
  ]
};

class FakeTelemetrySink implements ITelemetrySink {
  events: unknown[] = [];

  emitSessionEvent(event: unknown): void {
    this.events.push(event);
  }

  emitTurnEvent(event: unknown): void {
    this.events.push(event);
  }
}

describe('TurnEngine invariants', () => {
  it('returns affordances unless end exists and blocks invalid actions with alternatives', async () => {
    const telemetry = new FakeTelemetrySink();
    const deps: IRuntimeDeps = {
      capsuleProvider: {
        getCapsule: async () => capsule
      },
      telemetrySink: telemetry,
      rngFactory: new SeededRngFactory(),
      clock: new SystemClockPolicy()
    };

    const engine = new TurnEngine(deps, new SessionStateFactory());
    const started = await engine.startSession({
      sessionId: 'sess-1',
      seed: 'seed-1',
      capsuleId: 'c1'
    });

    expect(started.packet.affordances).toBeDefined();
    expect(started.packet.narrativeBlocks).toEqual([]);

    const turn = await engine.processTurn({
      request: {
        sessionId: 'sess-1',
        turnId: 'turn-1',
        action: { verb: 'MOVE', targetId: 'wrong-hotspot' }
      },
      state: started.state
    });

    expect(turn.packet.outcome).toBe('BLOCKED');
    expect(turn.packet.affordances).toBeDefined();
    expect(turn.packet.affordances?.suggestedActions.length).toBeGreaterThan(0);
    expect(turn.packet.narrativeBlocks).toEqual([]);
    expect(telemetry.events.length).toBeGreaterThan(0);
  });

  it('applies hint density preset to suggested actions count', async () => {
    const telemetry = new FakeTelemetrySink();
    const deps: IRuntimeDeps = {
      capsuleProvider: {
        getCapsule: async () => capsule
      },
      telemetrySink: telemetry,
      rngFactory: new SeededRngFactory(),
      clock: new SystemClockPolicy()
    };
    const engine = new TurnEngine(deps, new SessionStateFactory());
    const started = await engine.startSession({
      sessionId: 'sess-2',
      seed: 'seed-2',
      capsuleId: 'c1',
      preset: {
        capsuleId: 'c1',
        presetId: 'hardcore',
        dials: { riskTolerance: 0.2, costSeverity: 0.8, hintDensity: 0.1, pacing: 0.5 },
        tags: [],
        clamped: false,
        clampNotes: []
      }
    });

    expect(started.packet.affordances?.suggestedActions.length).toBe(1);
  });
});
