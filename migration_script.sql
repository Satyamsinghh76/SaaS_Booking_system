-- Migration script to fix schema conflicts
-- BACKUP YOUR DATA BEFORE RUNNING THIS

-- Step 1: Create missing extensions
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS citext;

-- Step 2: Add missing columns to existing tables
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;

-- Step 3: Create missing tables for SMS integration
CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  message_type VARCHAR(50) NOT NULL,
  message_content TEXT NOT NULL,
  twilio_sid VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sms_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enable_confirmations BOOLEAN DEFAULT true,
  enable_reminders BOOLEAN DEFAULT true,
  enable_cancellations BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_sms_preferences_user_id_unique UNIQUE (user_id)
);

-- Step 4: Create missing Google tokens table (if doesn't exist)
CREATE TABLE IF NOT EXISTS google_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 5: Add indexes for SMS tables
CREATE INDEX IF NOT EXISTS idx_sms_logs_user_id ON sms_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_booking_id ON sms_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_google_tokens_user_id ON google_tokens(user_id);

-- Step 6: Verify constraints exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'bookings'::regclass 
    AND conname = 'bookings_no_overlap'
  ) THEN
    -- This would require more complex migration for existing data
    RAISE NOTICE 'Manual intervention needed for bookings overlap constraint';
  END IF;
END $$;
