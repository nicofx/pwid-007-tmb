# DB Quickstart

## Prerequisitos

- Docker y Docker Compose
- Variables de entorno (`DATABASE_URL`)

## Levantar DB

```bash
docker compose up -d
```

## Migrar schema

```bash
pnpm --filter api db:migrate
```

## Resetear DB

```bash
pnpm --filter api db:reset
```

## Correr integración

```bash
pnpm --filter api test:integration
```
