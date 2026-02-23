import { Test } from '@nestjs/testing';
import { TelemetryRepo } from '../modules/persistence/telemetry.repo';
import { TelemetryController } from './telemetry.controller';

describe('TelemetryController', () => {
  it('accepts client telemetry batches', async () => {
    const telemetryRepo = {
      appendEvents: jest.fn().mockResolvedValue({ count: 1 })
    } as unknown as TelemetryRepo;

    const moduleRef = await Test.createTestingModule({
      controllers: [TelemetryController],
      providers: [{ provide: TelemetryRepo, useValue: telemetryRepo }]
    }).compile();

    const controller = moduleRef.get(TelemetryController);
    const result = await controller.ingestClientTelemetry({
      deviceId: 'device-1',
      events: [
        {
          eventName: 'turn_sent',
          ts: new Date().toISOString(),
          sessionId: 's1',
          payload: { turnId: 't1' }
        }
      ]
    });

    expect(result).toEqual({ accepted: true });
    expect((telemetryRepo.appendEvents as jest.Mock).mock.calls.length).toBe(1);
  });
});
