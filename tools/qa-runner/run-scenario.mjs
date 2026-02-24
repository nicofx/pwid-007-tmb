#!/usr/bin/env node

const args = process.argv.slice(2);
const nameFlagIndex = args.indexOf('--name');
const scenarioName = nameFlagIndex >= 0 ? args[nameFlagIndex + 1] : 'coreA';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
const CAPSULE_ID = process.env.QA_CAPSULE_ID ?? 'berlin-1933';
const PRESET_ID = process.env.QA_PRESET_ID ?? 'default';

function fail(message) {
  console.error(`[qa-runner] ${message}`);
  process.exit(1);
}

async function post(pathname, body) {
  const response = await fetch(`${API_BASE_URL}${pathname}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${pathname} failed ${response.status}: ${text}`);
  }

  return response.json();
}

async function startSession() {
  const started = await post('/sessions/start', {
    capsuleId: CAPSULE_ID,
    presetId: PRESET_ID
  });

  if (!started?.sessionId || !started?.packet) {
    throw new Error('start session response missing sessionId or packet');
  }

  return started;
}

function scriptedCoreActions() {
  return [
    { verb: 'OBSERVE', targetId: 'courier-contact', playerText: 'Read the courier posture' },
    { verb: 'TALK', targetId: 'officer', playerText: 'Ask about the patrol handoff' },
    { verb: 'SEARCH', targetId: 'service-door', playerText: 'Check service entry' },
    { verb: 'MOVE', targetId: 'service-door', playerText: 'Slip through service access' },
    { verb: 'SEARCH', targetId: 'records-ledger', playerText: 'Find transport records' },
    { verb: 'OBSERVE', targetId: 'sleeping-clerk', playerText: 'Watch desk rhythm' },
    { verb: 'SEARCH', targetId: 'stamp-desk', playerText: 'Collect stamp pattern' },
    { verb: 'MOVE', targetId: 'courtyard-exit', playerText: 'Head to yard line' },
    { verb: 'OBSERVE', targetId: 'tram-platform', playerText: 'Study gate timing' },
    { verb: 'MOVE', targetId: 'courtyard-exit', playerText: 'Take final crossing' }
  ];
}

async function runCoreA() {
  const started = await startSession();
  const { sessionId } = started;
  let packet = started.packet;

  const actions = scriptedCoreActions();
  let turnNumber = 1;

  for (const action of actions) {
    if (packet.end) {
      break;
    }

    const turnId = `qa-coreA-${String(turnNumber).padStart(2, '0')}`;
    const response = await post('/turns', {
      sessionId,
      turnId,
      playerText: action.playerText,
      action: {
        verb: action.verb,
        targetId: action.targetId,
        modifiers: []
      }
    });

    packet = response.packet;
    turnNumber += 1;
  }

  if (!packet.end) {
    fail('coreA did not reach an ending within scripted steps');
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        scenario: 'coreA',
        sessionId,
        endingId: packet.end.endingId,
        turns: packet.turnNumber
      },
      null,
      2
    )
  );
}

async function runBlockedProbe() {
  const started = await startSession();
  const { sessionId } = started;

  const response = await post('/turns', {
    sessionId,
    turnId: 'qa-blocked-01',
    playerText: 'Attempt impossible drop',
    action: {
      verb: 'DROP',
      targetId: 'not-a-real-target',
      modifiers: []
    }
  });

  if (response.packet.outcome !== 'BLOCKED') {
    fail(`blockedProbe expected BLOCKED, got ${response.packet.outcome}`);
  }

  const alternatives = response.packet.affordances?.suggestedActions ?? [];
  if (alternatives.length < 2) {
    fail(`blockedProbe expected >=2 alternatives, got ${alternatives.length}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        scenario: 'blockedProbe',
        sessionId,
        outcome: response.packet.outcome,
        alternatives: alternatives.length
      },
      null,
      2
    )
  );
}

async function main() {
  try {
    if (scenarioName === 'coreA') {
      await runCoreA();
      return;
    }

    if (scenarioName === 'blockedProbe') {
      await runBlockedProbe();
      return;
    }

    fail(`unknown scenario \"${scenarioName}\"`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    fail(message);
  }
}

await main();
