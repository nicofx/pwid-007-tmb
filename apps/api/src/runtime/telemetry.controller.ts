import { Body, Controller, Logger, Post } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TelemetryRepo } from '../modules/persistence/telemetry.repo';
import { ClientTelemetryBatchDto } from './dto/client-telemetry.dto';

const MAX_BATCH = 50;
const asJson = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;

@Controller('telemetry')
export class TelemetryController {
  private readonly logger = new Logger(TelemetryController.name);

  constructor(private readonly telemetryRepo: TelemetryRepo) {}

  @Post('client')
  async ingestClientTelemetry(@Body() dto: ClientTelemetryBatchDto): Promise<{ accepted: true }> {
    const batch = dto.events.slice(0, MAX_BATCH).map((event) => ({
      ts: new Date(event.ts),
      source: 'client' as const,
      deviceId: dto.deviceId,
      sessionId: event.sessionId,
      turnId: event.turnId,
      eventName: event.eventName,
      payloadJson: event.payload ? asJson(event.payload) : undefined
    }));

    if (batch.length > 0) {
      await this.telemetryRepo.appendEvents(batch);
    }

    this.logger.log(
      JSON.stringify({
        event: 'telemetry_batch_ingested',
        telemetry_batch_size: batch.length,
        deviceId: dto.deviceId
      })
    );

    return { accepted: true };
  }
}
