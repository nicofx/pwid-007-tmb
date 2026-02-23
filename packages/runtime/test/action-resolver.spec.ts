import type { CapsuleSchema } from '@tmb/contracts';
import { ActionResolver } from '../src/engine/action-resolver.js';

const capsule: CapsuleSchema = {
  schemaVersion: '1.0.0',
  capsuleId: 'test',
  title: 't',
  synopsis: 's',
  roles: ['r'],
  presets: ['p'],
  defaultRoleId: 'r',
  defaultPresetId: 'p',
  initial: {
    sceneId: 'scene',
    beatId: 'beat',
    locationId: 'loc',
    stateText: { suspicion: 0, tension: 0, clock: 0, risk: 0 }
  },
  scenes: [
    {
      id: 'scene',
      title: 'Scene',
      entryText: 'Entry',
      visual: { palette: 'p', mood: 'm', backdrop: 'b' },
      locations: [{ id: 'loc', label: 'Loc' }]
    }
  ],
  hotspots: [
    {
      id: 'officer',
      label: 'Officer',
      locationId: 'loc',
      verbs: ['TALK', 'OBSERVE']
    }
  ],
  beats: [
    {
      id: 'beat',
      sceneId: 'scene',
      title: 'Beat',
      allowedVerbs: ['TALK', 'OBSERVE'],
      activeHotspots: ['officer']
    }
  ]
};

const state = {
  sessionId: 's',
  capsuleId: 'test',
  roleId: 'r',
  presetId: 'p',
  sceneId: 'scene',
  beatId: 'beat',
  locationId: 'loc',
  turnNumber: 0,
  stateText: { suspicion: 0, tension: 0, clock: 0, risk: 0 },
  leverage: new Set<string>(),
  inventory: new Set<string>(),
  clues: new Set<string>(),
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
};

describe('ActionResolver', () => {
  it('uses explicit action with priority', () => {
    const resolver = new ActionResolver();
    const action = resolver.resolveAction(
      {
        sessionId: 's',
        turnId: 't1',
        action: { verb: 'MOVE', targetId: 'officer' },
        playerText: 'talk to officer'
      },
      state,
      capsule
    );

    expect(action.verb).toBe('MOVE');
    expect(action.source).toBe('explicit');
  });

  it('maps text heuristically when no explicit action is provided', () => {
    const resolver = new ActionResolver();
    const action = resolver.resolveAction(
      {
        sessionId: 's',
        turnId: 't2',
        playerText: 'I want to talk with the officer'
      },
      state,
      capsule
    );

    expect(action.verb).toBe('TALK');
    expect(action.source).toBe('heuristic');
  });
});
