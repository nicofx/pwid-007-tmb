#!/usr/bin/env node

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';
const CAPSULE_ID = process.env.QA_CAPSULE_ID ?? 'berlin-1933';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function api(pathname, options = {}) {
  const response = await fetch(`${API_BASE_URL}${pathname}`, {
    headers: { 'content-type': 'application/json' },
    ...options
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${pathname} -> ${response.status}: ${text}`);
  }

  return response.json();
}

function scriptedAction(index, packet) {
  const suggested =
    packet.affordances?.suggestedActions?.[
      index % Math.max(1, packet.affordances?.suggestedActions?.length ?? 1)
    ];
  if (suggested?.verb) {
    return {
      playerText: `qa scripted action ${index + 1}`,
      action: {
        verb: suggested.verb,
        targetId: suggested.targetId,
        modifiers: []
      }
    };
  }

  const fallbackVerb =
    packet.affordances?.allowedVerbs?.[
      index % Math.max(1, packet.affordances?.allowedVerbs?.length ?? 1)
    ] ?? 'OBSERVE';
  const fallbackTarget = packet.affordances?.activeHotspots?.[0];

  return {
    playerText: `qa fallback action ${index + 1}`,
    action: {
      verb: fallbackVerb,
      targetId: fallbackTarget,
      modifiers: []
    }
  };
}

async function runPreset(presetId) {
  const started = await api('/sessions/start', {
    method: 'POST',
    body: JSON.stringify({ capsuleId: CAPSULE_ID, presetId })
  });

  assert(started.sessionId, `sessionId missing for preset ${presetId}`);
  assert(started.packet, `packet missing for preset ${presetId}`);

  let packet = started.packet;
  const sessionId = started.sessionId;
  const outcomeCounts = {
    SUCCESS: 0,
    PARTIAL: 0,
    FAIL_FORWARD: 0,
    BLOCKED: 0
  };

  for (let index = 0; index < 10; index += 1) {
    if (packet.end) {
      break;
    }

    const turnId = `qa-presets-${presetId}-${String(index + 1).padStart(2, '0')}`;
    const payload = scriptedAction(index, packet);

    const turn = await api('/turns', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        turnId,
        playerText: payload.playerText,
        action: payload.action
      })
    });

    assert(turn.packet, `turn packet missing for preset ${presetId} at turn ${index + 1}`);
    packet = turn.packet;
    const outcome = packet.outcome;
    outcomeCounts[outcome] += 1;

    if (!packet.end) {
      assert(packet.affordances, `affordances missing for preset ${presetId} at turn ${index + 1}`);
      assert(
        (packet.affordances?.allowedVerbs?.length ?? 0) > 0,
        `allowedVerbs empty for preset ${presetId} at turn ${index + 1}`
      );
    }
  }

  return {
    presetId,
    sessionId,
    finalTurnNumber: packet.turnNumber,
    ended: Boolean(packet.end),
    endingId: packet.end?.endingId ?? null,
    suggestionCount: packet.affordances?.suggestedActions?.length ?? 0,
    outcomes: outcomeCounts
  };
}

async function main() {
  const presets = await api(`/sessions/presets/${CAPSULE_ID}`);
  assert(Array.isArray(presets) && presets.length > 0, 'No presets returned by API');

  const results = [];
  for (const preset of presets) {
    const presetId = preset?.id;
    assert(typeof presetId === 'string' && presetId.length > 0, 'Invalid preset id in list');
    const result = await runPreset(presetId);
    results.push(result);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        capsuleId: CAPSULE_ID,
        presetCount: results.length,
        results
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(`[qa:presets] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
