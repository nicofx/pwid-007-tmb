import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TelemetryRepo } from '../modules/persistence/telemetry.repo';
import { AdminGuard } from './admin.guard';
import { UpdateAdminConfigDto } from './dto/admin-config.dto';
import { RuntimeConfigStore } from './runtime-config.store';

@Controller('admin/config')
@UseGuards(AdminGuard)
@ApiTags('admin')
@ApiHeader({
  name: 'x-admin-token',
  required: true,
  description: 'Token de administración para endpoints admin'
})
export class AdminConfigController {
  constructor(
    private readonly runtimeConfigStore: RuntimeConfigStore,
    private readonly telemetryRepo: TelemetryRepo
  ) {}

  @Get()
  @ApiOperation({ summary: 'Leer configuración runtime de admin' })
  async getConfig() {
    const current = this.runtimeConfigStore.get();
    return {
      ...current,
      llmApiKey: current.llmApiKey ? '***' : undefined
    };
  }

  @Post()
  @ApiOperation({ summary: 'Actualizar configuración runtime de admin' })
  async updateConfig(@Body() dto: UpdateAdminConfigDto) {
    const next = this.runtimeConfigStore.update(dto);

    await this.telemetryRepo.appendEvent({
      ts: new Date(),
      source: 'server',
      eventName: 'admin_config_changed',
      payloadJson: {
        narrativeMode: next.narrativeMode,
        llmAdapter: next.llmAdapter,
        llmModel: next.llmModel,
        narrativeTimeoutMs: next.narrativeTimeoutMs,
        narrativeCacheSize: next.narrativeCacheSize,
        wedEnabled: next.wedEnabled
      }
    });

    return {
      ...next,
      llmApiKey: next.llmApiKey ? '***' : undefined
    };
  }
}
