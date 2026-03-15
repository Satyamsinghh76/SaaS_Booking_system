-- PostgreSQL schema for SaaS booking platform
-- Target database: bookingdb
-- Apply with:
--   psql -U postgres -d bookingdb -f server/db/schema_bookingdb.sql

BEGIN;

-- Optional for case-insensitive email uniqueness
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email CITEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'admin'))
);

CREATE TABLE IF NOT EXISTS services (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  duration INTEGER NOT NULL CHECK (duration > 0),
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0)
);

CREATE TABLE IF NOT EXISTS bookings (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  service_id BIGINT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'paid', 'failed', 'refunded')),

  CONSTRAINT fk_bookings_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_bookings_service
    FOREIGN KEY (service_id)
    REFERENCES services(id)
    ON DELETE RESTRICT,

  -- Prevent double booking for the same service slot.
  CONSTRAINT uq_bookings_service_slot UNIQUE (service_id, date, time)
);

CREATE TABLE IF NOT EXISTS availability (
  id BIGSERIAL PRIMARY KEY,
  service_id BIGINT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  CONSTRAINT fk_availability_service
    FOREIGN KEY (service_id)
    REFERENCES services(id)
    ON DELETE CASCADE,

  CONSTRAINT chk_availability_window
    CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id
  ON bookings (user_id);

CREATE INDEX IF NOT EXISTS idx_bookings_service_date
  ON bookings (service_id, date);

CREATE INDEX IF NOT EXISTS idx_bookings_status
  ON bookings (status);

CREATE INDEX IF NOT EXISTS idx_availability_service_date
  ON availability (service_id, date);

COMMIT;
