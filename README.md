# Exciladraw

An open-source, real-time collaborative whiteboard. Draw shapes, arrows and freehand
strokes on an infinite canvas — every stroke syncs live with everyone in the room.

## What's inside?

This Turborepo includes the following apps and packages:

### Apps

- `exciladraw-frontend`: the main [Next.js](https://nextjs.org/) app — landing page, auth, rooms and the drawing canvas
- `http-backend`: an Express API for auth, rooms and persisted strokes
- `ws-backend`: a WebSocket server that broadcasts strokes to everyone in a room
- `web`: a small Next.js playground app used while prototyping

### Packages

- `@repo/ui`: shared React components
- `@repo/common`: zod schemas shared between the frontend and the backends
- `@repo/backend-common`: shared backend config (JWT secret)
- `@repo/db`: the Prisma client and schema
- `@repo/eslint-config`: `eslint` configurations
- `@repo/typescript-config`: `tsconfig.json`s used throughout the monorepo

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

## Getting started

Install dependencies:

```sh
pnpm install
```

Set up the environment variables (see below), then push the Prisma schema:

```sh
pnpm --filter @repo/db exec prisma migrate dev
```

Run everything in development:

```sh
pnpm dev
```

By default:

- frontend → http://localhost:3000
- http-backend → http://localhost:3001
- ws-backend → ws://localhost:8080

## Environment variables

`apps/exciladraw-frontend/.env.local`

| Variable                   | Default                 | Description               |
| -------------------------- | ----------------------- | ------------------------- |
| `NEXT_PUBLIC_HTTP_BACKEND` | `http://localhost:3001` | URL of the HTTP API       |
| `NEXT_PUBLIC_WS_URL`       | `ws://localhost:8080`   | URL of the WebSocket server |

`apps/http-backend` / `apps/ws-backend`

| Variable       | Default            | Description                             |
| -------------- | ------------------ | --------------------------------------- |
| `PORT`         | `3001` / `8080`    | Port to listen on                       |
| `CORS_ORIGIN`  | `*`                | Allowed origin for the HTTP API         |
| `JWT_SECRET`   | —                  | Secret used to sign and verify tokens   |
| `DATABASE_URL` | —                  | Postgres connection string for Prisma   |

## Build

```sh
pnpm build
```

Build a single app with a [filter](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters):

```sh
pnpm build --filter=exciladraw-frontend
```

## Type checking and linting

```sh
pnpm check-types
pnpm lint
```

## Health checks

Both backends expose `GET /health`, which returns `{"status":"ok"}` — handy for uptime
pings on platforms that sleep idle services.
