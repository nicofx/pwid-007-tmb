import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  it('exposes a status object', () => {
    const service = new PrismaService();
    expect(service.getStatus()).toEqual({ dbConnected: false });
  });
});
