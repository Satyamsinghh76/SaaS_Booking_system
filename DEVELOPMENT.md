# Local Development Guide

## Prerequisites

| Tool | Minimum version | Install |
|------|-----------------|---------|
| Node.js | 20+ | https://nodejs.org |
| npm | 9+ | bundled with Node.js |
| pnpm | 8+ | `npm install -g pnpm` |
| PostgreSQL | 14+ | https://www.postgresql.org/download |

---

## 1. Install dependencies

From the **project root** (`SaaS/`), run:

```bash
npm run install:all
```

This command:
1. Installs root-level tools (e.g. `concurrently`)
2. Installs backend dependencies in `server/`
3. Installs frontend dependencies in `client/`

Or install separately:

```bash
npm install                   # root tools
npm install --prefix server   # backend
pnpm install --dir client     # frontend
```

---

## 2. Configure environment variables

### Backend — `server/.env`

A ready-to-use dev file has already been created at `server/.env`.

Open it and update the values marked below:

| Variable | What to change |
|----------|---------------|
| `DB_PASSWORD` | Your local PostgreSQL password (default is `postgres`) |
| `JWT_SECRET` | Any random string ≥ 32 characters |
| `JWT_REFRESH_SECRET` | A **different** random string ≥ 32 characters |
| `STRIPE_SECRET_KEY` | Your Stripe **test** key from [dashboard.stripe.com](https://dashboard.stripe.com/apikeys) |
| `STRIPE_WEBHOOK_SECRET` | Your Stripe webhook secret (`whsec_...`) |

**Generate secure JWT secrets:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run this twice — once for `JWT_SECRET`, once for `JWT_REFRESH_SECRET`.

> Stripe, email, Google Calendar, and Twilio are all **optional** for local development.  
> The server starts without them.

### Frontend — `client/.env.local`

A ready-to-use file has already been created at `client/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

No changes needed for local development.

---

## 3. Set up the database

Create the database and run the schema:

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE saas_booking;"

# Apply schema (tables, indexes, constraints, seed data)
psql -U postgres -d saas_booking -f server/db/schema.sql
```

> **Windows note:** If `psql` is not in PATH, use the full path:  
> `"C:\Program Files\PostgreSQL\16\bin\psql.exe"`

---

## 4. Run the project

### Start everything (recommended)

```bash
npm run dev
```

This starts both servers in parallel with colour-coded log output:

| Colour | Process | URL |
|--------|---------|-----|
| 🔵 blue | Express API (nodemon) | http://localhost:5000 |
| 🟢 green | Next.js dev server | http://localhost:3000 |

Press `Ctrl + C` to stop both servers.

### Start individually

```bash
npm run server   # Express backend only  (port 5000, auto-reloads on save)
npm run client   # Next.js frontend only (port 3000, HMR)
```

---

## 5. Verify the setup

| Check | Expected |
|-------|----------|
| http://localhost:3000 | BookFlow landing page |
| http://localhost:5000/health | `{ "status": "ok" }` |
| http://localhost:3000/login | Login form (submits to API) |

---

## Available scripts

Run these from the **project root**:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API + frontend simultaneously |
| `npm run server` | Backend only (Express + nodemon, auto-reload) |
| `npm run client` | Frontend only (Next.js HMR) |
| `npm run build` | Production build of the Next.js frontend |
| `npm run test` | Run the backend Jest test suite |
| `npm run type-check` | TypeScript type-check of the frontend |
| `npm run install:all` | Install all dependencies (root + server + client) |

---

## Project structure

```
SaaS/
├── package.json          ← root scripts (dev, server, client, …)
├── DEVELOPMENT.md        ← this file
│
├── server/               ← Express API (Node.js ≥ 20)
│   ├── server.js         ← entry point
│   ├── config/           ← env, database, jwt, logger, stripe
│   ├── controllers/      ← request handlers
│   ├── middleware/        ← auth, rate-limit, validation, error handler
│   ├── models/           ← DB queries (pg pool)
│   ├── routes/           ← route definitions
│   ├── services/         ← external service wrappers (email, sms, stripe)
│   ├── jobs/             ← cron jobs (reminders, cleanup)
│   ├── db/schema.sql     ← database schema
│   ├── .env              ← local environment variables  ⚠ git-ignored
│   └── .env.example      ← template to copy from
│
└── client/               ← Next.js 16 + React 19 frontend
    ├── app/              ← App Router pages
    ├── components/       ← shadcn/ui components
    ├── lib/              ← Zustand store, Axios API client
    ├── .env.local        ← local environment variables  ⚠ git-ignored
    └── .env.local.example ← template to copy from
```

---

## Troubleshooting

**"Missing required environment variable" on server start**  
→ Make sure `server/.env` exists and has `DB_*` vars and both JWT secrets (≥ 32 chars each).

**"ECONNREFUSED" or DB connection error**  
→ Ensure PostgreSQL is running and `DB_PASSWORD` in `server/.env` matches your install.  
→ On Windows: check Services (`services.msc`) for `postgresql-x64-*` and start it.

**`pnpm: command not found`**  
→ Run `npm install -g pnpm` then try again.

**Port already in use (5000 or 3000)**  
→ Change `PORT` in `server/.env` and/or pass `--port` to Next.js:  
```bash
# client/package.json → "dev": "next dev --port 3001"
```

**Frontend can't reach the API**  
→ Check `NEXT_PUBLIC_API_URL` in `client/.env.local` matches the server port.
