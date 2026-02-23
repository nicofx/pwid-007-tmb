# ADR-0001: Stack y Monorepo Baseline

## Estado

Accepted - 2026-02-23

## Contexto

Necesitamos un baseline ejecutable para desarrollo local con web, api y postgres, compartiendo contratos TS y tooling de calidad.

## Decisión

- Monorepo con pnpm workspaces.
- `apps/web`: Next.js App Router.
- `apps/api`: NestJS.
- `packages/contracts`: tipos compartidos.
- `packages/config`: configuración compartida de TypeScript, ESLint y Prettier.
- Postgres en docker-compose para entorno dev.

## Consecuencias

- Menor fricción inicial y acoplamiento bajo entre apps.
- Contratos centralizados para evitar drift.
- Se difiere la complejidad (engine, workers, persistencia de negocio) a sprints posteriores.
