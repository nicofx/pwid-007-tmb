import { Injectable } from '@nestjs/common';
import type { ITelemetrySink } from '@tmb/runtime';

@Injectable()
export class InMemoryTelemetrySink implements ITelemetrySink {
  readonly events: unknown[] = [];

  emitSessionEvent(event: Parameters<ITelemetrySink['emitSessionEvent']>[0]): void {
    this.events.push({ ...event, at: new Date().toISOString() });
  }

  emitTurnEvent(event: Parameters<ITelemetrySink['emitTurnEvent']>[0]): void {
    this.events.push({ ...event, at: new Date().toISOString() });
  }

  appendClientEvent(event: {
    sessionId?: string;
    event: string;
    ts: string;
    payload?: Record<string, unknown>;
  }): void {
    this.events.push({
      type: 'client_event',
      ...event,
      at: new Date().toISOString()
    });
  }
}
