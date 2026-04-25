<div align="center">

# 🚀 BookFlow

**A production-grade SaaS booking platform for service-based businesses**

Online scheduling, payments, automated reminders, real-time analytics, and admin tools — all in one platform.

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?style=flat-square&logo=playwright&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

[🌐 Live Demo](https://booking-system-by-satyam.vercel.app) · [🐛 Report Bug](https://github.com/Satyamsinghh76/SaaS_Booking_system/issues) · [✨ Request Feature](https://github.com/Satyamsinghh76/SaaS_Booking_system/issues)

</div>

---

## 📋 Table of Contents

- [📸 Screenshots](#-screenshots)
- [💡 Overview](#-overview)
- [🏗️ Architecture](#-architecture)
- [✨ Features](#-features)
- [🛠️ Tech Stack](#-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🗄️ Database Schema](#-database-schema)
- [📡 API Reference](#-api-reference)
- [🚀 Getting Started](#-getting-started)
- [📝 Available Scripts](#-available-scripts)
- [🧪 Testing](#-testing)
- [🌍 Deployment](#-deployment)
- [🔒 Security](#-security)
- [📊 Monitoring & Reliability](#-monitoring--reliability)
- [🗺️ Future Roadmap](#-future-roadmap)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 📸 Screenshots

### Landing Page & Services Discovery

![Services Page](./assets/screenshots/Landing_page.png)
> Browse and discover available services with powerful filters and search

### Booking Wizard Flow

![Booking Management](./assets/screenshots/Bookings.png)
> Step-by-step booking flow: Select service, choose date & time, and confirm

### User Dashboard

![User Dashboard](./assets/screenshots/User_dashboard.png)
> Manage your bookings and personal settings from your dashboard

### Customer Bookings

![My Bookings](./assets/screenshots/My_bookings.png)
> View and manage all your bookings in one place

### Admin Dashboard

![Admin Dashboard](./assets/screenshots/Admin_dashboard.png)
> Real-time analytics, revenue tracking, and platform management

### Analytics & Insights

![Analytics](./assets/screenshots/Analytics.png)
> Comprehensive analytics with revenue trends and customer metrics

---

## 💡 Overview

**BookFlow** is a full-stack monorepo SaaS booking platform built with **Node.js, Express, PostgreSQL, Next.js, and React**. It provides everything a service-based business needs to operate online—from customer booking to payment processing to admin analytics.

---

### 👥 User Roles

| Role | Features |
|---|---|
| **👤 Customers** | Browse services, book appointments, manage bookings, make payments, receive notifications |
| **⚙️ Admins** | Manage platform, confirm/cancel bookings, CRUD services, track revenue, oversee users |

### 🎯 Key Engineering Highlights

✅ **3-layer double-booking prevention** — PostgreSQL advisory locks + overlap queries + EXCLUDE constraint  
✅ **JWT authentication** — Refresh token rotation with secure httpOnly cookies  
✅ **AI-powered recommendations** — Smart slot suggestions based on availability patterns  
✅ **Multi-channel notifications** — Email (Brevo), SMS (Twilio), in-app alerts  
✅ **Google Calendar integration** — Sync bookings with one click  
✅ **Stripe payments** — Full integration with demo mode for testing  
✅ **Cold start resilience** — Server pre-warming + exponential backoff retry  
✅ **Comprehensive testing** — E2E (Playwright) + backend tests (Jest)  

---

## 🏗️ Architecture

The system follows a **3-tier architecture** with clear separation of concerns:

![Architecture Diagram](./assets/screenshots/architecture.png)

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Next.js 16)                     │
│  App Router · React 19 · Tailwind CSS 4 · Zustand · Shadcn/ui  │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS / REST
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API SERVER (Express.js)                    │
│  JWT Auth · Rate Limiting · Validation · Winston Logging        │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ 12 Route │ │ 10 Ctrl  │ │ 9 Models │ │  7 Middleware     │  │
│  │ Modules  │ │ Handlers │ │ SQL/PG   │ │  auth · validate  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │
└───────┬──────────┬──────────┬──────────┬───────────────────────┘
        │          │          │          │
        ▼          ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌────────┐ ┌──────────────┐
│PostgreSQL│ │  Brevo   │ │ Twilio │ │ Google APIs   │
│ 14 tables│ │HTTP Email│ │  SMS   │ │ OAuth + Cal   │
└──────────┘ └──────────┘ └────────┘ └──────────────┘
```

---

## ✨ Features

### 👤 Customer Features

| Feature | Description |
|---|---|
| **🔐 Authentication** | Google OAuth + email/password signup with email verification |
| **🔍 Service Browsing** | Search, category filters, grid/list view with 3D tilt cards |
| **✨ Smart Booking Wizard** | 3-step flow: Service → Date & Time → Confirm |
| **🤖 AI Recommendations** | Suggestions based on availability patterns |
| **📅 Booking Dashboard** | View, reschedule, cancel from personal dashboard |
| **💳 Secure Payments** | Simulated card payment with full validation (number, MM/YY, CVV) |
| **🔔 Multi-Channel Alerts** | In-app bell icon + email confirmations + SMS reminders |
| **📆 Calendar Sync** | Add bookings to Google Calendar with one click |
| **🌙 Dark/Light Theme** | Toggle persisted to localStorage with system preference fallback |
| **⚙️ User Settings** | Profile editing, password change, notification preferences, billing history |
| **💬 Live Support** | Tawk.to support widget across all pages |

### ⚙️ Admin Features

| Feature | Description |
|---|---|
| **📊 Analytics Dashboard** | Real-time KPI cards, revenue charts, top services, user metrics |
| **💰 Revenue Analytics** | Weekly / monthly / yearly views with date range filtering |
| **📋 Booking Management** | Confirm, complete, or cancel any booking (triggers notifications) |
| **🎯 Service CRUD** | Create, edit, delete services with categories, pricing, and duration |
| **👥 User Management** | View all users, toggle active/inactive status |
| **🔐 Enhanced Security** | Admin login requires email verification on every attempt |
| **📜 Audit Trail** | Full event history for every booking (status changes, payments, actors) |

### 🛡️ Platform & Reliability

| Feature | Description |
|---|---|
| **🚫 Double-Booking Prevention** | 3-layer: advisory locks → overlap queries → PostgreSQL EXCLUDE constraint |
| **⚡ Cold Start Resilience** | Server pre-warming on page load + auto-retry with exponential backoff |
| **⏱️ Rate Limiting** | 200 req/15min general, 20 req/15min auth (skips successful requests) |
| **🔑 JWT + Refresh Tokens** | Short-lived access token (15m) with httpOnly refresh cookie rotation (7d) |
| **🛑 Graceful Shutdown** | 30s drain period — stops new connections, drains in-flight, closes DB pool |
| **💚 Health Probes** | `/health` liveness (zero I/O) + `/ready` readiness (DB latency check, 3s timeout) |
| **📧 Email Delivery** | Brevo HTTP API (production, 300/day free) with SMTP fallback (development) |
| **📝 Structured Logging** | Winston JSON logs with daily rotation + request correlation IDs |
| **📰 Content Pages** | Blog with slug routing, Features, Pricing, About, Docs, Help, Privacy, Terms, Cookies |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
### Backend

| Technology | Purpose |
|---|---|
| **Node.js 20+** | Runtime |
| **Express.js 4.19** | HTTP framework |
| **PostgreSQL 14+** | Primary database (with `btree_gist` extension) |
| **pg** | Database driver with connection pooling |
| **jsonwebtoken** | JWT access and refresh tokens |
| **bcryptjs** | Password hashing (12 salt rounds) |
| **Brevo API** | Transactional email via HTTP (production) |
| **Nodemailer** | Email via SMTP (development fallback) |
| **Twilio SDK** | SMS confirmations and reminders |
| **googleapis** | Google Calendar sync |
| **Stripe SDK** | Payment processing (with demo mode) |
| **Winston** | Structured logging with daily rotation |
| **node-cron** | Scheduled SMS reminder jobs |
| **express-validator** | Input validation and sanitization |
| **Helmet** | Security headers (HSTS, CSP, X-Frame-Options) |
| **express-rate-limit** | API rate limiting per IP |
| **hpp** | HTTP parameter pollution protection |

### Frontend

| Technology | Purpose |
|---|---|
| **Next.js 16.1.6** | React framework (App Router) |
| **React 19** | UI library |
| **Tailwind CSS 4** | Utility-first styling |
| **Radix UI + Shadcn/ui** | 40+ accessible component primitives |
| **Zustand** | Client state management |
| **React Hook Form + Zod** | Form handling and schema validation |
| **Framer Motion** | Animations and page transitions |
| **Recharts** | Dashboard data visualization |
| **React Parallax Tilt** | 3D card hover effects |
| **Axios** | HTTP client with request/response interceptors |
| **@react-oauth/google** | Google sign-in integration |
| **next-themes** | Dark mode with system preference support |

### Testing & Build

| Technology | Purpose |
|---|---|
| **Playwright 1.58** | E2E testing (Chromium desktop + iPhone 14 mobile) |
| **Jest 29.7** | Backend unit and integration testing |
| **Supertest 6.3** | HTTP endpoint assertions |
| **pnpm** | Frontend package manager |
| **npm** | Backend + root package manager |
| **concurrently** | Parallel dev server execution |
| **nodemon** | Backend hot reload |
| **dotenv** | Environment variable management |

---

## 📁 Project Structure

```
BookFlow/
│
├── client/                          # Next.js frontend (pnpm)
│   ├── app/                         # App Router pages
│   │   ├── admin/                   #   Dashboard, bookings, services, analytics, settings
│   │   ├── booking/                 #   Multi-step wizard + success page
│   │   ├── dashboard/               #   User bookings, history, settings
│   │   ├── login/ & signup/         #   Auth pages (email + Google OAuth)
│   │   ├── services/                #   Service listing with filters
│   │   ├── payment/                 #   Demo payment page
│   │   ├── support/                 #   Email support form
│   │   ├── blog/                    #   Articles with [slug] routing
│   │   ├── verify-email/            #   Email verification handler
│   │   └── features/, pricing/,     #   Marketing & legal pages
│   │       about/, help/, docs/,
│   │       privacy/, terms/, cookies/
│   ├── components/                  # Reusable components
│   │   ├── ui/                      #   Shadcn/ui primitives (40+ components)
│   │   ├── admin/                   #   Admin sidebar
│   │   ├── dashboard/               #   Notification bell, user sidebar
│   │   ├── navbar.tsx               #   Global navigation (role-aware)
│   │   ├── footer.tsx               #   Site footer
│   │   ├── theme-provider.tsx       #   Dark mode provider
│   │   ├── google-oauth-provider.tsx
│   │   └── tawk-chat.tsx            #   Live chat widget
│   ├── lib/                         # Utilities & API layer
│   │   ├── api/                     #   API clients (auth, bookings, payments, services)
│   │   │   ├── client.ts            #   Axios instance with interceptors + auto-retry
│   │   │   └── server-wake.ts       #   Server pre-warming for cold starts
│   │   ├── store.ts                 #   Zustand global state
│   │   └── utils.ts                 #   Helper functions
│   ├── e2e/                         # Playwright E2E tests
│   │   ├── auth.spec.ts             #   Login/logout, role-based access
│   │   ├── booking-flow.spec.ts     #   Full booking wizard flow
│   │   ├── data-consistency.spec.ts #   Dashboard data + API consistency
│   │   └── navigation.spec.ts       #   Route loading, 404s, auth guards
│   └── playwright.config.ts         # E2E test configuration
│
├── server/                          # Express.js backend (npm)
│   ├── config/                      # Configuration
│   │   ├── database.js              #   PostgreSQL pool + connection management
│   │   ├── env.js                   #   Environment validation
│   │   ├── jwt.js                   #   Token generation/verification
│   │   ├── logger.js                #   Winston structured logging
│   │   └── stripe.js                #   Stripe client setup
│   ├── controllers/                 # Request handlers (10 files)
│   │   ├── authController.js        #   Login, signup, OAuth, email verify, refresh
│   │   ├── bookingController.js     #   CRUD, status transitions, reschedule
│   │   ├── paymentController.js     #   Stripe checkout, demo payments, refunds
│   │   ├── adminController.js       #   Analytics, user/booking management
│   │   ├── serviceController.js     #   Service CRUD
│   │   ├── calendarController.js    #   Google Calendar OAuth + sync
│   │   ├── smsController.js         #   Twilio SMS send/preferences
│   │   ├── availabilityController.js#   Time window management
│   │   ├── recommendationController.js # AI slot suggestions
│   │   └── webhookHandler.js        #   Stripe webhook (signature-verified, idempotent)
│   ├── middleware/                   # Express middleware (7 files)
│   │   ├── auth.js                  #   JWT verify, role-based access, optional auth
│   │   ├── errorHandler.js          #   Global error handler (sanitized responses)
│   │   ├── requestId.js             #   Correlation ID per request
│   │   └── validate*.js             #   Input validation (booking, payment, service, etc.)
│   ├── models/                      # Database query layer (9 files)
│   ├── routes/                      # API routes (12 modules)
│   ├── services/                    # Business logic
│   │   ├── notificationService.js   #   Email notifications (Brevo + Nodemailer)
│   │   ├── twilioService.js         #   SMS via Twilio
│   │   ├── calendarService.js       #   Google Calendar sync
│   │   ├── stripeService.js         #   Stripe payment processing
│   │   └── recommendationService.js #   AI slot recommendation engine
│   ├── utils/
│   │   ├── doubleBookingGuard.js    #   Advisory lock + overlap detection
│   │   └── seedAccounts.js          #   Auto-seed admin/test users
│   ├── jobs/
│   │   └── smsReminder.js           #   node-cron SMS reminder scheduler
│   ├── templates/                   #   HTML email templates
│   ├── db/
│   │   └── schema.sql               #   Complete DDL (14 tables, indexes, constraints, seeds)
│   └── server.js                    #   Application entry point
│
├── package.json                     # Root monorepo scripts
├── render.yaml                      # Render deployment config (IaC)
└── vercel.json                      # Vercel security headers
```

---

## 🗄️ Database Schema

**PostgreSQL 14+** with `btree_gist` extension enabled for range overlap constraints.

### 📊 Tables (14)

| Table | Purpose |
|---|---|
| `users` | Accounts with roles, email verification, phone, OAuth provider |
| `services` | Bookable services (name, duration, price, category, active status) |
| `bookings` | Appointments with status machine, payment tracking, price snapshot, customer info |
| `availability` | Time windows when services accept bookings |
| `booking_events` | Append-only audit log — every status/payment change with actor + timestamp |
| `refresh_tokens` | JWT refresh token storage with hash + expiry + revocation |
| `google_oauth_tokens` | Encrypted Google Calendar credentials per user |
| `payment_sessions` | Stripe checkout session tracking (amount, status, intent ID) |
| `payment_events` | Stripe webhook event log (idempotent processing via unique event ID) |
| `payment_methods` | Stored card details (type, last4, expiry, default flag) |
| `notifications` | In-app notifications (title, message, type, read status, link) |
| `calendar_sync_log` | Google Calendar sync audit trail |
| `sms_logs` | Twilio SMS delivery tracking (status, SID, message type) |
| `user_sms_preferences` | Per-user SMS opt-in settings (confirmations, reminders, cancellations) |

### 🔐 Key Constraints

| Constraint | Type | Purpose |
|---|---|---|
| `bookings_no_overlap` | EXCLUDE USING gist | Prevents double-booking at the database level using `tsrange` overlap detection |
| `availability_no_overlap` | EXCLUDE USING gist | Prevents overlapping availability windows |
| `users_email_unique` | UNIQUE | One account per email |
| `services_name_unique` | UNIQUE | Unique service names |

### ⚡ Key Indexes

| Index | Purpose |
|---|---|
| `idx_bookings_active_slot` | Fast overlap detection (excludes cancelled/no_show) |
| `idx_bookings_user_date` | User dashboard queries |
| `idx_bookings_reminder` | SMS reminder cron job |
| `idx_bookings_slot` | Composite on (service_id, date, start_time, end_time) |

### 📝 Booking Status Machine

```
pending → confirmed → completed
   ↓         ↓
cancelled  cancelled / no_show
```

**Payment statuses:** `unpaid` → `paid` → `refunded` | `failed`

---

## 📡 API Reference

### 🔐 Authentication — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/signup` | Public | Register with email verification |
| POST | `/login` | Public | Login with email/password |
| POST | `/google` | Public | Google OAuth login |
| GET | `/verify-email` | Public | Verify email via token link |
| POST | `/refresh` | Cookie | Refresh access token |
| POST | `/logout` | Cookie | Revoke refresh token |
| GET | `/me` | Bearer | Get current authenticated user |

### 📅 Bookings — `/api/bookings`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/` | Bearer | Create booking (with double-booking guard) |
| GET | `/` | Bearer | List user's bookings (admin sees all, paginated) |
| GET | `/:id` | Bearer | Get booking details |
| GET | `/booked-slots` | Bearer | Get taken time slots for a service on a date |
| GET | `/recommended-slots` | Optional | AI-powered slot suggestions |
| PATCH | `/:id/status` | Bearer | Update status (confirm/complete/cancel/no_show) |
| PATCH | `/:id/reschedule` | Bearer | Reschedule to new date/time (with conflict check) |
| DELETE | `/:id` | Bearer | Cancel booking |
| PATCH | `/:id/payment` | Admin | Update payment status |
| GET | `/:id/events` | Admin | Get booking audit trail |

### 🎯 Services — `/api/services`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Public | List active services (with search + category filter) |
| GET | `/:id` | Public | Get service details |
| POST | `/` | Admin | Create service |
| PATCH | `/:id` | Admin | Update service |
| DELETE | `/:id` | Admin | Soft-delete service |

### 💳 Payments — `/api/payments`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/checkout` | Bearer | Create Stripe checkout session |
| GET | `/session/:sessionId` | Bearer | Get live session status from Stripe |
| GET | `/booking/:bookingId` | Bearer | Get payment for a booking |
| GET | `/status/:bookingId` | Bearer | Get payment status |
| POST | `/simulate` | Bearer | Demo payment (no Stripe required) |
| POST | `/:bookingId/refund` | Admin | Initiate Stripe refund |
| POST | `/webhook` | Stripe | Webhook handler (signature-verified, idempotent) |

### 📊 Admin — `/api/admin`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/analytics/dashboard` | Admin | KPI overview (revenue, bookings, customers) |
| GET | `/analytics/revenue` | Admin | Revenue trends (weekly/monthly/yearly) |
| GET | `/analytics/services` | Admin | Service performance metrics |
| GET | `/analytics/bookings` | Admin | Booking pattern analytics |
| GET | `/analytics/users` | Admin | User acquisition metrics |
| GET | `/bookings` | Admin | All bookings (paginated, filterable by status/date) |
| GET | `/bookings/:id` | Admin | Booking details with customer info |
| PATCH | `/bookings/:id/confirm` | Admin | Confirm booking |
| PATCH | `/bookings/:id/cancel` | Admin | Cancel booking |
| GET | `/users` | Admin | User list (paginated, sortable) |
| GET | `/users/:id` | Admin | User details |
| PATCH | `/users/:id/status` | Admin | Toggle user active/inactive |

### 🔗 Other Routes

| Prefix | Auth | Description |
|---|---|---|
| `/api/availability` | Public read, Admin write | Service availability windows |
| `/api/calendar` | Admin | Google Calendar OAuth flow and booking sync |
| `/api/sms` | Bearer | Twilio SMS (send, preferences, logs, delivery status) |
| `/api/user` | Bearer | Profile, password change, notifications, billing |
| `/api/support` | Public | Support contact form (sends HTML email) |
| `/health` | Public | Liveness probe (zero I/O) |
| `/ready` | Public | Readiness probe (DB connectivity + latency check) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+
- **PostgreSQL** 14+
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

### 🗄️ Database Setup

```bash
# Create a PostgreSQL database
createdb bookingdb

# Apply schema (includes seed data — safe to re-run with IF NOT EXISTS / ON CONFLICT)
psql -U postgres -d bookingdb -f server/db/schema.sql
```

### 🔑 Environment Variables

**Create `server/.env`:**

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
# Production: Brevo HTTP API (recommended for cloud hosting)
BREVO_API_KEY=xkeysib-your-brevo-api-key
EMAIL_FROM=BookFlow <your-verified-sender@gmail.com>

# Development: Gmail SMTP (fallback when no BREVO_API_KEY)
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

# ── Stripe (optional — demo mode works without it) ─
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Create `client/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

### ⚡ Running Locally

```bash
# Start both server (port 5000) and client (port 3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**🔓 Seed accounts (auto-created on first run):**

| Role | Email | Password |
|---|---|---|
| Admin | `admin@bookflow.com` | `Admin123!` |
| User | `user@bookflow.com` | `Admin123!` |

---

## 📝 Available Scripts

### Root (Monorepo)

| Command | Description |
|---|---|
| `npm run dev` | Start server + client concurrently |
| `npm run server` | Start backend only (nodemon) |
| `npm run client` | Start frontend only |
| `npm run build` | Build Next.js for production |
| `npm start` | Start both in production mode |
| `npm run prod` | Build + start production |
| `npm run type-check` | TypeScript type checking (no emit) |
| `npm test` | Run backend tests (Jest) |
| `npm run install:all` | Install root + server + client dependencies |

### Backend (`server/`)

| Command | Description |
|---|---|
| `npm run dev` | Start with nodemon (hot reload) |
| `npm start` | Start in production mode |
| `npm test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

### Frontend (`client/`)

| Command | Description |
|---|---|
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |

---

## 🧪 Testing

### 🎭 E2E Tests (Playwright)

| Command | Description |
|---|---|
| `cd client && npm run test:e2e` | Run all tests (headless Chromium) |
| `cd client && npm run test:e2e:headed` | Run with visible browser |
| `cd client && npm run test:e2e:ui` | Interactive Playwright UI mode |

> **Note:** Backend must be running on port 5000. Playwright auto-starts the Next.js dev server.

**Test Suites:**

| Suite | Tests | Coverage |
|---|---|---|
| `auth.spec.ts` | 10 | Login/logout, seed accounts, role-based access, error states |
| `booking-flow.spec.ts` | 6 | Service selection, date/time picker, form validation, full E2E |
| `data-consistency.spec.ts` | 7 | Dashboard stats, booking CRUD via API, admin operations |
| `navigation.spec.ts` | 8 | Route loading, 404 handling, auth redirects, mobile viewport |

**Browsers:** Chromium (desktop) + iPhone 14 (mobile viewport)

### 🧬 Backend Tests (Jest + Supertest)

```bash
npm test                    # Run once
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
```

---

## 🌍 Deployment

**BookFlow is deployed and live:**

| Service | Platform | URL |
|---|---|---|
| **Frontend** | Vercel | [booking-system-by-satyam.vercel.app](https://booking-system-by-satyam.vercel.app) |
| **Backend API** | Render | [booking-system-3rzn.onrender.com](https://booking-system-3rzn.onrender.com) |
| **Database** | Supabase | PostgreSQL 17 (connection pooling via port 6543) |

### 🗄️ 1. Database (Supabase)

1. Create a project on [supabase.com](https://supabase.com)
2. Run `server/db/schema.sql` in the SQL Editor (safe to re-run)
3. Copy the connection string from Settings → Database → URI

### 📡 2. Backend (Render)

1. Create a **Web Service** on [render.com](https://render.com) connected to the GitHub repo
2. Set **Root Directory** to `server`
3. Set **Build Command** to `npm install` and **Start Command** to `node server.js`
4. Add environment variables:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Supabase connection string |
| `JWT_SECRET` | `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | Different random 32+ char string |
| `CORS_ORIGIN` | Vercel frontend URL |
| `CLIENT_URL` | Vercel frontend URL |
| `BREVO_API_KEY` | From [brevo.com](https://brevo.com) |
| `EMAIL_FROM` | Verified sender (e.g. `BookFlow <you@gmail.com>`) |
| `GOOGLE_CLIENT_ID` | From [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `STRIPE_*` | *(Optional)* Stripe keys for live payments |
| `TWILIO_*` | *(Optional)* Twilio credentials for SMS |

5. Verify: `GET /health` should return `{"status":"ok"}`

### 🚀 3. Frontend (Vercel)

1. Import the repo on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `client`
3. Add environment variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | Render backend URL |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth Client ID |

4. Deploy — Vercel auto-detects Next.js and builds with pnpm

### 🔐 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com) → Credentials → OAuth 2.0 Client ID
2. Add **Authorized JavaScript Origins**: Vercel URL + `http://localhost:3000`
3. Add **Authorized Redirect URIs**: Render URL + `/api/calendar/oauth/callback`

> **❄️ Cold Starts:** Render free tier spins down after 15 min of inactivity. BookFlow handles this with server pre-warming (health ping on page load) and auto-retry with exponential backoff — so users experience a brief delay instead of an error. Paid plan ($7/mo) keeps it always on.
>
> **📧 Email:** Direct SMTP is blocked on most cloud platforms. BookFlow uses [Brevo's HTTP API](https://brevo.com) in production — free 300 emails/day, only requires sender email verification.

---

## 🔒 Security

| Feature | Implementation |
|---|---|
| **🔐 Password Hashing** | bcryptjs with 12 salt rounds |
| **🔑 JWT Tokens** | Short-lived access (15m) + refresh token rotation (7d) with httpOnly cookies |
| **🛡️ HTTPS Headers** | Helmet (HSTS, X-Frame-Options, X-Content-Type-Options, CSP-ready) |
| **⏱️ Rate Limiting** | express-rate-limit (200/15min general, 20/15min auth — skips successful) |
| **✔️ Input Validation** | express-validator on all endpoints with sanitization |
| **🚫 SQL Injection** | Parameterized queries (`$1, $2...`) throughout — zero string concatenation |
| **🔒 XSS Prevention** | React auto-escaping + Helmet headers + no `dangerouslySetInnerHTML` |
| **🌐 CORS** | Strict origin whitelist per environment |
| **🚧 HPP** | HTTP parameter pollution protection |
| **📝 Admin 2FA** | Email verification code required on every admin login |
| **🔐 Webhook Security** | Stripe signature verification (HMAC-SHA256) + idempotent event processing |

---

## 📊 Monitoring & Reliability

| Feature | Details |
|---|---|
| **📋 Structured Logging** | Winston JSON format with daily file rotation |
| **🔍 Request Correlation** | Unique ID per request via `X-Request-Id` header |
| **📊 HTTP Logging** | Morgan with custom format (health check endpoints excluded) |
| **💚 Health Endpoint** | `GET /health` — zero I/O instant liveness check |
| **✅ Readiness Endpoint** | `GET /ready` — DB connectivity + latency (3s timeout) |
| **🛑 Graceful Shutdown** | SIGTERM/SIGINT handlers: stop accepting → drain 30s → close DB pool |
| **❄️ Cold Start Handling** | Frontend pre-warms server on page load + Axios auto-retry (2 retries, exponential backoff) |
| **🚨 Error Handling** | Global middleware — sanitized responses (no stack traces in production) |
| **⏰ Cron Jobs** | SMS reminder scheduler (node-cron) for upcoming bookings |

---

## 🗺️ Future Roadmap

- [ ] Live Stripe payment integration (currently demo mode)
- [ ] Two-way Google Calendar sync (auto-create events on booking)
- [ ] React Native mobile app
- [ ] Real-time WebSocket notifications
- [ ] Recurring bookings and subscription plans
- [ ] Multi-provider support with provider dashboards
- [ ] Customer reviews and ratings
- [ ] Full-text search with PostgreSQL `tsvector`
- [ ] Internationalization (i18n)
- [ ] Docker + docker-compose containerization
- [ ] CI/CD pipeline with GitHub Actions

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📄 License

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

<div align="center">

### 💡 Built with ❤️ by [Satyam Singh](https://github.com/Satyamsinghh76)

**If you found this project helpful, please consider giving it a star ⭐**

---

[🌐 Live Demo](https://booking-system-by-satyam.vercel.app) · [📚 Documentation](https://github.com/Satyamsinghh76/SaaS_Booking_system) · [🐛 Issues](https://github.com/Satyamsinghh76/SaaS_Booking_system/issues) · [💬 Discussions](https://github.com/Satyamsinghh76/SaaS_Booking_system/discussions)

</div>
