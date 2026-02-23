import { FileCapsuleProvider } from './file-capsule.provider';

describe('FileCapsuleProvider', () => {
  it('loads capsule from docs/foundation/capsules', async () => {
    const provider = new FileCapsuleProvider();
    const capsule = await provider.getCapsule('berlin-1933');
    expect(capsule.capsuleId).toBe('berlin-1933');
    expect(capsule.beats.length).toBeGreaterThan(0);
    expect((capsule.worldEvents?.events.length ?? 0) >= 8).toBe(true);
    expect((capsule.worldEvents?.events.length ?? 0) <= 12).toBe(true);
  });
});
