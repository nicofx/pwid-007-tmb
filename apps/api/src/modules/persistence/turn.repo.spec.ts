import { TurnRepo } from './turn.repo';

describe('TurnRepo', () => {
  it('uses prisma turn methods', async () => {
    const prisma = {
      turn: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 't1' }),
        findFirst: jest.fn().mockResolvedValue({ id: 't1', seq: 2 })
      }
    };

    const repo = new TurnRepo(prisma as never);
    await repo.getByTurnId('s1', 't1');
    await repo.appendTurn({
      session: { connect: { id: 's1' } },
      turnId: 't1',
      seq: 1,
      requestJson: {},
      outcomeJson: {},
      packetJson: {}
    });
    await repo.getLastTurn('s1');

    expect(prisma.turn.findUnique).toHaveBeenCalled();
    expect(prisma.turn.create).toHaveBeenCalled();
    expect(prisma.turn.findFirst).toHaveBeenCalled();
  });
});
