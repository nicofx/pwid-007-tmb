import { flushTelemetry, trackClientEvent } from './telemetryClient';
import { sendClientEvents } from './apiClient';

jest.mock('./apiClient', () => ({
  sendClientEvents: jest.fn().mockResolvedValue(undefined)
}));

describe('telemetryClient', () => {
  it('flushes queued events in batch', async () => {
    (sendClientEvents as jest.Mock).mockClear();

    trackClientEvent({ eventName: 'turn_sent', ts: new Date().toISOString(), sessionId: 's1' });
    trackClientEvent({ eventName: 'turn_received', ts: new Date().toISOString(), sessionId: 's1' });

    await flushTelemetry('device-1');

    expect(sendClientEvents).toHaveBeenCalled();
    const payloads = (sendClientEvents as jest.Mock).mock.calls.map((call) => call[0]);
    const serialized = JSON.stringify(payloads);
    expect(serialized).toContain('turn_sent');
    expect(serialized).toContain('turn_received');
  });
});
