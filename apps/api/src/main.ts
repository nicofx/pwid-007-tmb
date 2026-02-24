import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { deviceIdMiddleware } from './common/device-id.middleware';
import { loadEnv } from './load-env';

async function bootstrap(): Promise<void> {
  loadEnv();
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('HTTP');
  const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3000';

  app.enableCors({
    origin: webOrigin,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Token', 'X-Tmb-Device-Id'],
    exposedHeaders: ['X-Tmb-Narrative-Provider']
  });

  app.use(deviceIdMiddleware);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true
    })
  );

  app.use((req: Request, res: Response, next: NextFunction) => {
    const startedAt = Date.now();
    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      logger.log(`${req.method} ${req.url} ${res.statusCode} ${durationMs}ms`);
    });
    next();
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Take Me Back API')
    .setDescription('Explorador de endpoints de desarrollo')
    .setVersion(process.env.APP_VERSION ?? '0.1.0')
    .addApiKey({ type: 'apiKey', in: 'header', name: 'x-tmb-device-id' }, 'deviceId')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  app.getHttpAdapter().get('/openapi.json', (_req: Request, res: Response) => {
    res.json(swaggerDocument);
  });
  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true
    }
  });

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  Logger.log(`tmb-api listening on http://localhost:${port}`, 'Bootstrap');
  Logger.log(`cors_enabled_for=${webOrigin}`, 'Bootstrap');
}

void bootstrap();
