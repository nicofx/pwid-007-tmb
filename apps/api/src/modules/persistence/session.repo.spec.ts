import { SessionRepo } from './session.repo';

describe('SessionRepo', () => {
  it('uses prisma session methods', async () => {
    const prisma = {
      session: {
        create: jest.fn().mockResolvedValue({ id: 's1' }),
        findUnique: jest.fn().mockResolvedValue({ id: 's1' }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue({ id: 's1', status: 'ENDED' })
      }
    };

    const repo = new SessionRepo(prisma as never);
    await repo.create({
      id: 's1',
      capsuleId: 'c1',
      seed: 'x',
      currentStateJson: {},
      lastPacketJson: {}
    });
    await repo.getById('s1');
    await repo.updateStateOptimistic({
      id: 's1',
      rev: 0,
      nextRev: 1,
      currentStateJson: {},
      lastPacketJson: {},
      lastTurnSeq: 1
    });
    await repo.markEnded('s1');

    expect(prisma.session.create).toHaveBeenCalled();
    expect(prisma.session.findUnique).toHaveBeenCalled();
    expect(prisma.session.updateMany).toHaveBeenCalled();
    expect(prisma.session.update).toHaveBeenCalled();
  });
});
