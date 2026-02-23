import type { IClockPolicy } from '../ports/interfaces.js';

export class SystemClockPolicy implements IClockPolicy {
  nowIso(): string {
    return new Date().toISOString();
  }
}
