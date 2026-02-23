# Take Me Back (TMB) - Baseline S00

Monorepo base para desarrollo con:

- `apps/web` (Next.js App Router)
- `apps/api` (NestJS)
- `packages/contracts` (tipos compartidos)
- `packages/config` (config compartida)
- Postgres vía `docker-compose`

## Prerrequisitos

- Node.js 20.x (`nvm use` con `.nvmrc`)
- `corepack` habilitado
- Docker + Docker Compose

## Setup

```bash
corepack enable
pnpm install
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

## Levantar base de datos

```bash
docker compose up -d
```

## Desarrollo

```bash
pnpm dev
```

URLs:

- Web: http://localhost:3000
- API health: http://localhost:3001/health

## Scripts útiles

```bash
pnpm lint
pnpm format
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
pnpm --filter api prisma:generate
```

## Estructura

```text
apps/
  api/
  web/
packages/
  config/
  contracts/
docs/
  foundation/
  roadmap/
  sprints/
  adr/
```
