import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const DEFAULT_DATABASE_URL = 'postgresql://tmb:tmb@localhost:5432/tmb?schema=public';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private dbReachable = false;
  private readonly effectiveDatabaseUrl: string;

  constructor() {
    const resolvedDatabaseUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
    super({
      datasources: {
        db: {
          url: resolvedDatabaseUrl
        }
      }
    });
    this.effectiveDatabaseUrl = resolvedDatabaseUrl;
  }

  async onModuleInit(): Promise<void> {
    try {
      if (!process.env.DATABASE_URL) {
        this.logger.warn(`DATABASE_URL missing, using default local url=${DEFAULT_DATABASE_URL}`);
      }
      await this.$connect();
      await this.$queryRaw`SELECT 1`;
      this.dbReachable = true;
      this.logger.log(`db_connected=true db_url=${this.effectiveDatabaseUrl}`);
    } catch {
      this.dbReachable = false;
      this.logger.warn('db_connected=false');
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  getStatus(): { dbConnected: boolean } {
    return { dbConnected: this.dbReachable };
  }
}
