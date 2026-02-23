import { Injectable } from '@nestjs/common';
import type { ITelemetrySink } from '@tmb/runtime';
import { TelemetryRepo } from '../../modules/persistence/telemetry.repo';

@Injectable()
export class DbTelemetrySink implements ITelemetrySink {
  constructor(private readonly telemetryRepo: TelemetryRepo) {}

  async emitSessionEvent(event: Parameters<ITelemetrySink['emitSessionEvent']>[0]): Promise<void> {
    await this.telemetryRepo.appendEvent({
      ts: new Date(),
      source: 'server',
      sessionId: event.sessionId,
      eventName: event.type,
      payloadJson: event
    });
  }

  async emitTurnEvent(event: Parameters<ITelemetrySink['emitTurnEvent']>[0]): Promise<void> {
    await this.telemetryRepo.appendEvent({
      ts: new Date(),
      source: 'server',
      sessionId: event.sessionId,
      turnId: event.turnId,
      eventName: event.type,
      payloadJson: event
    });
  }
}
