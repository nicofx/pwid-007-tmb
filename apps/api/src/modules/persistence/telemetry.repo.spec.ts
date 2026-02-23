import { TelemetryRepo } from './telemetry.repo';

describe('TelemetryRepo', () => {
  it('uses prisma telemetry methods', async () => {
    const prisma = {
      telemetryEvent: {
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
        create: jest.fn().mockResolvedValue({ id: 'e1' })
      }
    };

    const repo = new TelemetryRepo(prisma as never);
    await repo.appendEvents([
      { ts: new Date(), source: 'server', eventName: 'turn_processed' },
      { ts: new Date(), source: 'client', eventName: 'ui_click' }
    ]);
    await repo.appendEvent({ ts: new Date(), source: 'server', eventName: 'session_started' });

    expect(prisma.telemetryEvent.createMany).toHaveBeenCalled();
    expect(prisma.telemetryEvent.create).toHaveBeenCalled();
  });
});
