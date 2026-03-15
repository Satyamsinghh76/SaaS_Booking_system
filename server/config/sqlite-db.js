'use strict';

// SQLite Database Configuration
// Provides a pg-Pool-compatible interface so all models work unchanged.

const sqlite3 = require('sqlite3').verbose();
const path    = require('path');
const fs      = require('fs');

const dbPath  = path.join(__dirname, '..', 'data', 'saas_booking.db');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// ── Schema version — bump this when adding new tables/columns ──
const SCHEMA_VERSION  = '6';
const versionFilePath = path.join(dataDir, 'schema_version.txt');
const existingVersion = fs.existsSync(versionFilePath)
  ? fs.readFileSync(versionFilePath, 'utf8').trim()
  : '0';

if (existingVersion !== SCHEMA_VERSION) {
  if (fs.existsSync(dbPath)) {
    try {
      fs.unlinkSync(dbPath);
      console.log('📦 Schema updated — recreating SQLite database...');
    } catch (e) {
      // DB may be locked by another process (e.g. nodemon restart race).
      // Continue — CREATE TABLE IF NOT EXISTS will add any missing tables.
      console.warn('⚠️  Could not remove old DB (file busy) — will migrate in place.');
    }
  }
  fs.writeFileSync(versionFilePath, SCHEMA_VERSION);
}

const db = new sqlite3.Database(dbPath);

// ── SQL dialect converter ─────────────────────────────────────
// Translates PostgreSQL-specific syntax to SQLite-compatible SQL.
function convertSql(sql) {
  return sql
    // $1, $2, ... → ?
    .replace(/\$\d+/g, '?')
    // Strip type casts: ::TEXT, ::INTEGER, ::DATE, ::TIME, ::NUMERIC(12,2), etc.
    .replace(/::\w+(?:\s*\(\s*\d+\s*(?:,\s*\d+\s*)?\))?/g, '')
    // NOW() → DATETIME('now')
    .replace(/\bNOW\(\)/gi, "DATETIME('now')")
    // CURRENT_DATE - INTERVAL 'N unit' → date('now', '-N unit')
    .replace(/CURRENT_DATE\s*-\s*INTERVAL\s*'(\d+)\s+(\w+)'/gi, (_, n, u) => `date('now', '-${n} ${u}')`)
    // CURRENT_DATE + INTERVAL 'N unit' → date('now', '+N unit')
    .replace(/CURRENT_DATE\s*\+\s*INTERVAL\s*'(\d+)\s+(\w+)'/gi, (_, n, u) => `date('now', '+${n} ${u}')`)
    // EXTRACT(HOUR FROM col) → CAST(strftime('%H', col) AS INTEGER)
    .replace(/\bEXTRACT\s*\(\s*HOUR\s+FROM\s+([\w.]+)\s*\)/gi,
      (_, col) => `CAST(strftime('%H', ${col}) AS INTEGER)`)
    // EXTRACT(DOW FROM col) → CAST(strftime('%w', col) AS INTEGER) [0=Sun]
    .replace(/\bEXTRACT\s*\(\s*DOW\s+FROM\s+([\w.]+)\s*\)/gi,
      (_, col) => `CAST(strftime('%w', ${col}) AS INTEGER)`)
    // EXTRACT(EPOCH FROM col) → CAST(strftime('%s', col) AS INTEGER)
    .replace(/\bEXTRACT\s*\(\s*EPOCH\s+FROM\s+([\w.]+)\s*\)/gi,
      (_, col) => `CAST(strftime('%s', ${col}) AS INTEGER)`)
    // TO_CHAR(col, 'YYYY-MM') → strftime('%Y-%m', col)
    .replace(/\bTO_CHAR\s*\(\s*([\w.]+)\s*,\s*'YYYY-MM'\s*\)/gi,
      (_, col) => `strftime('%Y-%m', ${col})`)
    // TO_CHAR(col, 'Day') → SQLite CASE for day name
    .replace(/\bTO_CHAR\s*\(\s*([\w.]+)\s*,\s*'Day'\s*\)/gi,
      (_, col) => `CASE strftime('%w',${col}) WHEN '0' THEN 'Sunday' WHEN '1' THEN 'Monday' WHEN '2' THEN 'Tuesday' WHEN '3' THEN 'Wednesday' WHEN '4' THEN 'Thursday' WHEN '5' THEN 'Friday' WHEN '6' THEN 'Saturday' END`)
    // DATE_TRUNC('month', col) → strftime('%Y-%m-01', col)
    .replace(/\bDATE_TRUNC\s*\(\s*'month'\s*,\s*([\w.]+)\s*\)/gi,
      (_, col) => `strftime('%Y-%m-01', ${col})`)
    // DATE_TRUNC('day', col) → DATE(col)
    .replace(/\bDATE_TRUNC\s*\(\s*'day'\s*,\s*([\w.]+)\s*\)/gi,
      (_, col) => `DATE(${col})`)
    // ILIKE → LIKE  (SQLite LIKE is already case-insensitive for ASCII)
    .replace(/\bILIKE\b/gi, 'LIKE')
    // Remove FOR UPDATE SKIP LOCKED / FOR UPDATE (SQLite uses WAL locking)
    .replace(/\bFOR\s+UPDATE\s+SKIP\s+LOCKED\b/gi, '')
    .replace(/\bFOR\s+UPDATE\b/gi, '');
}

// ── Core query executor ───────────────────────────────────────
function execQuery(sql, args) {
  return new Promise((resolve, reject) => {
    // PostgreSQL advisory lock — always succeeds in SQLite (single-writer)
    if (/pg_try_advisory_xact_lock/i.test(sql)) {
      return resolve({ rows: [{ acquired: 1 }] });
    }

    const converted   = convertSql(sql);
    const params      = args || [];
    const hasReturning = /\bRETURNING\b/i.test(converted);
    const isWrite     = /^\s*(INSERT|UPDATE|DELETE|BEGIN|COMMIT|ROLLBACK|CREATE|DROP|ALTER)\b/i.test(converted);

    if (isWrite && !hasReturning) {
      // Write without RETURNING — use run() which provides this.changes
      db.run(converted, params, function handler(err) {
        if (err) return reject(err);
        resolve({ rows: [], rowCount: this.changes, lastID: this.lastID });
      });
    } else {
      // SELECT or write with RETURNING — use all() which returns rows
      db.all(converted, params, (err, rows) => {
        if (err) return reject(err);
        resolve({ rows: rows || [] });
      });
    }
  });
}

// ── pg-Pool-compatible interface ──────────────────────────────
const sqlitePool = {
  // Properties used by the /ready health probe
  totalCount:   1,
  idleCount:    1,
  waitingCount: 0,

  /** Execute a query. Mirrors pg Pool.query(text, values). */
  query: (text, params) => execQuery(text, params),

  /**
   * Acquire a "client" for manual transaction management.
   * Mirrors pg Pool.connect() → PoolClient.
   * Since SQLite is single-writer, the client delegates directly to the pool.
   */
  getClient: async () => ({
    query:   (text, params) => execQuery(text, params),
    release: () => {},           // no-op — connection is never pooled
  }),

  /** Graceful shutdown. */
  end: () => new Promise((resolve) => db.close(resolve)),
};

// ── UUID v4 generation expression for SQLite ─────────────────
const UUID_DEFAULT =
  "(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || " +
  "substr(lower(hex(randomblob(2))),2) || '-' || " +
  "substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || " +
  "'-' || lower(hex(randomblob(6))))";

// ── Schema initialization ─────────────────────────────────────
db.serialize(() => {
  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = OFF'); // OFF to allow seed inserts without FK ordering issues

  console.log('🗄️  Initializing SQLite database...');

  // ── users ────────────────────────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY DEFAULT ${UUID_DEFAULT},
    name          TEXT NOT NULL,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT DEFAULT 'user',
    phone_number  TEXT,
    phone_verified BOOLEAN DEFAULT 0,
    is_active     BOOLEAN DEFAULT 1,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // ── services ─────────────────────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS services (
    id               TEXT PRIMARY KEY DEFAULT ${UUID_DEFAULT},
    name             TEXT NOT NULL,
    description      TEXT,
    duration_minutes INTEGER NOT NULL,
    price            REAL NOT NULL,
    is_active        BOOLEAN DEFAULT 1,
    created_by       TEXT,
    updated_by       TEXT,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // ── bookings ─────────────────────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id                       TEXT PRIMARY KEY DEFAULT ${UUID_DEFAULT},
    user_id                  TEXT NOT NULL,
    service_id               TEXT NOT NULL,
    booking_date             DATE NOT NULL,
    start_time               TIME NOT NULL,
    end_time                 TIME NOT NULL,
    status                   TEXT DEFAULT 'pending',
    payment_status           TEXT DEFAULT 'unpaid',
    price_snapshot           REAL,
    notes                    TEXT,
    cancelled_by             TEXT,
    cancelled_at             DATETIME,
    cancellation_reason      TEXT,
    google_calendar_event_id TEXT,
    google_event_id          TEXT,
    google_calendar_id       TEXT,
    calendar_synced_at       DATETIME,
    stripe_session_id        TEXT,
    stripe_payment_intent_id TEXT,
    paid_at                  DATETIME,
    refunded_at              DATETIME,
    refund_reason            TEXT,
    amount                   REAL,
    currency                 TEXT DEFAULT 'usd',
    created_at               DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at               DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)    REFERENCES users(id),
    FOREIGN KEY (service_id) REFERENCES services(id)
  )`);

  // ── availability ─────────────────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS availability (
    id         TEXT PRIMARY KEY DEFAULT ${UUID_DEFAULT},
    service_id TEXT NOT NULL,
    date       DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time   TIME NOT NULL,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id)
  )`);

  // ── refresh_tokens ───────────────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    TEXT NOT NULL,
    token_hash TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    revoked    BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // ── booking_events ───────────────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS booking_events (
    id               TEXT PRIMARY KEY DEFAULT ${UUID_DEFAULT},
    booking_id       TEXT NOT NULL,
    actor_id         TEXT,
    event_type       TEXT NOT NULL,
    previous_status  TEXT,
    new_status       TEXT,
    previous_payment TEXT,
    new_payment      TEXT,
    metadata         TEXT,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
  )`);

  // ── payment_sessions ─────────────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS payment_sessions (
    id                       TEXT PRIMARY KEY DEFAULT ${UUID_DEFAULT},
    booking_id               TEXT NOT NULL,
    user_id                  TEXT NOT NULL,
    stripe_session_id        TEXT UNIQUE,
    amount_total             INTEGER,
    currency                 TEXT DEFAULT 'usd',
    idempotency_key          TEXT UNIQUE,
    expires_at               DATETIME,
    status                   TEXT DEFAULT 'pending',
    stripe_payment_intent_id TEXT,
    payment_method_type      TEXT,
    receipt_url              TEXT,
    last_webhook_event       TEXT,
    paid_at                  DATETIME,
    created_at               DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at               DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
    FOREIGN KEY (user_id)    REFERENCES users(id)
  )`);

  // ── payment_events ───────────────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS payment_events (
    id               TEXT PRIMARY KEY DEFAULT ${UUID_DEFAULT},
    stripe_event_id  TEXT UNIQUE NOT NULL,
    event_type       TEXT NOT NULL,
    booking_id       TEXT,
    payment_session_id TEXT,
    payload          TEXT,
    processed        BOOLEAN DEFAULT 0,
    error_message    TEXT,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // ── google_oauth_tokens ───────────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS google_oauth_tokens (
    id                       TEXT PRIMARY KEY DEFAULT ${UUID_DEFAULT},
    user_id                  TEXT UNIQUE NOT NULL,
    encrypted_refresh_token  TEXT,
    google_account_email     TEXT,
    calendar_id              TEXT DEFAULT 'primary',
    scopes                   TEXT,
    token_issued_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used_at             DATETIME,
    is_valid                 BOOLEAN DEFAULT 1,
    created_at               DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at               DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // ── calendar_sync_log ────────────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS calendar_sync_log (
    id          TEXT PRIMARY KEY DEFAULT ${UUID_DEFAULT},
    booking_id  TEXT,
    admin_id    TEXT,
    action      TEXT NOT NULL,
    status      TEXT DEFAULT 'success',
    google_event_id TEXT,
    error_message   TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
    FOREIGN KEY (admin_id)   REFERENCES users(id)
  )`);

  // ── sms_logs ─────────────────────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS sms_logs (
    id              TEXT PRIMARY KEY DEFAULT ${UUID_DEFAULT},
    user_id         TEXT,
    booking_id      TEXT,
    phone_number    TEXT NOT NULL,
    message_type    TEXT DEFAULT 'notification',
    message_content TEXT,
    status          TEXT DEFAULT 'pending',
    twilio_sid      TEXT,
    error_message   TEXT,
    sent_at         DATETIME,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // ── user_sms_preferences ─────────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS user_sms_preferences (
    id                    TEXT PRIMARY KEY DEFAULT ${UUID_DEFAULT},
    user_id               TEXT UNIQUE NOT NULL,
    enable_confirmations  BOOLEAN DEFAULT 1,
    enable_reminders      BOOLEAN DEFAULT 1,
    enable_cancellations  BOOLEAN DEFAULT 1,
    created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // ── Seed data ─────────────────────────────────────────────────
  // Pre-hashed 'Admin123!' (bcrypt, 12 rounds) — password for dev seed accounts
  const DEFAULT_HASH = '$2a$12$dVNXmsx4TmppehBN9rB/H.7dfwws6YYN3ArNxLuYBDlBgF052Ic1i';

  db.run(`INSERT OR IGNORE INTO users (id, name, email, password_hash, role) VALUES
    ('00000000-0000-4000-a000-000000000001', 'Admin User', 'admin@bookflow.com', '${DEFAULT_HASH}', 'admin'),
    ('00000000-0000-4000-a000-000000000002', 'Test User',  'user@bookflow.com',  '${DEFAULT_HASH}', 'user')`);

  db.run(`INSERT OR IGNORE INTO services (id, name, description, duration_minutes, price) VALUES
    ('00000000-0000-4000-a000-000000000010', 'Consultation', 'Business consultation service', 60,  100.00),
    ('00000000-0000-4000-a000-000000000011', 'Meeting',      'Team meeting',                   30,   50.00),
    ('00000000-0000-4000-a000-000000000012', 'Workshop',     'Training workshop',              120, 200.00)`);

  console.log('✅ SQLite database initialized successfully!');
  console.log(`📍 Database location: ${dbPath}`);
});

module.exports = sqlitePool;
