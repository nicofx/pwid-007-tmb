import { Global, Module } from '@nestjs/common';
import { SessionRepo } from './session.repo';
import { SnapshotRepo } from './snapshot.repo';
import { TelemetryRepo } from './telemetry.repo';
import { TurnRepo } from './turn.repo';

@Global()
@Module({
  providers: [SessionRepo, TurnRepo, SnapshotRepo, TelemetryRepo],
  exports: [SessionRepo, TurnRepo, SnapshotRepo, TelemetryRepo]
})
export class PersistenceModule {}
