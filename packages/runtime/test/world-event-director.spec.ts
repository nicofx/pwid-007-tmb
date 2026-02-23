import type { CapsuleSchema, WorldEventDefinition } from '@tmb/contracts';
import { SeededRngFactory } from '../src/utils/rng.js';
import { WorldEventDirector } from '../src/engine/world-event-director.js';
import type { SessionState, TurnContext } from '../src/domain/types.js';

const baseEvent = (partial: Partial<WorldEventDefinition>): WorldEventDefinition => ({
  eventId: 'evt',
  flavor: 'help',
  intensity: 'soft',
  triggers: { allOf: [] },
  effects: {},
  diegeticTextTemplate: 'event happened',
  ...partial
});

const capsule = (events: WorldEventDefinition[]): CapsuleSchema => ({
  schemaVersion: '1.0.0',
  capsuleId: 'capsule',
  title: 'c',
  synopsis: 's',
  roles: ['r'],
  presets: ['default'],
  defaultRoleId: 'r',
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
      entryText: 'entry',
      visual: { palette: 'p', mood: 'm', backdrop: 'b' },
      locations: [{ id: 'loc-a', label: 'Loc A' }]
    }
  ],
  hotspots: [{ id: 'hs-a', label: 'HS', locationId: 'loc-a', verbs: ['OBSERVE'] }],
  beats: [
    {
      id: 'beat-a',
      sceneId: 'scene-a',
      title: 'Beat A',
      allowedVerbs: ['OBSERVE'],
      activeHotspots: ['hs-a']
    }
  ],
  worldEvents: {
    events,
    overrides: {
      budget: {
        sceneStrongMax: 1,
        sceneSoftMax: 2,
        capsuleStrongMax: 2,
        capsuleSoftMax: 4,
        strongCooldownTurns: 0
      }
    }
  }
});

const state = (): SessionState => ({
  sessionId: 's1',
  capsuleId: 'capsule',
  roleId: 'r',
  presetId: 'default',
  sceneId: 'scene-a',
  beatId: 'beat-a',
  locationId: 'loc-a',
  turnNumber: 1,
  stateText: { suspicion: 10, tension: 10, clock: 0, risk: 10, trustByNpc: {} },
  leverage: new Set(),
  inventory: new Set(),
  clues: new Set(),
  repeatActionCounts: {},
  hotspotOverrides: { enable: [], disable: [] },
  locationOverrides: { enable: [], disable: [] },
  wed: {
    sceneBudgetUsed: {},
    capsuleBudgetUsed: { soft: 0, strong: 0 },
    mixCounts: { help: 0, shift: 0, friction: 0 },
    cooldowns: {},
    recentEvents: [],
    repeatsByVerb: {},
    repeatsByTarget: {}
  },
  ended: false
});

const context = (s: SessionState): TurnContext => ({
  request: { sessionId: s.sessionId, turnId: 't1', action: { verb: 'OBSERVE', targetId: 'hs-a' } },
  capsule: capsule([]),
  beat: {
    id: 'beat-a',
    sceneId: 'scene-a',
    title: 'Beat A',
    allowedVerbs: ['OBSERVE'],
    activeHotspots: ['hs-a']
  },
  state: s
});

describe('WorldEventDirector', () => {
  it('caps strong events to max one per scene', () => {
    const director = new WorldEventDirector();
    const event = baseEvent({ eventId: 'strong-1', intensity: 'strong' });
    const cap = capsule([event]);
    const rng = new SeededRngFactory().create('seed-a');

    const first = director.maybeApply({
      context: context(state()),
      state: state(),
      capsule: cap,
      rng,
      deltas: {},
      affordances: {
        activeLocations: ['loc-a'],
        activeHotspots: ['hs-a'],
        allowedVerbs: ['OBSERVE'],
        suggestedActions: [{ verb: 'OBSERVE', targetId: 'hs-a', reason: 'r' }]
      }
    });
    expect(first.fired).toBe(true);

    const second = director.maybeApply({
      context: context(first.state),
      state: first.state,
      capsule: cap,
      rng,
      deltas: {},
      affordances: {
        activeLocations: ['loc-a'],
        activeHotspots: ['hs-a'],
        allowedVerbs: ['OBSERVE'],
        suggestedActions: [{ verb: 'OBSERVE', targetId: 'hs-a', reason: 'r' }]
      }
    });
    expect(second.fired).toBe(false);
    expect(second.skipReason).toBe('BUDGET');
  });

  it('applies mix correction after two friction events', () => {
    const director = new WorldEventDirector();
    const friction = baseEvent({ eventId: 'fr-a', flavor: 'friction' });
    const help = baseEvent({ eventId: 'help-a', flavor: 'help' });
    const cap = capsule([friction, help]);
    const s = state();
    s.wed.recentEvents = ['friction:old-1', 'friction:old-2'];
    const rng = new SeededRngFactory().create('seed-b');

    const result = director.maybeApply({
      context: context(s),
      state: s,
      capsule: cap,
      rng,
      deltas: {},
      affordances: {
        activeLocations: ['loc-a'],
        activeHotspots: ['hs-a'],
        allowedVerbs: ['OBSERVE'],
        suggestedActions: [{ verb: 'OBSERVE', targetId: 'hs-a', reason: 'r' }]
      }
    });

    expect(result.fired).toBe(true);
    expect(result.flavor).not.toBe('friction');
  });

  it('rejects friction event without compensation', () => {
    const director = new WorldEventDirector();
    const friction = baseEvent({
      eventId: 'fr-no-comp',
      flavor: 'friction',
      effects: { stateDelta: { tension: 2 } },
      fairnessCompensation: false
    });
    const cap = capsule([friction]);
    const rng = new SeededRngFactory().create('seed-c');

    const result = director.maybeApply({
      context: context(state()),
      state: state(),
      capsule: cap,
      rng,
      deltas: {},
      affordances: {
        activeLocations: ['loc-a'],
        activeHotspots: ['hs-a'],
        allowedVerbs: ['OBSERVE'],
        suggestedActions: []
      }
    });

    expect(result.fired).toBe(false);
    expect(result.skipReason).toBe('FAIRNESS');
  });
});
