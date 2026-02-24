import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { OutcomeType } from '@tmb/contracts';
import { PrismaService } from '../db/prisma.service';
import { TelemetryRepo } from '../modules/persistence/telemetry.repo';
import { AdminGuard } from './admin.guard';

interface BalanceBucket {
  presetId: string;
  totalTurns: number;
  outcomes: Record<OutcomeType, number>;
  blockedRate: number;
  avgDeltaAbs: {
    suspicion: number;
    tension: number;
    clock: number;
    risk: number;
  };
}

@Controller('admin/balance')
@UseGuards(AdminGuard)
@ApiTags('admin')
@ApiHeader({
  name: 'x-admin-token',
  required: true,
  description: 'Token de administración para endpoints admin'
})
export class AdminBalanceController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telemetryRepo: TelemetryRepo
  ) {}

  @Get()
  @ApiOperation({ summary: 'Reporte de balance agregado' })
  async getBalance() {
    const turns = await this.prisma.turn.findMany({
      where: { seq: { gt: 0 } },
      select: {
        outcomeJson: true,
        deltasJson: true,
        session: {
          select: {
            presetId: true
          }
        }
      }
    });

    const byPreset = new Map<string, BalanceBucket>();

    for (const turn of turns) {
      const presetId = turn.session.presetId ?? 'default';
      const bucket = byPreset.get(presetId) ?? {
        presetId,
        totalTurns: 0,
        outcomes: { SUCCESS: 0, PARTIAL: 0, FAIL_FORWARD: 0, BLOCKED: 0 },
        blockedRate: 0,
        avgDeltaAbs: { suspicion: 0, tension: 0, clock: 0, risk: 0 }
      };

      const outcome = (turn.outcomeJson as { outcome?: OutcomeType }).outcome ?? 'PARTIAL';
      bucket.totalTurns += 1;
      bucket.outcomes[outcome] += 1;

      const stateDelta =
        (turn.deltasJson as { state?: Record<string, number> } | null)?.state ?? {};
      bucket.avgDeltaAbs.suspicion += Math.abs(stateDelta.suspicion ?? 0);
      bucket.avgDeltaAbs.tension += Math.abs(stateDelta.tension ?? 0);
      bucket.avgDeltaAbs.clock += Math.abs(stateDelta.clock ?? 0);
      bucket.avgDeltaAbs.risk += Math.abs(stateDelta.risk ?? 0);

      byPreset.set(presetId, bucket);
    }

    const rows = Array.from(byPreset.values()).map((bucket) => {
      const divisor = Math.max(bucket.totalTurns, 1);
      return {
        ...bucket,
        blockedRate: bucket.outcomes.BLOCKED / divisor,
        avgDeltaAbs: {
          suspicion: Number((bucket.avgDeltaAbs.suspicion / divisor).toFixed(2)),
          tension: Number((bucket.avgDeltaAbs.tension / divisor).toFixed(2)),
          clock: Number((bucket.avgDeltaAbs.clock / divisor).toFixed(2)),
          risk: Number((bucket.avgDeltaAbs.risk / divisor).toFixed(2))
        }
      };
    });

    const latencyEvents = await this.prisma.telemetryEvent.findMany({
      where: { eventName: 'turn_received' },
      select: { payloadJson: true }
    });

    const latencies = latencyEvents
      .map((event) => {
        const value = (event.payloadJson as { latency_ms?: number } | null)?.latency_ms;
        return typeof value === 'number' ? value : null;
      })
      .filter((value): value is number => value !== null);

    const avgLatencyMs =
      latencies.length > 0
        ? Number((latencies.reduce((acc, value) => acc + value, 0) / latencies.length).toFixed(2))
        : 0;

    await this.telemetryRepo.appendEvent({
      ts: new Date(),
      source: 'server',
      eventName: 'admin_balance_viewed',
      payloadJson: { presets: rows.length, totalTurns: turns.length }
    });

    return {
      totalTurns: turns.length,
      avgLatencyMs,
      presets: rows
    };
  }
}
