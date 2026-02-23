import { Injectable } from '@nestjs/common';
import {
  TurnEngine,
  type IRuntimeDeps,
  SessionStateFactory,
  SeededRngFactory,
  SystemClockPolicy
} from '@tmb/runtime';
import { FileCapsuleProvider } from '../adapters/file-capsule.provider';
import { DbTelemetrySink } from '../adapters/db-telemetry.sink';

@Injectable()
export class RuntimeEngineFactory {
  constructor(
    private readonly capsuleProvider: FileCapsuleProvider,
    private readonly telemetrySink: DbTelemetrySink
  ) {}

  create(): TurnEngine {
    const deps: IRuntimeDeps = {
      capsuleProvider: this.capsuleProvider,
      telemetrySink: this.telemetrySink,
      rngFactory: new SeededRngFactory(),
      clock: new SystemClockPolicy()
    };

    return new TurnEngine(deps, new SessionStateFactory());
  }
}
