import { Module } from '@nestjs/common';
import { DbModule } from './db/db.module';
import { HealthController } from './health/health.controller';
import { RuntimeModule } from './runtime/runtime.module';

@Module({
  imports: [DbModule, RuntimeModule],
  controllers: [HealthController]
})
export class AppModule {}
