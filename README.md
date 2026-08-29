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
- `@repo/common`: zod schemas for the API, the shape types and the websocket
  protocol, shared by the frontend and both backends
- `@repo/backend-common`: shared backend config (JWT secret)
- `@repo/db`: the Prisma client and schema
- `@repo/eslint-config`: `eslint` configurations
- `@repo/typescript-config`: `tsconfig.json`s used throughout the monorepo

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

## How a board works

A board is a room, and a room is private. Membership is the single check every
read and write goes through, on both the HTTP API and the websocket server — a
room you are not a member of answers `404`, the same as one that does not exist.

You get into a room one of two ways: you created it, or you opened its invite
link. Every room carries a random invite code, so a room id on its own is not
enough to reach someone else's board.

```
POST /room              create a board (you become its first member)
POST /room/join         redeem an invite code
GET  /room              boards you are a member of
GET  /room/:id          one board, with its invite code if you own it
DELETE /room/:id        owner deletes it; anyone else leaves it
GET  /chats/:roomId     the strokes on a board, oldest first
```

The websocket protocol carries five client messages — `join_room`,
`leave_room`, `draw`, `update` and `erase`, plus `cursor` for presence. Every
frame is validated against the shared zod schema before anything is stored, and
each shape carries an id so it can be moved, restyled, undone or erased without
rewriting the whole board.

## Getting started

Install dependencies:

```sh
pnpm install
```

Set up the environment variables (see below), then run the migrations:

```sh
pnpm --filter @repo/db exec prisma migrate dev
pnpm --filter @repo/db exec prisma generate
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
