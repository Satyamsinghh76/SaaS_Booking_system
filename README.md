<div align="center">

# BookFlow

**A full-stack SaaS booking platform for modern businesses**

Manage appointments, services, payments, notifications, and analytics — all from one dashboard.

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

[Live Demo](https://booking-system-by-satyam.vercel.app) · [Report Bug](https://github.com/Satyamsinghh76/SaaS_Booking_system/issues) · [Request Feature](https://github.com/Satyamsinghh76/SaaS_Booking_system/issues)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Overview](#database-overview)
- [API Endpoints](#api-endpoints)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Deployment](#deployment)
- [Security Features](#security-features)
- [Monitoring & Logging](#monitoring--logging)
- [Future Improvements](#future-improvements)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

---

## Overview

BookFlow is a production-grade SaaS booking platform built as a full-stack monorepo. It provides everything a service-based business needs: online scheduling, payment collection, automated reminders, real-time analytics, and admin management tools.

The platform supports two user roles — **customers** who browse services and book appointments, and **admins** who manage the platform, confirm bookings, track revenue, and oversee operations.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Next.js)                        │
│  App Router · React 19 · Tailwind CSS · Zustand · Framer Motion │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS / REST
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API SERVER (Express.js)                    │
│  JWT Auth · Rate Limiting · Validation · Winston Logging         │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │  Routes   │ │  Ctrl    │ │  Models  │ │  Middleware       │   │
│  │  12 files │ │  handlers│ │  SQL/PG  │ │  auth · validate  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└───────┬──────────┬──────────┬──────────┬───────────────────────┘
        │          │          │          │
        ▼          ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌────────┐ ┌──────────────┐
│PostgreSQL│ │  Brevo   │ │ Twilio │ │ Google APIs   │
│ Database │ │HTTP Email│ │  SMS   │ │ OAuth + Cal   │
└──────────┘ └──────────┘ └────────┘ └──────────────┘
```

---

## Features

### Customer Features

| Feature | Description |
|---|---|
| Google OAuth + Email Login | Sign up with Google or email/password with verification |
| Service Browsing | Search, filter by category, grid/list view with 3D tilt cards |
| Smart Booking Wizard | 3-step flow: Service → Date & Time → Confirm |
| Slot Recommendations | AI-powered suggestions based on availability patterns |
| Booking Management | View, reschedule, cancel bookings from dashboard |
| Demo Payments | Simulated card payment with validation (MM/YY, CVV, expiry) |
| Notifications | In-app bell icon + email + SMS confirmations and reminders |
| Google Calendar | Add bookings to Google Calendar with one click |
| Dark / Light Mode | Theme toggle persisted in localStorage |
| Settings | Profile, password change, notification preferences, billing history |

### Admin Features

| Feature | Description |
|---|---|
| Admin Dashboard | Real-time KPI cards, revenue charts, top services, reviews |
| Revenue Analytics | Switchable weekly / monthly / yearly views (2020–present) |
| Booking Management | Confirm, complete, or cancel any booking with notifications |
| Service CRUD | Create, edit, delete services with categories and pricing |
| Email 2FA | Admin login requires email verification on every attempt |
| Customer Visibility | View customer name, email, phone, and booking details |

### Platform Features

| Feature | Description |
|---|---|
| Double-Booking Prevention | PostgreSQL EXCLUDE constraint + advisory locks |
| Rate Limiting | 200 req/15min general, 20 req/15min auth |
| JWT + Refresh Tokens | Access token rotation with httpOnly refresh cookies |
| Graceful Shutdown | 30s drain period with DB pool cleanup |
| Health Checks | `/health` (liveness) and `/ready` (readiness with DB check) |
| Email Delivery | Brevo HTTP API (production) with SMTP fallback (dev) |
| Email Support | Contact form sends HTML emails to admin inbox |
| Live Chat | Tawk.to integration across all pages |
| Blog | Full articles with slug-based routing |
| Static Pages | Features, Pricing, About, Docs, Help, Privacy, Terms, Cookies |

---

## Tech Stack

### Backend

| Technology | Purpose |
|---|---|
| Node.js 20+ | Runtime |
| Express.js 4.19 | HTTP framework |
| PostgreSQL 14+ | Primary database |
| pg (node-postgres) | Database driver with connection pooling |
| jsonwebtoken | JWT access and refresh tokens |
| bcryptjs | Password hashing (12 salt rounds) |
| Brevo API | Transactional email via HTTP (production) |
| Nodemailer | Email via SMTP (local development fallback) |
| Twilio | SMS confirmations and reminders |
| googleapis | Google Calendar sync |
| Stripe SDK | Payment processing (demo mode) |
| Winston | Structured logging with daily rotation |
| node-cron | Scheduled SMS reminder jobs |
| express-validator | Input validation |
| Helmet | Security headers |
| express-rate-limit | API rate limiting |

### Frontend

| Technology | Purpose |
|---|---|
| Next.js 16.1.6 | React framework (App Router) |
| React 19 | UI library |
| Tailwind CSS 4 | Utility-first styling |
| Radix UI + Shadcn/ui | Accessible component primitives |
| Zustand | Client state management |
| React Hook Form + Zod | Form handling and validation |
| Framer Motion | Animations and transitions |
| Recharts | Data visualization |
| React Parallax Tilt | 3D card hover effects |
| Axios | HTTP client with interceptors |
| @react-oauth/google | Google sign-in |

### Infrastructure

| Technology | Purpose |
|---|---|
| pnpm | Frontend package manager |
| npm | Backend + root package manager |
| concurrently | Run server + client in parallel |
| nodemon | Backend hot reload |
| dotenv | Environment variable management |

---

## Project Structure

```
BookFlow/
│
├── client/                          # Next.js frontend
│   ├── app/                         # App Router pages
│   │   ├── admin/                   #   Admin dashboard, bookings, services
│   │   ├── booking/                 #   Multi-step booking wizard
│   │   ├── dashboard/               #   User dashboard, bookings, history, settings
│   │   ├── login/                   #   Login (email + Google OAuth)
│   │   ├── signup/                  #   Registration with email verification
│   │   ├── services/                #   Service listing with filters
│   │   ├── payment/                 #   Demo payment page
│   │   ├── support/                 #   Email support form
│   │   ├── blog/                    #   Blog listing + [slug] articles
│   │   ├── features/                #   Features showcase
│   │   ├── pricing/                 #   Pricing plans
│   │   ├── about/                   #   About page
│   │   ├── help/                    #   Help center with FAQ
│   │   ├── documentation/           #   Platform docs
│   │   ├── privacy/                 #   Privacy policy
│   │   ├── terms/                   #   Terms of service
│   │   └── cookies/                 #   Cookie policy
│   ├── components/                  # Reusable components
│   │   ├── ui/                      #   Shadcn/ui primitives
│   │   ├── dashboard/               #   Notification bell, sidebar
│   │   ├── navbar.tsx               #   Global navigation (role-aware)
│   │   └── footer.tsx               #   Site footer
│   ├── lib/                         # Utilities
│   │   ├── api/                     #   API client modules (auth, bookings, payments)
│   │   ├── store.ts                 #   Zustand global state
│   │   ├── blog-data.ts             #   Blog content
│   │   └── utils.ts                 #   Helper functions
│   └── public/                      # Static assets
│
├── server/                          # Express.js backend
│   ├── config/                      #   Database pool, JWT, logger, env validation
│   ├── controllers/                 #   Request handlers (auth, booking, service, etc.)
│   ├── middleware/                   #   Auth, validation, error handler, rate limiter
│   ├── models/                      #   PostgreSQL query layer
│   ├── routes/                      #   12 route modules
│   ├── services/                    #   Email, SMS, notification services
│   ├── utils/                       #   Double-booking guard, recommendations engine
│   ├── jobs/                        #   Cron scheduler (SMS reminders)
│   ├── templates/                   #   HTML email templates
│   ├── db/                          #   schema.sql (PostgreSQL DDL)
│   └── server.js                    #   Application entry point
│
├── package.json                     # Root monorepo scripts
└── README.md
```

---

## Database Overview

PostgreSQL 14+ with `btree_gist` extension for overlap constraints.

| Table | Purpose |
|---|---|
| `users` | Accounts with roles, email/phone verification, OAuth tokens |
| `services` | Bookable services with duration, price, category |
| `bookings` | Appointments with status machine, payment tracking, customer info |
| `availability` | Time windows when services accept bookings |
| `booking_events` | Append-only audit log for every status/payment change |
| `refresh_tokens` | JWT refresh token storage with revocation |
| `google_oauth_tokens` | Encrypted Google Calendar credentials |
| `payment_sessions` | Stripe checkout session tracking |
| `payment_events` | Stripe webhook event log |
| `calendar_sync_log` | Google Calendar sync audit trail |
| `sms_logs` | Twilio SMS delivery tracking |
| `user_sms_preferences` | Per-user SMS notification settings |

### Key Constraints

- **bookings_no_overlap** — EXCLUDE USING gist prevents double-booking at the database level
- **availability_no_overlap** — Prevents overlapping availability windows
- **users_email_unique** — One account per email
- **services_name_unique** — Unique service names

---

## API Endpoints

### Authentication — `/api/auth`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/signup` | Public | Register with email verification |
| POST | `/login` | Public | Login with email/password |
| POST | `/google` | Public | Google OAuth login |
| GET | `/verify-email` | Public | Verify email via token link |
| POST | `/refresh` | Cookie | Refresh access token |
| POST | `/logout` | Cookie | Revoke refresh token |
| GET | `/me` | Bearer | Get current user |

### Bookings — `/api/bookings`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/` | Bearer | Create booking |
| GET | `/` | Bearer | List user bookings (admin sees all) |
| GET | `/:id` | Bearer | Get booking details |
| GET | `/booked-slots` | Bearer | Get booked time slots for a date |
| GET | `/recommended-slots` | Optional | AI slot recommendations |
| PATCH | `/:id/status` | Bearer | Update status (confirm/complete/cancel) |
| PATCH | `/:id/reschedule` | Bearer | Reschedule to new date/time |
| DELETE | `/:id` | Bearer | Cancel booking |

### Services — `/api/services`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Public | List active services |
| GET | `/:id` | Public | Get service details |
| POST | `/` | Admin | Create service |
| PATCH | `/:id` | Admin | Update service |
| DELETE | `/:id` | Admin | Soft-delete service |

### Payments — `/api/payments`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/simulate` | Bearer | Demo payment simulation |
| GET | `/status/:bookingId` | Bearer | Get payment status |
| POST | `/checkout` | Bearer | Create Stripe session |
| POST | `/webhook` | Stripe | Stripe webhook handler |

### User Settings — `/api/user`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/change-password` | Bearer | Change password |
| GET | `/notifications` | Bearer | Get notifications |
| POST | `/notifications/:id/read` | Bearer | Mark as read |
| POST | `/notifications/read-all` | Bearer | Mark all as read |
| GET | `/payment-methods` | Bearer | List saved cards |
| GET | `/billing-history` | Bearer | Billing records |

### Admin — `/api/admin`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/analytics/dashboard` | Admin | Dashboard overview |
| GET | `/analytics/revenue` | Admin | Revenue breakdown |
| GET | `/analytics/services` | Admin | Service performance |
| GET | `/bookings` | Admin | All bookings with filters |
| GET | `/users` | Admin | User management |

### Other Routes
| Prefix | Description |
|---|---|
| `/api/availability` | Service availability windows (public read, admin write) |
| `/api/calendar` | Google Calendar OAuth and sync (admin) |
| `/api/sms` | Twilio SMS send, preferences, logs |
| `/api/support` | Support email form (public) |
| `/health` | Liveness probe |
| `/ready` | Readiness probe with DB check |

---

## Getting Started

### Prerequisites

- **Node.js** 20 or higher
- **PostgreSQL** 14 or higher
- **npm** and **pnpm**
- [Brevo](https://brevo.com) account for production email (free 300/day), or Gmail [App Password](https://support.google.com/accounts/answer/185833) for local SMTP
- Google Cloud project with OAuth credentials (for Google sign-in)

### Installation

```bash
# Clone the repository
git clone https://github.com/Satyamsinghh76/SaaS_Booking_system.git
cd SaaS_Booking_system

# Install all dependencies (root + server + client)
npm run install:all
```

### Database Setup

```bash
# 1. Create a PostgreSQL database
createdb bookingdb

# 2. Apply the schema (includes seed data for admin + test services)
psql -U postgres -d bookingdb -f server/db/schema.sql
```

### Environment Variables

Create `server/.env`:

```env
# ── Server ──────────────────────────────────────────
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
CLIENT_URL=http://localhost:3000

# ── Database ────────────────────────────────────────
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/bookingdb

# ── JWT ─────────────────────────────────────────────
JWT_SECRET=your-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ── Email ──────────────────────────────────────────
# Production: use Brevo HTTP API (recommended for cloud hosting)
BREVO_API_KEY=xkeysib-your-brevo-api-key
EMAIL_FROM=BookFlow <your-verified-sender@gmail.com>

# Local dev: use Gmail SMTP (fallback when no BREVO_API_KEY)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password

# ── Google OAuth ────────────────────────────────────
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# ── Twilio SMS (optional) ──────────────────────────
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# ── Stripe (optional — demo works without it) ──────
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ── Frontend ────────────────────────────────────────
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

### Running Locally

```bash
# Start both server (port 5000) and client (port 3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Seed accounts:**
| Role | Email | Password |
|---|---|---|
| Admin | `admin@bookflow.com` | `Admin123!` |
| User | `user@bookflow.com` | `Admin123!` |

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start server + client concurrently |
| `npm run server` | Start backend only |
| `npm run client` | Start frontend only |
| `npm run build` | Build Next.js for production |
| `npm start` | Start both in production mode |
| `npm run prod` | Build and start |
| `npm run type-check` | TypeScript type checking |
| `npm test` | Run backend tests (Jest) |
| `npm run install:all` | Install root + server + client deps |

---

## Deployment

BookFlow is deployed and live:

| Service | Platform | URL |
|---|---|---|
| **Frontend** | Vercel | [booking-system-by-satyam.vercel.app](https://booking-system-by-satyam.vercel.app) |
| **Backend API** | Render | [booking-system-3rzn.onrender.com](https://booking-system-3rzn.onrender.com) |
| **Database** | Supabase | PostgreSQL 17 (ap-northeast-2) |

### Deployment Process

#### 1. Database (Supabase)

1. Create a project on [supabase.com](https://supabase.com)
2. Run `server/db/schema.sql` in the SQL Editor — the schema uses `IF NOT EXISTS` and `ON CONFLICT` so it's safe to re-run
3. Copy the connection string from Settings → Database → URI

#### 2. Backend (Render)

1. Create a **Web Service** on [render.com](https://render.com) connected to the GitHub repo
2. Set **Root Directory** to `server`
3. Set **Build Command** to `npm install` and **Start Command** to `node server.js`
4. Add environment variables:

| Variable | Description |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Supabase connection string |
| `JWT_SECRET` | Random 32+ char string (`openssl rand -hex 32`) |
| `JWT_REFRESH_SECRET` | Different random 32+ char string |
| `CORS_ORIGIN` | Vercel frontend URL |
| `CLIENT_URL` | Vercel frontend URL |
| `BREVO_API_KEY` | Brevo API key for email delivery ([brevo.com](https://brevo.com)) |
| `EMAIL_FROM` | Verified sender address (e.g. `BookFlow <you@gmail.com>`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | From [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `NEXT_PUBLIC_API_URL` | Render backend URL (used in email links) |
| `STRIPE_*` | *(Optional)* Stripe keys for live payments |
| `TWILIO_*` | *(Optional)* Twilio credentials for SMS |

5. Verify: `GET /health` should return `{"status":"ok"}`

#### 3. Frontend (Vercel)

1. Import the GitHub repo on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `client`
3. Add environment variables:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Render backend URL (e.g. `https://your-api.onrender.com`) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth Client ID |

4. Deploy — Vercel auto-detects Next.js and builds with `pnpm`

#### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com) → Credentials → OAuth 2.0 Client ID
2. Add **Authorized JavaScript Origins**: your Vercel URL + `http://localhost:3000`
3. Add **Authorized Redirect URIs**: your Render URL + `/api/calendar/oauth/callback`

> **Note:** Render free tier spins down after 15 min of inactivity — the first request takes ~30s to cold start. Paid plan ($7/mo) keeps it always on.
>
> **Email:** Direct SMTP (Gmail) is blocked from most cloud platforms. BookFlow uses [Brevo's HTTP API](https://brevo.com) in production — free 300 emails/day, only requires sender email verification (no domain setup needed).

---

## Security Features

| Feature | Implementation |
|---|---|
| Password Hashing | bcryptjs with 12 salt rounds |
| JWT Tokens | Short-lived access (15m) + refresh rotation (7d) |
| HTTPS Headers | Helmet (HSTS, X-Frame-Options, CSP-ready) |
| Rate Limiting | express-rate-limit per IP |
| Input Validation | express-validator on all endpoints |
| SQL Injection | Parameterized queries ($1, $2...) throughout |
| XSS Prevention | React auto-escaping + Helmet headers |
| CORS | Strict origin whitelist |
| HPP | HTTP parameter pollution protection |
| Admin 2FA | Email verification required on every admin login |

---

## Monitoring & Logging

| Feature | Details |
|---|---|
| HTTP Logging | Morgan with custom format (skips health checks) |
| Application Logs | Winston structured JSON with daily rotation |
| Correlation IDs | Unique request ID via `X-Request-Id` header |
| Health Endpoint | `GET /health` — zero I/O liveness check |
| Readiness Endpoint | `GET /ready` — includes DB latency (3s timeout) |
| Graceful Shutdown | SIGTERM/SIGINT handlers with 30s connection drain |
| Error Tracking | Global error middleware with stack traces in dev |

---

## Future Improvements

- [ ] Live Stripe payment integration
- [ ] Two-way Google Calendar sync (automatic event creation)
- [ ] Mobile app with React Native
- [ ] AI-powered scheduling optimization
- [ ] Multi-provider support with provider dashboards
- [ ] Recurring bookings and subscription plans
- [ ] Customer reviews and ratings (backend)
- [ ] Full-text search with PostgreSQL `tsvector`
- [ ] Real-time WebSocket notifications
- [ ] Internationalization (i18n)
- [ ] Docker + docker-compose containerization
- [ ] CI/CD pipeline with GitHub Actions

---

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## License

Distributed under the MIT License.

```
MIT License

Copyright (c) 2026 Satyam Singh

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

---

