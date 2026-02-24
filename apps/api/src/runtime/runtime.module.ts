import { Module } from '@nestjs/common';
import { PersistenceModule } from '../modules/persistence/persistence.module';
import { DbTelemetrySink } from './adapters/db-telemetry.sink';
import { FileCapsuleProvider } from './adapters/file-capsule.provider';
import { FilePresetProvider } from './adapters/file-preset.provider';
import { PlaceholderNarrativeProvider } from './adapters/placeholder-narrative.provider';
import { HttpLlmAdapter } from './narrative/adapters/http-llm.adapter';
import { MockLlmAdapter } from './narrative/adapters/mock-llm.adapter';
import { MemoryService } from './narrative/memory.service';
import { NarrativeContextBuilder } from './narrative/narrative-context.builder';
import { NarrativeGateway } from './narrative/narrative.gateway';
import { NarrativeGuardrailsService } from './narrative/narrative-guardrails.service';
import { PlaceholderNarrativeService } from './narrative/placeholder-narrative.service';
import { PostalComposerService } from './narrative/postal-composer.service';
import { RunSummaryService } from './narrative/run-summary.service';
import { SceneSummaryService } from './narrative/scene-summary.service';
import { LlmNarrativeProvider } from './narrative/providers/llm-narrative.provider';
import { DebugController } from './debug.controller';
import { AdminConfigController } from './admin-config.controller';
import { AdminBalanceController } from './admin-balance.controller';
import { AdminGuard } from './admin.guard';
import { HistoryController } from './history.controller';
import { ProfileController } from './profile.controller';
import { SessionsController } from './sessions.controller';
import { DebugService } from './services/debug.service';
import { HistoryService } from './services/history.service';
import { ProfileService } from './services/profile.service';
import { RuntimeEngineFactory } from './services/runtime-engine.factory';
import { SessionsService } from './services/sessions.service';
import { TelemetryController } from './telemetry.controller';
import { TurnsService } from './services/turns.service';
import { TurnsController } from './turns.controller';
import { RuntimeConfigStore } from './runtime-config.store';

@Module({
  imports: [PersistenceModule],
  controllers: [
    SessionsController,
    TurnsController,
    TelemetryController,
    DebugController,
    AdminConfigController,
    AdminBalanceController,
    HistoryController,
    ProfileController
  ],
  providers: [
    FileCapsuleProvider,
    FilePresetProvider,
    PlaceholderNarrativeProvider,
    PlaceholderNarrativeService,
    DbTelemetrySink,
    RuntimeEngineFactory,
    DebugService,
    HistoryService,
    ProfileService,
    SessionsService,
    TurnsService,
    NarrativeContextBuilder,
    NarrativeGuardrailsService,
    NarrativeGateway,
    MemoryService,
    SceneSummaryService,
    RunSummaryService,
    PostalComposerService,
    LlmNarrativeProvider,
    HttpLlmAdapter,
    MockLlmAdapter,
    RuntimeConfigStore,
    AdminGuard
  ]
})
export class RuntimeModule {}
