import { Controller, Get, NotFoundException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../db/prisma.service';

@Controller()
@ApiTags('meta')
export class ApiMetaController {
  constructor(private readonly prisma: PrismaService) {}

  private async emit(eventName: string, payload?: Record<string, unknown>): Promise<void> {
    try {
      await this.prisma.telemetryEvent.create({
        data: {
          ts: new Date(),
          source: 'server',
          eventName,
          payloadJson: (payload ?? {}) as Prisma.InputJsonValue
        }
      });
    } catch {
      // Metadata endpoints must not fail if telemetry cannot be persisted.
    }
  }

  @Get()
  @ApiOperation({ summary: 'Índice raíz de la API' })
  async getRoot() {
    await this.emit('api_root_hit');
    return {
      name: 'take-me-back-api',
      version: process.env.APP_VERSION ?? '0.1.0',
      links: {
        docs: '/api/docs',
        openapi: '/openapi.json',
        health: '/health',
        ready: '/ready',
        profile: '/profile',
        profileSessions: '/profile/sessions',
        profileExport: '/profile/export',
        startSession: '/sessions/start',
        resumeSession: '/sessions/:id/resume',
        sessionTurns: '/sessions/:id/turns',
        turns: '/turns',
        telemetryClient: '/telemetry/client',
        adminConfig: '/admin/config',
        history: '/history'
      }
    };
  }

  @Get('docs')
  @ApiOperation({ summary: 'Alias textual a documentación API' })
  async getDocsAlias() {
    await this.emit('api_root_hit', { alias: 'docs' });
    return {
      message: 'Abrí /api/docs para Swagger UI o /openapi.json para el spec.'
    };
  }

  @Get('openapi.json')
  @ApiOperation({ summary: 'Spec OpenAPI básico en ruta de app (fallback)' })
  getOpenApiFallback() {
    return {
      openapi: '3.0.0',
      info: {
        title: 'Take Me Back API',
        version: process.env.APP_VERSION ?? '0.1.0'
      },
      note: 'Spec completo disponible en /api/docs cuando la app arranca por bootstrap.'
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check en root' })
  async getReady() {
    const dbConnected = this.prisma.getStatus().dbConnected;
    return {
      status: dbConnected ? 'ready' : 'not_ready',
      service: 'tmb-api',
      dbConnected
    };
  }

  @Get('meta/routes')
  @ApiOperation({ summary: 'Índice de rutas API (solo desarrollo)' })
  async getRoutes() {
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException();
    }

    await this.emit('api_routes_index_viewed');
    return {
      routes: [
        { method: 'GET', path: '/', description: 'API root index' },
        { method: 'GET', path: '/health', description: 'Health check' },
        { method: 'GET', path: '/ready', description: 'Readiness check' },
        { method: 'GET', path: '/api/docs', description: 'Swagger UI' },
        { method: 'GET', path: '/openapi.json', description: 'OpenAPI schema' },
        { method: 'GET', path: '/profile', description: 'Get or create profile' },
        { method: 'PATCH', path: '/profile', description: 'Update profile display name' },
        { method: 'GET', path: '/profile/sessions', description: 'List profile sessions' },
        { method: 'GET', path: '/profile/export', description: 'Export profile data' },
        { method: 'DELETE', path: '/profile', description: 'Wipe profile data' },
        { method: 'POST', path: '/sessions/start', description: 'Start session' },
        { method: 'GET', path: '/sessions/:id/resume', description: 'Resume session' },
        { method: 'GET', path: '/sessions/:id/turns', description: 'Session timeline' },
        { method: 'DELETE', path: '/sessions/:id', description: 'Delete run' },
        { method: 'POST', path: '/turns', description: 'Process turn' },
        { method: 'POST', path: '/telemetry/client', description: 'Client telemetry batch' },
        { method: 'GET', path: '/admin/config', description: 'Admin config (token required)' },
        { method: 'POST', path: '/admin/config', description: 'Admin config update (token required)' },
        { method: 'GET', path: '/admin/balance', description: 'Admin balance report (token required)' }
      ]
    };
  }
}
