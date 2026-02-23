import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../db/prisma.service';

describe('HealthController', () => {
  it('returns service health payload', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            getStatus: () => ({ dbConnected: true })
          }
        }
      ]
    }).compile();

    const controller = moduleRef.get(HealthController);

    expect(controller.getHealth()).toEqual({
      status: 'ok',
      service: 'tmb-api',
      dbConnected: true
    });
  });
});
