import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../db/prisma.service';
import request from 'supertest';
import { AppModule } from '../app.module';

process.env.DATABASE_URL ??= 'postgresql://tmb:tmb@localhost:5432/tmb?schema=public';

describe('Runtime API persistence (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const originalNarrativeMode = process.env.NARRATIVE_MODE;
  const originalMockMode = process.env.MOCK_LLM_MODE;
  const originalNarrativeTimeout = process.env.NARRATIVE_TIMEOUT_MS;
  const originalAdminToken = process.env.ADMIN_TOKEN;
  const adminToken = 'integration-admin-token';
  const deviceId = '00000000-0000-4000-8000-000000000001';
  const otherDeviceId = '00000000-0000-4000-8000-000000000002';
  const deviceGet = (url: string) =>
    request(app.getHttpServer()).get(url).set('x-tmb-device-id', deviceId);
  const devicePost = (url: string) =>
    request(app.getHttpServer()).post(url).set('x-tmb-device-id', deviceId);
  const deviceDelete = (url: string) =>
    request(app.getHttpServer()).delete(url).set('x-tmb-device-id', deviceId);
  const otherDeviceGet = (url: string) =>
    request(app.getHttpServer()).get(url).set('x-tmb-device-id', otherDeviceId);
  const otherDevicePost = (url: string) =>
    request(app.getHttpServer()).post(url).set('x-tmb-device-id', otherDeviceId);
  const otherDeviceDelete = (url: string) =>
    request(app.getHttpServer()).delete(url).set('x-tmb-device-id', otherDeviceId);

  beforeAll(async () => {
    process.env.ADMIN_TOKEN = adminToken;
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true
      })
    );
    await app.init();

    prisma = moduleRef.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.turn.deleteMany();
    await prisma.snapshot.deleteMany();
    await prisma.session.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.telemetryEvent.deleteMany();

    await devicePost('/admin/config')
      .set('x-admin-token', adminToken)
      .send({
        narrativeMode: 'placeholder',
        llmAdapter: 'mock',
        llmModel: 'default-model',
        narrativeTimeoutMs: 1600,
        narrativeCacheSize: 500,
        wedEnabled: true
      })
      .expect(201);
  });

  afterAll(async () => {
    process.env.NARRATIVE_MODE = originalNarrativeMode;
    process.env.MOCK_LLM_MODE = originalMockMode;
    process.env.NARRATIVE_TIMEOUT_MS = originalNarrativeTimeout;
    process.env.ADMIN_TOKEN = originalAdminToken;
    await app.close();
  });

  it('persists session start turn0 and supports idempotent turn + resume', async () => {
    const startRes = await devicePost('/sessions/start')
      .send({ capsuleId: 'berlin-1933', presetId: 'guided' })
      .expect(201);

    const sessionId = startRes.body.sessionId as string;

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    const turns = await prisma.turn.findMany({ where: { sessionId }, orderBy: { seq: 'asc' } });
    const snapshots = await prisma.snapshot.findMany({
      where: { sessionId },
      orderBy: { seq: 'asc' }
    });

    expect(session).not.toBeNull();
    expect(session?.presetId).toBe('guided');
    expect(turns[0]?.seq).toBe(0);
    expect(snapshots[0]?.seq).toBe(0);

    const turnRes = await devicePost('/turns')
      .send({ sessionId, turnId: 'turn-1', playerText: 'observe officer' })
      .expect(201);
    expect(turnRes.body.packet.worldEvent).toBeDefined();

    const turnRepeat = await devicePost('/turns')
      .send({ sessionId, turnId: 'turn-1', playerText: 'observe officer' })
      .expect(201);

    expect(turnRepeat.body.idempotencyHit).toBe(true);
    expect(turnRepeat.body.packet).toEqual(turnRes.body.packet);

    const resume = await deviceGet(`/sessions/${sessionId}/resume`)
      .expect(200);
    expect(resume.body.packet.turnId).toBe('turn-1');

    const persistedTurns = await prisma.turn.findMany({ where: { sessionId } });
    expect(persistedTurns).toHaveLength(2);

    const sessionAfterTurn = await prisma.session.findUnique({ where: { id: sessionId } });
    expect((sessionAfterTurn?.memoryJson as { bullets?: string[] } | null)?.bullets).toBeDefined();

    const narrativeEvents = await prisma.telemetryEvent.findMany({
      where: { sessionId, eventName: 'narrative_rendered' }
    });
    expect(narrativeEvents.length).toBeGreaterThan(0);

    const wedEvents = await prisma.telemetryEvent.findMany({
      where: {
        sessionId,
        eventName: { in: ['imponderable_fired', 'imponderable_skipped'] }
      }
    });
    expect(wedEvents.length).toBeGreaterThan(0);

    const wedEvaluated = await prisma.telemetryEvent.findMany({
      where: { sessionId, eventName: 'wed_evaluated' }
    });
    expect(wedEvaluated.length).toBeGreaterThan(0);
    const firstWedPayload = wedEvaluated[0]?.payloadJson as {
      budgetsUsed?: { scene?: unknown; capsule?: unknown };
      mixCounts?: unknown;
    };
    expect(firstWedPayload?.budgetsUsed?.scene).toBeDefined();
    expect(firstWedPayload?.budgetsUsed?.capsule).toBeDefined();
    expect(firstWedPayload?.mixCounts).toBeDefined();
  });

  it('accepts custom seed on start and persists it', async () => {
    const startRes = await devicePost('/sessions/start')
      .send({ capsuleId: 'berlin-1933', presetId: 'default', seed: 'demo-berlin-1933' })
      .expect(201);

    const sessionId = startRes.body.sessionId as string;
    expect(startRes.body.seed).toBe('demo-berlin-1933');

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    expect(session?.seed).toBe('demo-berlin-1933');

    const resume = await deviceGet(`/sessions/${sessionId}/resume`)
      .expect(200);
    expect(resume.body.seed).toBe('demo-berlin-1933');
  });

  it('persists telemetry client batch', async () => {
    await devicePost('/telemetry/client')
      .send({
        deviceId: 'device-xyz',
        events: [
          {
            eventName: 'ui_hotspot_click',
            ts: new Date().toISOString(),
            sessionId: 'session-x',
            turnId: 'turn-y',
            payload: { hotspotId: 'archive-lock' }
          }
        ]
      })
      .expect(201);

    const rows = await prisma.telemetryEvent.findMany({ where: { source: 'client' } });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.deviceId).toBe('device-xyz');
  });

  it('falls back when llm output is invalid and keeps idempotency stable', async () => {
    process.env.MOCK_LLM_MODE = 'invalid';
    await devicePost('/admin/config')
      .set('x-admin-token', adminToken)
      .send({ narrativeMode: 'llm', llmAdapter: 'mock' })
      .expect(201);

    const startRes = await devicePost('/sessions/start')
      .send({ capsuleId: 'berlin-1933', presetId: 'default' })
      .expect(201);

    const sessionId = startRes.body.sessionId as string;
    const turnPayload = { sessionId, turnId: 'turn-invalid-1', playerText: 'observe lock' };

    const first = await devicePost('/turns').send(turnPayload).expect(201);
    const second = await devicePost('/turns').send(turnPayload).expect(201);

    expect(first.body.packet.narrativeBlocks.length).toBeGreaterThan(0);
    expect(second.body.packet).toEqual(first.body.packet);
    expect(second.body.idempotencyHit).toBe(true);

    const fallbackEvents = await prisma.telemetryEvent.findMany({
      where: { sessionId, eventName: 'narrative_fallback' }
    });
    expect(fallbackEvents.length).toBeGreaterThan(0);
  });

  it('falls back when llm times out and still returns 201', async () => {
    process.env.MOCK_LLM_MODE = 'timeout';
    await devicePost('/admin/config')
      .set('x-admin-token', adminToken)
      .send({ narrativeMode: 'llm', llmAdapter: 'mock', narrativeTimeoutMs: 200 })
      .expect(201);

    const startRes = await devicePost('/sessions/start')
      .send({ capsuleId: 'berlin-1933', presetId: 'guided' })
      .expect(201);
    const sessionId = startRes.body.sessionId as string;

    const turn = await devicePost('/turns')
      .send({ sessionId, turnId: 'turn-timeout-1', playerText: 'talk officer' })
      .expect(201);

    expect(turn.body.packet.narrativeBlocks.length).toBeGreaterThan(0);

    const rejectEvents = await prisma.telemetryEvent.findMany({
      where: { sessionId, eventName: 'guardrail_reject' }
    });
    expect(rejectEvents.length).toBeGreaterThan(0);
  });

  it('runs 10-turn smoke for each preset without 500', async () => {
    const presetsRes = await deviceGet('/sessions/presets/berlin-1933')
      .expect(200);
    const presets = presetsRes.body as Array<{ id: string }>;
    expect(presets.length).toBeGreaterThan(0);

    for (const preset of presets) {
      const startRes = await devicePost('/sessions/start')
        .send({ capsuleId: 'berlin-1933', presetId: preset.id })
        .expect(201);
      const sessionId = startRes.body.sessionId as string;
      let packet = startRes.body.packet as { turnId: string };

      for (let index = 1; index <= 10; index += 1) {
        const turn = await devicePost('/turns')
          .send({
            sessionId,
            turnId: `${preset.id}-turn-${index}`,
            playerText: index % 2 === 0 ? 'search records' : 'observe officer'
          })
          .expect(201);

        packet = turn.body.packet as { turnId: string };
      }

      expect(packet.turnId).toBe(`${preset.id}-turn-10`);
    }
  });

  it('keeps wed cooldown/budget state after resume', async () => {
    const startRes = await devicePost('/sessions/start')
      .send({ capsuleId: 'berlin-1933', presetId: 'default' })
      .expect(201);
    const sessionId = startRes.body.sessionId as string;

    for (let index = 1; index <= 6; index += 1) {
      await devicePost('/turns')
        .send({
          sessionId,
          turnId: `cooldown-turn-${index}`,
          playerText: index % 2 === 0 ? 'search lock' : 'observe officer'
        })
        .expect(201);
    }

    const resumed = await deviceGet(`/sessions/${sessionId}/resume`)
      .expect(200);
    expect(resumed.body.packet.worldEvent).toBeDefined();

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    const state = session?.currentStateJson as { wed?: { cooldowns?: Record<string, number> } };
    expect(state?.wed).toBeDefined();
    expect(typeof state?.wed?.cooldowns).toBe('object');
  });

  it('returns 400 when preset does not exist', async () => {
    const res = await devicePost('/sessions/start')
      .send({ capsuleId: 'berlin-1933', presetId: 'does-not-exist' })
      .expect(400);

    expect(res.body.code).toBe('PRESET_NOT_FOUND');
  });

  it('returns debug trace with recent turns', async () => {
    const startRes = await devicePost('/sessions/start')
      .send({ capsuleId: 'berlin-1933', presetId: 'default' })
      .expect(201);
    const sessionId = startRes.body.sessionId as string;

    for (let index = 1; index <= 3; index += 1) {
      await devicePost('/turns')
        .send({
          sessionId,
          turnId: `trace-turn-${index}`,
          playerText: index % 2 === 0 ? 'observe officer' : 'search lock'
        })
        .expect(201);
    }

    const traceRes = await deviceGet(`/debug/sessions/${sessionId}/trace?last=2`)
      .expect(200);

    expect(traceRes.body.sessionId).toBe(sessionId);
    expect(traceRes.body.turns).toHaveLength(2);
    expect(traceRes.body.turns[0].seq).toBeGreaterThanOrEqual(2);
    expect(traceRes.body.turns[1].seq).toBeGreaterThan(traceRes.body.turns[0].seq);
  });

  it('rejects admin config without valid token and allows updates with token', async () => {
    await deviceGet('/admin/config').expect(401);

    const loaded = await deviceGet('/admin/config')
      .set('x-admin-token', adminToken)
      .expect(200);
    expect(loaded.body.narrativeMode).toBeDefined();

    const updated = await devicePost('/admin/config')
      .set('x-admin-token', adminToken)
      .send({
        narrativeMode: 'llm',
        llmAdapter: 'mock',
        narrativeTimeoutMs: 900,
        narrativeCacheSize: 600,
        wedEnabled: true
      })
      .expect(201);

    expect(updated.body.narrativeMode).toBe('llm');
    expect(updated.body.llmAdapter).toBe('mock');
    expect(updated.body.narrativeTimeoutMs).toBe(900);
    expect(updated.body.narrativeCacheSize).toBe(600);
  });

  it('returns admin balance report with auth', async () => {
    await deviceGet('/admin/balance').expect(401);

    const startRes = await devicePost('/sessions/start')
      .send({ capsuleId: 'berlin-1933', presetId: 'guided' })
      .expect(201);
    const sessionId = startRes.body.sessionId as string;

    await devicePost('/turns')
      .send({ sessionId, turnId: 'balance-turn-1', playerText: 'observe officer' })
      .expect(201);

    await devicePost('/telemetry/client')
      .send({
        deviceId: 'dev-balance',
        events: [
          {
            eventName: 'turn_received',
            ts: new Date().toISOString(),
            sessionId,
            turnId: 'balance-turn-1',
            payload: { latency_ms: 321 }
          }
        ]
      })
      .expect(201);

    const report = await deviceGet('/admin/balance')
      .set('x-admin-token', adminToken)
      .expect(200);

    expect(report.body.totalTurns).toBeGreaterThan(0);
    expect(typeof report.body.avgLatencyMs).toBe('number');
    expect(Array.isArray(report.body.presets)).toBe(true);
  });

  it('upserts profile and updates displayName', async () => {
    const profile = await deviceGet('/profile').expect(200);
    expect(profile.body.deviceId).toBe(deviceId);
    expect(profile.body.displayName).toBe('Player');

    const updated = await request(app.getHttpServer())
      .patch('/profile')
      .set('x-tmb-device-id', deviceId)
      .send({ displayName: 'Bauti' })
      .expect(200);
    expect(updated.body.displayName).toBe('Bauti');

    const refreshed = await deviceGet('/profile').expect(200);
    expect(refreshed.body.displayName).toBe('Bauti');
  });

  it('associates started sessions to profile and lists them', async () => {
    await deviceGet('/profile').expect(200);

    await devicePost('/sessions/start')
      .send({ capsuleId: 'berlin-1933', presetId: 'guided' })
      .expect(201);

    const list = await deviceGet('/profile/sessions?limit=10')
      .expect(200);

    expect(Array.isArray(list.body.sessions)).toBe(true);
    expect(list.body.sessions.length).toBeGreaterThan(0);
    expect(list.body.sessions[0].capsuleId).toBe('berlin-1933');
  });

  it('isolates profile sessions by deviceId', async () => {
    await deviceGet('/profile').expect(200);
    await otherDeviceGet('/profile').expect(200);

    await devicePost('/sessions/start')
      .send({ capsuleId: 'berlin-1933', presetId: 'guided' })
      .expect(201);
    await otherDevicePost('/sessions/start')
      .send({ capsuleId: 'berlin-1933', presetId: 'default' })
      .expect(201);

    const mine = await deviceGet('/profile/sessions?limit=10').expect(200);
    const other = await otherDeviceGet('/profile/sessions?limit=10').expect(200);

    expect(mine.body.sessions.length).toBeGreaterThan(0);
    expect(other.body.sessions.length).toBeGreaterThan(0);
    expect(mine.body.sessions[0].presetId).toBe('guided');
    expect(other.body.sessions[0].presetId).toBe('default');
  });

  it('returns DEVICE_ID_REQUIRED when header is missing', async () => {
    const response = await request(app.getHttpServer()).get('/profile').expect(400);
    expect(response.body.code).toBe('DEVICE_ID_REQUIRED');
  });

  it('returns DEVICE_ID_INVALID when header is malformed', async () => {
    const response = await request(app.getHttpServer())
      .get('/profile')
      .set('x-tmb-device-id', 'invalid-device-id')
      .expect(400);
    expect(response.body.code).toBe('DEVICE_ID_INVALID');
  });

  it('lists turns for owned session ordered by seq', async () => {
    const startRes = await devicePost('/sessions/start')
      .send({ capsuleId: 'berlin-1933', presetId: 'default' })
      .expect(201);
    const sessionId = startRes.body.sessionId as string;

    for (let index = 1; index <= 3; index += 1) {
      await devicePost('/turns')
        .send({
          sessionId,
          turnId: `history-turn-${index}`,
          playerText: index % 2 === 0 ? 'talk officer' : 'observe officer'
        })
        .expect(201);
    }

    const timeline = await deviceGet(`/sessions/${sessionId}/turns?limit=200&fromSeq=0&includePacket=1`)
      .expect(200);

    expect(timeline.body.sessionMeta.sessionId).toBe(sessionId);
    expect(timeline.body.turns.length).toBeGreaterThanOrEqual(4);
    for (let index = 1; index < timeline.body.turns.length; index += 1) {
      expect(timeline.body.turns[index].seq).toBeGreaterThan(timeline.body.turns[index - 1].seq);
    }
    expect(timeline.body.turns[0].packet).toBeDefined();
  });

  it('denies cross-device timeline access and logs security violation', async () => {
    const startRes = await devicePost('/sessions/start')
      .send({ capsuleId: 'berlin-1933', presetId: 'default' })
      .expect(201);
    const sessionId = startRes.body.sessionId as string;

    await otherDeviceGet(`/sessions/${sessionId}/turns`).expect(404);

    const violations = await prisma.telemetryEvent.findMany({
      where: { eventName: 'security_violation_attempt', sessionId }
    });
    expect(violations.length).toBeGreaterThan(0);
  });

  it('deletes a run and cascades turns/snapshots/telemetry for that session', async () => {
    const startRes = await devicePost('/sessions/start')
      .send({ capsuleId: 'berlin-1933', presetId: 'guided' })
      .expect(201);
    const sessionId = startRes.body.sessionId as string;

    await devicePost('/turns')
      .send({ sessionId, turnId: 'delete-turn-1', playerText: 'observe officer' })
      .expect(201);

    const beforeTurns = await prisma.turn.count({ where: { sessionId } });
    const beforeSnapshots = await prisma.snapshot.count({ where: { sessionId } });
    const beforeTelemetry = await prisma.telemetryEvent.count({ where: { sessionId } });
    expect(beforeTurns).toBeGreaterThan(0);
    expect(beforeSnapshots).toBeGreaterThan(0);
    expect(beforeTelemetry).toBeGreaterThan(0);

    await deviceDelete(`/sessions/${sessionId}`).expect(200);

    const afterSession = await prisma.session.findUnique({ where: { id: sessionId } });
    const afterTurns = await prisma.turn.count({ where: { sessionId } });
    const afterSnapshots = await prisma.snapshot.count({ where: { sessionId } });
    const afterTelemetry = await prisma.telemetryEvent.count({ where: { sessionId } });
    const runDeleted = await prisma.telemetryEvent.findFirst({
      where: { sessionId, eventName: 'run_deleted' }
    });
    expect(afterSession).toBeNull();
    expect(afterTurns).toBe(0);
    expect(afterSnapshots).toBe(0);
    expect(afterTelemetry).toBe(1);
    expect(runDeleted).not.toBeNull();
  });

  it('exports profile data with sessions and turns', async () => {
    const startRes = await devicePost('/sessions/start')
      .send({ capsuleId: 'berlin-1933', presetId: 'default' })
      .expect(201);
    const sessionId = startRes.body.sessionId as string;

    await devicePost('/turns')
      .send({ sessionId, turnId: 'export-turn-1', playerText: 'observe officer' })
      .expect(201);

    const exported = await deviceGet('/profile/export?includeTelemetry=0&turnLimitPerSession=200').expect(200);
    expect(exported.body.profile.id).toBeDefined();
    expect(Array.isArray(exported.body.sessions)).toBe(true);
    expect(exported.body.turnsBySession[sessionId]).toBeDefined();
    expect(exported.body.turnsBySession[sessionId].length).toBeGreaterThan(0);

    const exportEvent = await prisma.telemetryEvent.findFirst({
      where: { eventName: 'profile_exported', profileId: exported.body.profile.id }
    });
    expect(exportEvent).not.toBeNull();
  });

  it('wipes profile and recreates new one on next get', async () => {
    const profileBefore = await deviceGet('/profile').expect(200);
    const oldProfileId = profileBefore.body.id as string;

    const startRes = await devicePost('/sessions/start')
      .send({ capsuleId: 'berlin-1933', presetId: 'guided' })
      .expect(201);
    const sessionId = startRes.body.sessionId as string;

    await deviceDelete('/profile').expect(200);

    expect(await prisma.session.count({ where: { id: sessionId } })).toBe(0);
    expect(await prisma.turn.count({ where: { sessionId } })).toBe(0);
    expect(await prisma.snapshot.count({ where: { sessionId } })).toBe(0);

    const recreated = await deviceGet('/profile').expect(200);
    expect(recreated.body.id).not.toBe(oldProfileId);
    expect(recreated.body.displayName).toBe('Player');

    const wipeEvent = await prisma.telemetryEvent.findFirst({
      where: { eventName: 'profile_wiped', deviceId }
    });
    expect(wipeEvent).not.toBeNull();
  });

  it('denies cross-device delete of session', async () => {
    const startRes = await devicePost('/sessions/start')
      .send({ capsuleId: 'berlin-1933', presetId: 'default' })
      .expect(201);
    const sessionId = startRes.body.sessionId as string;

    await otherDeviceDelete(`/sessions/${sessionId}`).expect(404);
    expect(await prisma.session.count({ where: { id: sessionId } })).toBe(1);
  });

  it('exposes api root, ready and meta routes', async () => {
    const root = await request(app.getHttpServer()).get('/').expect(200);
    expect(root.body.links).toBeDefined();
    expect(root.body.links.docs).toBe('/api/docs');

    const ready = await request(app.getHttpServer()).get('/ready').expect(200);
    expect(['ready', 'not_ready']).toContain(ready.body.status);

    const routes = await request(app.getHttpServer()).get('/meta/routes').expect(200);
    expect(Array.isArray(routes.body.routes)).toBe(true);
    expect(routes.body.routes.length).toBeGreaterThan(0);
  });

  it('serves openapi schema', async () => {
    const schema = await request(app.getHttpServer()).get('/openapi.json').expect(200);
    expect(schema.body.openapi).toBeDefined();
  });
});
