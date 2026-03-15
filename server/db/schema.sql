-- =============================================================================
-- BookFlow SaaS Platform — PostgreSQL Schema
-- =============================================================================
-- Apply with:  psql -U <user> -d <database> -f schema.sql
-- Requires PostgreSQL 14+
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------

-- gen_random_uuid() — built-in since PG 13, no extension needed.
-- btree_gist — required for the EXCLUDE overlap constraint on availability.
CREATE EXTENSION IF NOT EXISTS btree_gist;


-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Automatically update the updated_at column on every row change.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =============================================================================
-- TABLE: users
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT        NOT NULL,
  email                TEXT        NOT NULL,
  password_hash        TEXT        NOT NULL,

  -- 'user' = customer, 'admin' = platform staff
  role                 TEXT        NOT NULL DEFAULT 'user'
                                   CHECK (role IN ('user', 'admin')),

  phone_number         TEXT,
  phone_verified       BOOLEAN     NOT NULL DEFAULT FALSE,
  email_verified       BOOLEAN     NOT NULL DEFAULT FALSE,
  verification_token   TEXT,
  verification_expires TIMESTAMPTZ,

  is_active            BOOLEAN     NOT NULL DEFAULT TRUE,

  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_users_email     ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role      ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users (is_active);

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE  users              IS 'Platform accounts — both customers and admins.';
COMMENT ON COLUMN users.password_hash IS 'bcryptjs hash, never returned to clients.';
COMMENT ON COLUMN users.role          IS 'user | admin';


-- =============================================================================
-- TABLE: services
-- =============================================================================

CREATE TABLE IF NOT EXISTS services (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT         NOT NULL,
  description      TEXT,

  -- Duration of one booking slot (e.g. 60 = one hour)
  duration_minutes INTEGER      NOT NULL CHECK (duration_minutes > 0),

  -- Stored in minor currency units or as a decimal; USD example: 75.00
  price            NUMERIC(10,2) NOT NULL CHECK (price >= 0),

  category         TEXT         NOT NULL DEFAULT '',

  is_active        BOOLEAN      NOT NULL DEFAULT TRUE,

  -- Admin who created the service (nullable so rows survive user deletion)
  created_by       UUID         REFERENCES users(id) ON DELETE SET NULL,

  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT services_name_unique UNIQUE (name)
);

CREATE INDEX IF NOT EXISTS idx_services_is_active  ON services (is_active);
CREATE INDEX IF NOT EXISTS idx_services_created_by ON services (created_by);

-- Active-services listing: covers the common WHERE is_active = TRUE query
-- with price and name ordering used by the booking wizard.
CREATE INDEX IF NOT EXISTS idx_services_active_price
  ON services (price)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_services_active_name
  ON services (name)
  WHERE is_active = TRUE;

DROP TRIGGER IF EXISTS trg_services_updated_at ON services;
CREATE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE  services                  IS 'Bookable services offered on the platform.';
COMMENT ON COLUMN services.duration_minutes IS 'Slot length in minutes used to generate time slots.';
COMMENT ON COLUMN services.price            IS 'Listed price; copied to bookings.price_snapshot at booking time.';


-- =============================================================================
-- TABLE: bookings
-- =============================================================================

CREATE TABLE IF NOT EXISTS bookings (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  user_id             UUID         NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  service_id          UUID         NOT NULL REFERENCES services(id) ON DELETE RESTRICT,

  -- Slot
  booking_date        DATE         NOT NULL,
  start_time          TIME         NOT NULL,
  end_time            TIME         NOT NULL,

  -- State machine
  -- pending → confirmed → completed | cancelled | no_show
  status              TEXT         NOT NULL DEFAULT 'pending'
                                   CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),

  -- Stripe / payment state
  payment_status      TEXT         NOT NULL DEFAULT 'unpaid'
                                   CHECK (payment_status IN ('unpaid', 'paid', 'refunded', 'failed')),

  -- Denormalised snapshots captured at booking time
  price_snapshot      NUMERIC(10,2) NOT NULL,           -- price at time of booking
  service_name        TEXT,                             -- service name (survives service rename)

  -- Contact for SMS reminders
  user_phone          TEXT,

  -- Notes from customer
  notes               TEXT,

  -- Stripe / payment metadata
  stripe_session_id         TEXT,
  stripe_payment_intent_id  TEXT,
  paid_at                   TIMESTAMPTZ,
  refunded_at               TIMESTAMPTZ,
  refund_reason             TEXT,

  -- Google Calendar sync metadata
  google_event_id      TEXT,
  google_calendar_id   TEXT,
  calendar_synced_at   TIMESTAMPTZ,

  -- Cancellation metadata
  cancelled_at        TIMESTAMPTZ,
  cancellation_reason TEXT,

  -- SMS reminder job flag
  reminder_sent       BOOLEAN      NOT NULL DEFAULT FALSE,

  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT bookings_start_before_end CHECK (start_time < end_time)
);

-- Backfill for existing databases created before the columns above existed.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_session_id        TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS paid_at                  TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refunded_at              TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_reason            TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS google_event_id          TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS google_calendar_id       TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS calendar_synced_at       TIMESTAMPTZ;

-- Core lookup patterns
CREATE INDEX IF NOT EXISTS idx_bookings_user_id      ON bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id   ON bookings (service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings (booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status       ON bookings (status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment      ON bookings (payment_status);

-- Compound index for the double-booking guard overlap query
CREATE INDEX IF NOT EXISTS idx_bookings_slot
  ON bookings (service_id, booking_date, start_time, end_time);

-- SMS reminder job: only scans confirmed, unsent rows
CREATE INDEX IF NOT EXISTS idx_bookings_reminder
  ON bookings (status, reminder_sent)
  WHERE status = 'confirmed' AND reminder_sent = FALSE;

-- User dashboard: "my upcoming bookings" (user_id + date ordered/filtered)
CREATE INDEX IF NOT EXISTS idx_bookings_user_date
  ON bookings (user_id, booking_date);

-- Admin daily schedule: all bookings on a date with a given status
CREATE INDEX IF NOT EXISTS idx_bookings_date_status
  ON bookings (booking_date, status);

-- Active-only slot lookup: filters out cancelled/no_show rows, used by the
-- availability checker and admin calendar view.
CREATE INDEX IF NOT EXISTS idx_bookings_active_slot
  ON bookings (service_id, booking_date, start_time, end_time)
  WHERE status NOT IN ('cancelled', 'no_show');

-- ── Double-booking enforcement at the database level ────────────────────────
-- This is Layer 2 of the double-booking guard (Layer 1 = advisory lock +
-- SELECT overlap check in utils/doubleBookingGuard.js).
--
-- The EXCLUDE constraint is the hard backstop: even if two concurrent
-- requests slip past the advisory-lock pre-check, PostgreSQL will reject
-- one transaction with error code 23P01 (exclusion_violation), which the
-- errorHandler translates into a 409 SLOT_CONFLICT response.
--
-- Requires btree_gist (loaded above).
-- Partial: cancelled and no_show bookings release their slot.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint
    WHERE  conrelid = 'bookings'::regclass
    AND    conname  = 'bookings_no_overlap'
  ) THEN
    ALTER TABLE bookings
      ADD CONSTRAINT bookings_no_overlap
        EXCLUDE USING gist (
          service_id WITH =,
          tsrange(
            (booking_date + start_time)::timestamp,
            (booking_date + end_time)::timestamp,
            '[)'
          ) WITH &&
        )
        WHERE (status NOT IN ('cancelled', 'no_show'));
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_bookings_updated_at ON bookings;
CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE  bookings                 IS 'Customer bookings for a service at a specific date and time.';
COMMENT ON COLUMN bookings.price_snapshot  IS 'Price copied from services.price at booking creation — immune to later price changes.';
COMMENT ON COLUMN bookings.service_name    IS 'Service name copied at booking creation — survives service rename.';
COMMENT ON COLUMN bookings.user_phone      IS 'Phone number captured at booking time for SMS reminders.';
COMMENT ON COLUMN bookings.reminder_sent   IS 'Set to TRUE by the SMS reminder job after the message is dispatched.';


-- =============================================================================
-- TABLE: availability
-- =============================================================================
-- Each row is a time window during which a service accepts bookings.
-- The EXCLUDE constraint prevents two windows for the same service overlapping
-- on the same day — enforced at the database level.
-- =============================================================================

CREATE TABLE IF NOT EXISTS availability (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id  UUID        NOT NULL REFERENCES services(id) ON DELETE CASCADE,

  date        DATE        NOT NULL,
  start_time  TIME        NOT NULL,
  end_time    TIME        NOT NULL,

  -- Admin who defined this window
  created_by  UUID        REFERENCES users(id) ON DELETE SET NULL,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT availability_start_before_end CHECK (start_time < end_time),

  -- Prevent overlapping windows for the same service on the same day.
  -- Requires the btree_gist extension (loaded above).
  CONSTRAINT availability_no_overlap
    EXCLUDE USING gist (
      service_id WITH =,
      tsrange(date + start_time, date + end_time, '[)') WITH &&
    )
);

-- Primary lookup: service + date
CREATE INDEX IF NOT EXISTS idx_availability_service_date
  ON availability (service_id, date);

CREATE INDEX IF NOT EXISTS idx_availability_created_by
  ON availability (created_by);

COMMENT ON TABLE  availability            IS 'Time windows during which a service is open for bookings.';
COMMENT ON COLUMN availability.date       IS 'Calendar date the window applies to.';
COMMENT ON CONSTRAINT availability_no_overlap ON availability
  IS 'Prevents two availability windows for the same service from overlapping on the same day.';


-- =============================================================================
-- TABLE: booking_events  (audit log)
-- =============================================================================
-- Append-only event log. Every status / payment change writes a row here so
-- admins can see the full lifecycle of a booking.
-- =============================================================================

CREATE TABLE IF NOT EXISTS booking_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID        NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,

  -- The user (admin or customer) who triggered this event
  actor_id    UUID        REFERENCES users(id) ON DELETE SET NULL,

  -- e.g. 'created' | 'confirmed' | 'cancelled' | 'payment_received'
  event_type  TEXT        NOT NULL,

  previous_status  TEXT,
  new_status  TEXT,
  previous_payment TEXT,
  new_payment TEXT,

  -- Arbitrary JSON payload (timestamps, notes, Stripe IDs, …)
  metadata    JSONB,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()

  -- No updated_at — this table is append-only
);

-- Backfill for existing databases created before these audit columns existed.
ALTER TABLE booking_events ADD COLUMN IF NOT EXISTS previous_status  TEXT;
ALTER TABLE booking_events ADD COLUMN IF NOT EXISTS previous_payment TEXT;

CREATE INDEX IF NOT EXISTS idx_booking_events_booking_id
  ON booking_events (booking_id);

CREATE INDEX IF NOT EXISTS idx_booking_events_actor_id
  ON booking_events (actor_id);

CREATE INDEX IF NOT EXISTS idx_booking_events_type
  ON booking_events (event_type);

COMMENT ON TABLE  booking_events            IS 'Append-only audit trail for every booking state change.';
COMMENT ON COLUMN booking_events.metadata   IS 'Flexible JSONB payload — Stripe IDs, cancellation details, etc.';


-- =============================================================================
-- TABLE: refresh_tokens
-- =============================================================================

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT        NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens (expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_active ON refresh_tokens (user_id, revoked)
  WHERE revoked = FALSE;


-- =============================================================================
-- TABLE: google_oauth_tokens
-- =============================================================================

CREATE TABLE IF NOT EXISTS google_oauth_tokens (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  encrypted_refresh_token TEXT        NOT NULL,
  google_account_email    TEXT,
  calendar_id             TEXT        NOT NULL DEFAULT 'primary',
  scopes                  TEXT[]      NOT NULL DEFAULT '{}'::TEXT[],
  token_issued_at         TIMESTAMPTZ,
  last_used_at            TIMESTAMPTZ,
  is_valid                BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_google_tokens_is_valid ON google_oauth_tokens (is_valid);

DROP TRIGGER IF EXISTS trg_google_oauth_tokens_updated_at ON google_oauth_tokens;
CREATE TRIGGER trg_google_oauth_tokens_updated_at
  BEFORE UPDATE ON google_oauth_tokens
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =============================================================================
-- TABLE: payment_sessions
-- =============================================================================

CREATE TABLE IF NOT EXISTS payment_sessions (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id                UUID        NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id                   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_session_id         TEXT        NOT NULL UNIQUE,
  stripe_payment_intent_id  TEXT,
  amount_total              INTEGER     NOT NULL,
  currency                  TEXT        NOT NULL DEFAULT 'usd',
  status                    TEXT        NOT NULL DEFAULT 'created',
  payment_method_type       TEXT,
  receipt_url               TEXT,
  idempotency_key           TEXT,
  last_webhook_event        JSONB,
  paid_at                   TIMESTAMPTZ,
  expires_at                TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_sessions_booking_id ON payment_sessions (booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_user_id ON payment_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_intent_id ON payment_sessions (stripe_payment_intent_id);

DROP TRIGGER IF EXISTS trg_payment_sessions_updated_at ON payment_sessions;
CREATE TRIGGER trg_payment_sessions_updated_at
  BEFORE UPDATE ON payment_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =============================================================================
-- TABLE: payment_events
-- =============================================================================

CREATE TABLE IF NOT EXISTS payment_events (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id     TEXT        NOT NULL UNIQUE,
  event_type          TEXT        NOT NULL,
  booking_id          UUID        REFERENCES bookings(id) ON DELETE SET NULL,
  payment_session_id  UUID        REFERENCES payment_sessions(id) ON DELETE SET NULL,
  payload             JSONB,
  processed           BOOLEAN     NOT NULL DEFAULT FALSE,
  error_message       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_events_booking_id ON payment_events (booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_processed ON payment_events (processed);


-- =============================================================================
-- TABLE: calendar_sync_log
-- =============================================================================

CREATE TABLE IF NOT EXISTS calendar_sync_log (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      UUID        REFERENCES bookings(id) ON DELETE SET NULL,
  admin_id        UUID        REFERENCES users(id) ON DELETE SET NULL,
  action          TEXT        NOT NULL,
  status          TEXT        NOT NULL,
  google_event_id TEXT,
  error_message   TEXT,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_booking_id ON calendar_sync_log (booking_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_admin_id ON calendar_sync_log (admin_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_created_at ON calendar_sync_log (created_at DESC);


-- =============================================================================
-- Seed: default admin user  (change password immediately in production)
-- Password shown below is the bcrypt hash of the literal string "changeme123"
-- Generated with: SELECT crypt('changeme123', gen_salt('bf', 12))
-- =============================================================================

-- =============================================================================
-- TABLE: sms_logs
-- =============================================================================

CREATE TABLE IF NOT EXISTS sms_logs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        REFERENCES users(id) ON DELETE SET NULL,
  booking_id      UUID        REFERENCES bookings(id) ON DELETE SET NULL,
  phone_number    TEXT        NOT NULL,
  message_type    TEXT        NOT NULL DEFAULT 'notification',
  message_content TEXT,
  status          TEXT        NOT NULL DEFAULT 'pending',
  twilio_sid      TEXT,
  error_message   TEXT,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_logs_booking_id ON sms_logs (booking_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_user_id ON sms_logs (user_id);

-- =============================================================================
-- TABLE: user_sms_preferences
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_sms_preferences (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  enable_confirmations  BOOLEAN     NOT NULL DEFAULT TRUE,
  enable_reminders      BOOLEAN     NOT NULL DEFAULT TRUE,
  enable_cancellations  BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- Seed data
-- =============================================================================

-- Pre-hashed 'Admin123!' (bcrypt, 12 rounds)
INSERT INTO users (name, email, password_hash, role, email_verified)
VALUES
  ('Admin User', 'admin@bookflow.com', '$2a$12$dVNXmsx4TmppehBN9rB/H.7dfwws6YYN3ArNxLuYBDlBgF052Ic1i', 'admin', TRUE),
  ('Test User',  'user@bookflow.com',  '$2a$12$dVNXmsx4TmppehBN9rB/H.7dfwws6YYN3ArNxLuYBDlBgF052Ic1i', 'user',  TRUE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO services (name, description, duration_minutes, price, category)
VALUES
  ('Strategy Consultation', 'One-on-one strategic planning session to align your business goals.', 60,  150.00, 'Consulting'),
  ('Design Review',         'Expert review of your designs with actionable feedback.',              45,  100.00, 'Design'),
  ('Technical Deep Dive',   'In-depth technical analysis and architecture review.',                90,  200.00, 'Development'),
  ('Brand Workshop',        'Collaborative workshop to define your brand identity.',              120,  300.00, 'Branding'),
  ('Growth Strategy',       'Develop a comprehensive growth plan for your business.',              60,  175.00, 'Marketing'),
  ('Quick Sync',            'Brief check-in for ongoing projects and updates.',                    30,   50.00, 'General')
ON CONFLICT (name) DO NOTHING;
