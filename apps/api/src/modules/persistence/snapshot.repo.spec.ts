import { SnapshotRepo } from './snapshot.repo';

describe('SnapshotRepo', () => {
  it('uses prisma snapshot methods', async () => {
    const prisma = {
      snapshot: {
        create: jest.fn().mockResolvedValue({ id: 'snap-1' }),
        findFirst: jest.fn().mockResolvedValue({ id: 'snap-1', seq: 5 })
      }
    };

    const repo = new SnapshotRepo(prisma as never);
    await repo.createSnapshot({
      session: { connect: { id: 's1' } },
      seq: 5,
      stateJson: {}
    });
    await repo.getLatestSnapshot('s1');

    expect(prisma.snapshot.create).toHaveBeenCalled();
    expect(prisma.snapshot.findFirst).toHaveBeenCalled();
  });
});
