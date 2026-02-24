import { Global, Module } from '@nestjs/common';
import { ProfileRepo } from './profile.repo';
import { SessionRepo } from './session.repo';
import { SnapshotRepo } from './snapshot.repo';
import { TelemetryRepo } from './telemetry.repo';
import { TurnRepo } from './turn.repo';

@Global()
@Module({
  providers: [ProfileRepo, SessionRepo, TurnRepo, SnapshotRepo, TelemetryRepo],
  exports: [ProfileRepo, SessionRepo, TurnRepo, SnapshotRepo, TelemetryRepo]
})
export class PersistenceModule {}
