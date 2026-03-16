'use client'

import { Database } from 'lucide-react'
import { DocLayout, CodeBlock, Callout } from '@/components/docs/doc-layout'

const toc = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'services', label: 'Services' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'payments', label: 'Payments' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'audit-trail', label: 'Audit Trail' },
  { id: 'relationships', label: 'Relationships' },
]

export default function DataModelPage() {
  return (
    <DocLayout
      title="Data Model"
      description="Understanding the BookFlow data model: users, services, bookings, and payments."
      icon={<Database className="h-7 w-7 text-primary" />}
      toc={toc}
    >
      <h2 id="overview">Overview</h2>
      <p>BookFlow uses <strong>PostgreSQL 14+</strong> as the primary database with UUID primary keys, automatic timestamps, and constraint-based data integrity. The schema supports the full booking lifecycle from service creation to payment settlement.</p>

      <Callout type="tip">
        For local development, you can use <code>DB_TYPE=sqlite</code> as a lightweight alternative. The application includes an SQLite compatibility adapter.
      </Callout>

      <h2 id="users">Users</h2>
      <p>The <code>users</code> table stores both customers and administrators:</p>
      <CodeBlock title="users">{`id                  UUID PRIMARY KEY
name                TEXT NOT NULL
email               TEXT NOT NULL UNIQUE
password_hash       TEXT NOT NULL
role                TEXT ('user' | 'admin')
phone_number        TEXT
email_verified      BOOLEAN DEFAULT FALSE
is_active           BOOLEAN DEFAULT TRUE
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ`}</CodeBlock>
      <ul>
        <li><strong>Roles</strong>: <code>user</code> (customer) or <code>admin</code> (platform staff)</li>
        <li><strong>Soft delete</strong>: Users are deactivated via <code>is_active = FALSE</code>, not deleted</li>
        <li><strong>Email verification</strong>: Temporary <code>verification_token</code> and <code>verification_expires</code> fields</li>
      </ul>

      <h2 id="services">Services</h2>
      <p>Bookable service offerings managed by admins:</p>
      <CodeBlock title="services">{`id                  UUID PRIMARY KEY
name                TEXT NOT NULL
description         TEXT
duration_minutes    INTEGER NOT NULL
price               NUMERIC(10,2) NOT NULL
category            TEXT
is_active           BOOLEAN DEFAULT TRUE
created_by          UUID REFERENCES users(id)
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ`}</CodeBlock>
      <ul>
        <li><strong>Soft delete</strong>: Services use <code>is_active</code> to preserve historical booking references</li>
        <li><strong>Price</strong>: Stored with 2 decimal precision; snapshot captured at booking time</li>
      </ul>

      <h2 id="bookings">Bookings</h2>
      <p>The core entity tracking customer appointments:</p>
      <CodeBlock title="bookings">{`id                          UUID PRIMARY KEY
user_id                     UUID REFERENCES users(id)
service_id                  UUID REFERENCES services(id)
booking_date                DATE NOT NULL
start_time                  TIME NOT NULL
end_time                    TIME NOT NULL
status                      TEXT ('pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show')
payment_status              TEXT ('unpaid' | 'paid' | 'refunded' | 'failed')
price_snapshot              NUMERIC(10,2)
customer_name               TEXT
customer_email              TEXT
notes                       TEXT
cancelled_at                TIMESTAMPTZ
cancellation_reason         TEXT
google_event_id             TEXT
reminder_sent               BOOLEAN DEFAULT FALSE
created_at                  TIMESTAMPTZ
updated_at                  TIMESTAMPTZ`}</CodeBlock>

      <h3>Double-booking prevention</h3>
      <p>An <code>EXCLUDE</code> constraint using GiST prevents overlapping time ranges for the same service and date:</p>
      <CodeBlock>{`EXCLUDE USING gist (
  service_id WITH =,
  booking_date WITH =,
  tsrange(start_time, end_time) WITH &&
) WHERE (status NOT IN ('cancelled', 'no_show'))`}</CodeBlock>

      <Callout type="info">
        The <code>price_snapshot</code> and <code>customer_name</code> fields are denormalized copies captured at creation time. This ensures booking records remain accurate even if service prices or user names change later.
      </Callout>

      <h2 id="payments">Payments</h2>
      <h3>payment_sessions</h3>
      <p>Tracks Stripe Checkout Sessions:</p>
      <CodeBlock title="payment_sessions">{`id                          UUID PRIMARY KEY
booking_id                  UUID REFERENCES bookings(id)
user_id                     UUID REFERENCES users(id)
stripe_session_id           TEXT UNIQUE
stripe_payment_intent_id    TEXT
amount_total                NUMERIC(10,2)
status                      TEXT
payment_method_type         TEXT
receipt_url                 TEXT
idempotency_key             TEXT UNIQUE
paid_at                     TIMESTAMPTZ
created_at                  TIMESTAMPTZ`}</CodeBlock>

      <h3>payment_events</h3>
      <p>Stores raw Stripe webhook events for audit and deduplication:</p>
      <CodeBlock title="payment_events">{`id                  UUID PRIMARY KEY
stripe_event_id     TEXT UNIQUE
event_type          TEXT
booking_id          UUID REFERENCES bookings(id)
payload             JSONB
processed           BOOLEAN DEFAULT FALSE
error_message       TEXT
created_at          TIMESTAMPTZ`}</CodeBlock>

      <h2 id="notifications">Notifications</h2>
      <CodeBlock title="notifications">{`id                  UUID PRIMARY KEY
user_id             UUID REFERENCES users(id)
title               TEXT NOT NULL
message             TEXT NOT NULL
type                TEXT ('booking_confirmed' | 'booking_cancelled' | 'booking_reminder' | 'info')
read                BOOLEAN DEFAULT FALSE
link                TEXT
created_at          TIMESTAMPTZ`}</CodeBlock>
      <p>Types include: <code>booking_confirmed</code>, <code>booking_cancelled</code>, <code>booking_completed</code>, <code>booking_reminder</code>, <code>promotional</code>, <code>newsletter</code>, <code>info</code>.</p>

      <h2 id="audit-trail">Audit Trail</h2>
      <p>The <code>booking_events</code> table provides a complete, append-only audit log:</p>
      <CodeBlock title="booking_events">{`id                  UUID PRIMARY KEY
booking_id          UUID REFERENCES bookings(id)
actor_id            UUID REFERENCES users(id)
event_type          TEXT
previous_status     TEXT
new_status          TEXT
previous_payment    TEXT
new_payment         TEXT
metadata            JSONB
created_at          TIMESTAMPTZ`}</CodeBlock>
      <p>Every status change, payment update, and administrative action is recorded with who made the change and when.</p>

      <h2 id="relationships">Relationships</h2>
      <p>Entity relationship summary:</p>
      <ul>
        <li><strong>User</strong> &rarr; has many <strong>Bookings</strong></li>
        <li><strong>Service</strong> &rarr; has many <strong>Bookings</strong></li>
        <li><strong>Booking</strong> &rarr; has many <strong>Booking Events</strong> (audit trail)</li>
        <li><strong>Booking</strong> &rarr; has one <strong>Payment Session</strong></li>
        <li><strong>User</strong> &rarr; has many <strong>Notifications</strong></li>
        <li><strong>User</strong> &rarr; has one <strong>SMS Preferences</strong></li>
        <li><strong>User (admin)</strong> &rarr; has one <strong>Google OAuth Token</strong></li>
      </ul>

      <Callout type="info">
        All foreign keys use <code>UUID</code> types. The schema requires the <code>btree_gist</code> extension for the booking overlap constraint.
      </Callout>
    </DocLayout>
  )
}
