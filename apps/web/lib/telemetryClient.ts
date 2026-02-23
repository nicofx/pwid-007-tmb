import { sendClientEvents, type ClientTelemetryEvent } from './apiClient';
import { getOrCreateDeviceId } from './deviceId';

const queue: ClientTelemetryEvent[] = [];
let flushing = false;
const MAX_BATCH = 50;

export function trackClientEvent(event: ClientTelemetryEvent): void {
  queue.push(event);
  void flushTelemetry();
}

export async function flushTelemetry(deviceId = getOrCreateDeviceId()): Promise<void> {
  if (flushing || queue.length === 0) {
    return;
  }

  flushing = true;
  while (queue.length > 0) {
    const batch = queue.splice(0, MAX_BATCH);
    try {
      await sendClientEvents({ deviceId, events: batch });
    } catch {
      queue.unshift(...batch);
      break;
    }
  }
  flushing = false;
}
