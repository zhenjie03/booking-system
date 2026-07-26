# Booking System

A full-stack appointment booking system with separate Client and Admin experiences: browse staff and services, pick an available time slot on a calendar, and book — with real concurrency-safe protection against double-booking. Admins manage staff, services, weekly schedules, and the booking board from a role-gated dashboard.

## Stack

- **Backend**: Node.js, TypeScript, Express, [Drizzle ORM](https://orm.drizzle.team/) over PostgreSQL ([Supabase](https://supabase.com))
- **Auth**: JWT (bcryptjs + jsonwebtoken), role-based access control (`CLIENT` / `ADMIN`)
- **Frontend**: React, Vite, TypeScript, react-router-dom, @tanstack/react-query, react-day-picker
- **Testing**: Vitest + Supertest

Backend and frontend are two independent npm projects in the same repo: the root is the API server, `client/` is the SPA. They talk over a plain REST API — no shared code, no monorepo tooling.

## Why these choices

- **Drizzle over Prisma**: Prisma's native migration engine binary got blocked by Windows' Application Control policy during development. Drizzle + `pg` (node-postgres) is pure JS/TS over a TCP connection — no native binary to trip that class of issue, on Windows or anywhere else.
- **Anti-double-booking, two layers deep**: the availability algorithm (`src/services/slotAlgorithm.ts`) filters out conflicting candidate slots before they're ever shown to a client, but the actual guarantee against a race condition — two people booking the same slot at the same instant — is a PostgreSQL `EXCLUDE USING gist` constraint on the `bookings` table (see `src/db/sql/001_no_overlap_constraint.sql`). The database physically rejects the overlapping insert; the API just translates that into a `409 Conflict`.

## Project layout

```
src/                   Express API
  db/schema.ts          Drizzle table definitions
  db/sql/                Raw SQL migrations not expressible in Drizzle's schema (the EXCLUDE constraint)
  services/              Slot-generation algorithm (pure logic + DB-backed wrapper)
  routes/                auth, staff/services (public), bookings, admin/*
  middleware/auth.ts      JWT verification + role gating
tests/
  unit/                  Pure-function tests for the slot algorithm (no DB)
  integration/           Supertest against the real Express app + a real Postgres test DB
client/
  src/pages/              Client booking flow (Login/Register/Book/My Bookings)
  src/pages/admin/        Admin dashboard (Bookings/Staff/Services + per-staff detail)
```

## Setup

Requires a Postgres database — this project was built against a free [Supabase](https://supabase.com) project.

**1. Backend (repo root)**

```bash
npm install
```

Create `.env` (see `.env.example`):

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=some-long-random-string
CLIENT_ORIGIN=http://localhost:5173
```

Push the schema and apply the one raw-SQL constraint, then seed some demo data:

```bash
npm run db:push
node --env-file=.env --import tsx scripts/apply-sql.ts src/db/sql/001_no_overlap_constraint.sql
npm run db:seed
```

Run it:

```bash
npm run dev        # http://localhost:3000
```

**2. Frontend (`client/`)**

```bash
cd client
npm install
```

Create `client/.env`:

```
VITE_API_URL=http://localhost:3000/api
```

```bash
npm run dev         # http://localhost:5173
```

**3. Get an admin account**

Registering always creates a `CLIENT`. Promote one manually once you have a user:

```sql
update users set role = 'ADMIN' where email = 'you@example.com';
```

Log in again after promoting — the role is baked into the JWT at login time.

## Testing

```bash
npm test
```

Runs both the pure unit tests for the slot algorithm and integration tests that hit the real database through the Express app (register/login/RBAC, and the actual `409` conflict path enforced by the Postgres constraint). Integration tests create and clean up their own scratch data.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md).
