'use strict';

// ── Load and validate environment variables FIRST ────────────
require('dotenv').config();
const env = require('./config/env');   // exits process if required vars are missing

const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const hpp          = require('hpp');

const logger                      = require('./config/logger');
const pool = require('./config/database');
const errorHandler   = require('./middleware/errorHandler');
const requestId      = require('./middleware/requestId');

// ── Route modules ────────────────────────────────────────────
const authRoutes           = require('./routes/auth');
const userRoutes           = require('./routes/users');
const bookingRoutes        = require('./routes/bookings');
const serviceRoutes        = require('./routes/services');
const availabilityRoutes   = require('./routes/availability');
const paymentRoutes        = require('./routes/payments');
const calendarRoutes       = require('./routes/calendar');
const adminRoutes          = require('./routes/admin');
const recommendationRoutes = require('./routes/recommendations');
const smsRoutes            = require('./routes/sms');

const app = express();

// ── Trust the first reverse proxy (Render / Railway / Heroku) ────────────────
// Makes req.ip reliable and prevents X-Forwarded-For spoofing.
app.set('trust proxy', 1);

// ── Security headers ─────────────────────────────────────────
app.use(
  helmet({
    // Enforce HTTPS for 1 year; preload-eligible once verified
    hsts: { maxAge: 31_536_000, includeSubDomains: true, preload: true },
    // Do not leak the origin URL in Referer headers to third parties
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    // Disable MIME-type sniffing
    noSniff: true,
    // Prevent clickjacking
    frameguard: { action: 'deny' },
    // Remove X-Powered-By: Express
    hidePoweredBy: true,
    // Block deprecated XSS auditor in old browsers
    xssFilter: true,
  })
);

// ── CORS ─────────────────────────────────────────────────────
app.use(cors({
  origin:      env.corsOrigin,
  credentials: true,
}));

// ── Correlation IDs ───────────────────────────────────────────
// Must be early so every subsequent logger call can include requestId
app.use(requestId);

// ── Rate limiting ─────────────────────────────────────────────

// General API: 200 req / 15 min per IP
// req.ip is correct here because trust proxy is set above.
const apiLimiter = rateLimit({
  windowMs:          15 * 60 * 1000,
  max:               200,
  standardHeaders:   true,
  legacyHeaders:     false,
  message:           { success: false, message: 'Too many requests. Please try again later.' },
});

// Auth endpoints: tighter limit to slow credential-stuffing/brute-force
const authLimiter = rateLimit({
  windowMs:          15 * 60 * 1000,
  max:               20,
  standardHeaders:   true,
  legacyHeaders:     false,
  message:           { success: false, message: 'Too many auth attempts. Please wait before trying again.' },
  skipSuccessfulRequests: true,  // only count failed attempts toward the limit
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

// ── HTTP request logging (via winston stream) ─────────────────
// Skip liveness/readiness probes — they fire every ~10 s from load balancers
// and would otherwise bury real traffic entries in the access logs.
app.use(morgan(
  env.isProduction ? 'combined' : 'dev',
  {
    stream: logger.stream,
    skip:   (req) => req.path === '/health' || req.path === '/ready',
  }
));

// ── Cookie parser (must be before routes that read req.cookies) ──────────────
app.use(cookieParser());

// ── Body parsers ──────────────────────────────────────────────
// NOTE: /api/payments/webhook requires express.raw() and handles it internally
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── HTTP Parameter Pollution protection ──────────────────────
// Prevents duplicate query params from overflowing arrays into model queries.
app.use(hpp());

// ── Liveness probe  GET /health ──────────────────────────────
// Returns 200 immediately — zero I/O. Render/Docker restart the container
// when this starts returning non-2xx. Never touch the database here.
app.get('/health', (_req, res) => {
  const body = {
    status:         'ok',
    uptime_seconds: Math.floor(process.uptime()),
    timestamp:      new Date().toISOString(),
  };
  if (!env.isProduction) body.env = env.nodeEnv;
  res.json(body);
});

// ── Readiness probe  GET /ready ───────────────────────────────
// Performs a real DB round-trip to confirm the server can handle traffic.
// Load balancers / Kubernetes route requests away from 503 instances.
app.get('/ready', async (_req, res) => {
  let dbOk       = false;
  let dbLatencyMs = null;

  try {
    const t0 = Date.now();
    await Promise.race([
      pool.query('SELECT 1'),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DB timeout')), 3_000)
      ),
    ]);
    dbLatencyMs = Date.now() - t0;
    dbOk = true;
  } catch (_) { /* dbOk stays false */ }

  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? 'ok' : 'degraded',
    checks: {
      database: {
        status:  dbOk ? 'ok' : 'error',
        ...(dbLatencyMs !== null && { latency_ms: dbLatencyMs }),
        pool: {
          total:   pool.totalCount,
          idle:    pool.idleCount,
          waiting: pool.waitingCount,
        },
      },
    },
    uptime_seconds: Math.floor(process.uptime()),
  });
});

// ── API routes ───────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/bookings',      bookingRoutes);
app.use('/api/services',      serviceRoutes);
app.use('/api/availability',  availabilityRoutes);
app.use('/api/payments',      paymentRoutes);
app.use('/api/calendar',      calendarRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/bookings',      recommendationRoutes);
app.use('/api/sms',           smsRoutes);

// ── 404 fallback ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.', requestId: req.id });
});

// ── Global error handler (must be last) ──────────────────────
app.use(errorHandler);

// ── Start server ─────────────────────────────────────────────
const start = async () => {
  // Test database connection
  try {
    await pool.query('SELECT 1');
    logger.info('Connected to database');
  } catch (error) {
    logger.error('Database connection failed:', error.message);
    process.exit(1);
  }

  // Disable SMS scheduler for now (test credentials)
  // if (env.twilio.enabled) {
  //   const { startScheduler } = require('./jobs/smsReminder');
  //   startScheduler();
  //   logger.info('SMS reminder scheduler started.');
  // }

  const port = env.port;
  const server = app.listen(port, () => {
    logger.info(`Server running on http://localhost:${port}`, { env: env.nodeEnv, port });
  });

  // ── Graceful shutdown ──────────────────────────────────────
  // Stop accepting new connections, drain in-flight requests, then close
  // the DB pool before exiting. This prevents 502s on rolling deploys and
  // ensures Stripe/Twilio in-flight jobs are not cut mid-execution.
  const shutdown = async (signal) => {
    logger.info(`${signal} received — starting graceful shutdown`);

    // Force-kill after 30 s if connections are stubborn
    const forceExit = setTimeout(() => {
      logger.error('Graceful shutdown timed out after 30 s — forcing exit');
      process.exit(1);
    }, 30_000);
    forceExit.unref(); // don't keep the event-loop alive for this timer

    // 1. Stop the HTTP server from accepting new connections
    server.close(async () => {
      logger.info('HTTP server closed — draining database pool');
      try {
        await pool.end();
        logger.info('Database pool closed — exiting cleanly');
      } catch (err) {
        logger.error('Error closing database pool during shutdown', { message: err.message });
      }
      clearTimeout(forceExit);
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM')); // Render / Docker / k8s send this
  process.on('SIGINT',  () => shutdown('SIGINT'));  // Ctrl-C in local dev
};

start().catch((err) => {
  logger.error('Failed to start server', { message: err.message, stack: err.stack });
  process.exit(1);
});

module.exports = app;
