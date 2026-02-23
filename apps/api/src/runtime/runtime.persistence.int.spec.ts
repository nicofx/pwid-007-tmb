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

  beforeAll(async () => {
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
    await prisma.telemetryEvent.deleteMany();
  });

  afterAll(async () => {
    process.env.NARRATIVE_MODE = originalNarrativeMode;
    process.env.MOCK_LLM_MODE = originalMockMode;
    process.env.NARRATIVE_TIMEOUT_MS = originalNarrativeTimeout;
    await app.close();
  });

  it('persists session start turn0 and supports idempotent turn + resume', async () => {
    const startRes = await request(app.getHttpServer())
      .post('/sessions/start')
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

    const turnRes = await request(app.getHttpServer())
      .post('/turns')
      .send({ sessionId, turnId: 'turn-1', playerText: 'observe officer' })
      .expect(201);
    expect(turnRes.body.packet.worldEvent).toBeDefined();

    const turnRepeat = await request(app.getHttpServer())
      .post('/turns')
      .send({ sessionId, turnId: 'turn-1', playerText: 'observe officer' })
      .expect(201);

    expect(turnRepeat.body.idempotencyHit).toBe(true);
    expect(turnRepeat.body.packet).toEqual(turnRes.body.packet);

    const resume = await request(app.getHttpServer())
      .get(`/sessions/${sessionId}/resume`)
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
  });

  it('persists telemetry client batch', async () => {
    await request(app.getHttpServer())
      .post('/telemetry/client')
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
    process.env.NARRATIVE_MODE = 'llm';
    process.env.LLM_ADAPTER = 'mock';
    process.env.MOCK_LLM_MODE = 'invalid';

    const startRes = await request(app.getHttpServer())
      .post('/sessions/start')
      .send({ capsuleId: 'berlin-1933', presetId: 'default' })
      .expect(201);

    const sessionId = startRes.body.sessionId as string;
    const turnPayload = { sessionId, turnId: 'turn-invalid-1', playerText: 'observe lock' };

    const first = await request(app.getHttpServer()).post('/turns').send(turnPayload).expect(201);
    const second = await request(app.getHttpServer()).post('/turns').send(turnPayload).expect(201);

    expect(first.body.packet.narrativeBlocks.length).toBeGreaterThan(0);
    expect(second.body.packet).toEqual(first.body.packet);
    expect(second.body.idempotencyHit).toBe(true);

    const fallbackEvents = await prisma.telemetryEvent.findMany({
      where: { sessionId, eventName: 'narrative_fallback' }
    });
    expect(fallbackEvents.length).toBeGreaterThan(0);
  });

  it('falls back when llm times out and still returns 201', async () => {
    process.env.NARRATIVE_MODE = 'llm';
    process.env.LLM_ADAPTER = 'mock';
    process.env.MOCK_LLM_MODE = 'timeout';
    process.env.NARRATIVE_TIMEOUT_MS = '30';

    const startRes = await request(app.getHttpServer())
      .post('/sessions/start')
      .send({ capsuleId: 'berlin-1933', presetId: 'guided' })
      .expect(201);
    const sessionId = startRes.body.sessionId as string;

    const turn = await request(app.getHttpServer())
      .post('/turns')
      .send({ sessionId, turnId: 'turn-timeout-1', playerText: 'talk officer' })
      .expect(201);

    expect(turn.body.packet.narrativeBlocks.length).toBeGreaterThan(0);

    const rejectEvents = await prisma.telemetryEvent.findMany({
      where: { sessionId, eventName: 'guardrail_reject' }
    });
    expect(rejectEvents.length).toBeGreaterThan(0);
  });

  it('runs 10-turn smoke for each preset without 500', async () => {
    const presetsRes = await request(app.getHttpServer())
      .get('/sessions/presets/berlin-1933')
      .expect(200);
    const presets = presetsRes.body as Array<{ id: string }>;
    expect(presets.length).toBeGreaterThan(0);

    for (const preset of presets) {
      const startRes = await request(app.getHttpServer())
        .post('/sessions/start')
        .send({ capsuleId: 'berlin-1933', presetId: preset.id })
        .expect(201);
      const sessionId = startRes.body.sessionId as string;
      let packet = startRes.body.packet as { turnId: string };

      for (let index = 1; index <= 10; index += 1) {
        const turn = await request(app.getHttpServer())
          .post('/turns')
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
    const startRes = await request(app.getHttpServer())
      .post('/sessions/start')
      .send({ capsuleId: 'berlin-1933', presetId: 'default' })
      .expect(201);
    const sessionId = startRes.body.sessionId as string;

    for (let index = 1; index <= 6; index += 1) {
      await request(app.getHttpServer())
        .post('/turns')
        .send({
          sessionId,
          turnId: `cooldown-turn-${index}`,
          playerText: index % 2 === 0 ? 'search lock' : 'observe officer'
        })
        .expect(201);
    }

    const resumed = await request(app.getHttpServer())
      .get(`/sessions/${sessionId}/resume`)
      .expect(200);
    expect(resumed.body.packet.worldEvent).toBeDefined();

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    const state = session?.currentStateJson as { wed?: { cooldowns?: Record<string, number> } };
    expect(state?.wed).toBeDefined();
    expect(typeof state?.wed?.cooldowns).toBe('object');
  });

  it('returns 400 when preset does not exist', async () => {
    const res = await request(app.getHttpServer())
      .post('/sessions/start')
      .send({ capsuleId: 'berlin-1933', presetId: 'does-not-exist' })
      .expect(400);

    expect(res.body.code).toBe('PRESET_NOT_FOUND');
  });

  it('returns debug trace with recent turns', async () => {
    const startRes = await request(app.getHttpServer())
      .post('/sessions/start')
      .send({ capsuleId: 'berlin-1933', presetId: 'default' })
      .expect(201);
    const sessionId = startRes.body.sessionId as string;

    for (let index = 1; index <= 3; index += 1) {
      await request(app.getHttpServer())
        .post('/turns')
        .send({
          sessionId,
          turnId: `trace-turn-${index}`,
          playerText: index % 2 === 0 ? 'observe officer' : 'search lock'
        })
        .expect(201);
    }

    const traceRes = await request(app.getHttpServer())
      .get(`/debug/sessions/${sessionId}/trace?last=2`)
      .expect(200);

    expect(traceRes.body.sessionId).toBe(sessionId);
    expect(traceRes.body.turns).toHaveLength(2);
    expect(traceRes.body.turns[0].seq).toBeGreaterThanOrEqual(2);
    expect(traceRes.body.turns[1].seq).toBeGreaterThan(traceRes.body.turns[0].seq);
  });
});
