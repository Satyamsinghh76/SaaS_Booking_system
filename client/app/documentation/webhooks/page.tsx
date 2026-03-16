'use client'

import { Webhook } from 'lucide-react'
import { DocLayout, CodeBlock, Callout } from '@/components/docs/doc-layout'

const toc = [
  { id: 'overview', label: 'Overview' },
  { id: 'stripe-webhooks', label: 'Stripe Webhooks' },
  { id: 'event-types', label: 'Event Types' },
  { id: 'payload-format', label: 'Payload Format' },
  { id: 'setup', label: 'Setup Guide' },
  { id: 'security', label: 'Security' },
  { id: 'testing', label: 'Testing Webhooks' },
]

export default function WebhooksPage() {
  return (
    <DocLayout
      title="Webhooks"
      description="Real-time event notifications for booking creation, updates, and payment status changes."
      icon={<Webhook className="h-7 w-7 text-primary" />}
      toc={toc}
    >
      <h2 id="overview">Overview</h2>
      <p>BookFlow uses webhooks to receive real-time events from external services, primarily <strong>Stripe</strong> for payment processing. When a payment event occurs, Stripe sends an HTTP POST request to your configured webhook endpoint.</p>

      <h2 id="stripe-webhooks">Stripe Webhooks</h2>
      <p>The Stripe webhook handler is located at:</p>
      <CodeBlock>{`POST /api/payments/webhook`}</CodeBlock>
      <p>This endpoint receives raw JSON payloads from Stripe and processes them to update booking and payment statuses in real-time.</p>

      <h3>How it works</h3>
      <ol>
        <li>Customer completes payment on the Stripe checkout page</li>
        <li>Stripe sends a webhook event to your server</li>
        <li>BookFlow verifies the webhook signature for authenticity</li>
        <li>The payment status is updated in the database</li>
        <li>If payment succeeds, the booking is auto-confirmed</li>
        <li>A confirmation email and in-app notification are sent to the user</li>
      </ol>

      <h2 id="event-types">Event Types</h2>
      <p>BookFlow handles the following Stripe webhook events:</p>
      <table>
        <thead>
          <tr><th>Event</th><th>Action</th></tr>
        </thead>
        <tbody>
          <tr><td><code>checkout.session.completed</code></td><td>Mark booking as paid, auto-confirm if pending</td></tr>
          <tr><td><code>checkout.session.expired</code></td><td>Mark payment session as expired</td></tr>
          <tr><td><code>charge.refunded</code></td><td>Mark booking as refunded, update payment status</td></tr>
          <tr><td><code>payment_intent.payment_failed</code></td><td>Log payment failure, mark status as failed</td></tr>
        </tbody>
      </table>

      <h2 id="payload-format">Payload Format</h2>
      <p>Webhook events are stored in the <code>payment_events</code> table for audit and debugging:</p>
      <CodeBlock title="payment_events record">{`{
  "id": "uuid",
  "stripe_event_id": "evt_1234567890",
  "event_type": "checkout.session.completed",
  "booking_id": "uuid",
  "payload": { ... },
  "processed": true,
  "error_message": null,
  "created_at": "2026-03-17T10:30:00Z"
}`}</CodeBlock>

      <Callout type="info">
        Webhook events are idempotent. If Stripe retries the same event, the duplicate is detected via the unique <code>stripe_event_id</code> and skipped.
      </Callout>

      <h2 id="setup">Setup Guide</h2>
      <h3>1. Configure Stripe webhook in dashboard</h3>
      <ol>
        <li>Go to <strong>Stripe Dashboard &gt; Developers &gt; Webhooks</strong></li>
        <li>Click <strong>Add endpoint</strong></li>
        <li>Enter your webhook URL: <code>https://yourdomain.com/api/payments/webhook</code></li>
        <li>Select events: <code>checkout.session.completed</code>, <code>checkout.session.expired</code>, <code>charge.refunded</code></li>
      </ol>

      <h3>2. Add the webhook secret to your environment</h3>
      <CodeBlock title="server/.env">{`STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret`}</CodeBlock>

      <h2 id="security">Security</h2>
      <p>All webhook payloads are verified using Stripe&apos;s signature verification:</p>
      <ul>
        <li>The raw request body is used for signature verification (not parsed JSON)</li>
        <li>The <code>STRIPE_WEBHOOK_SECRET</code> is used to validate the <code>stripe-signature</code> header</li>
        <li>Invalid signatures are rejected with a <code>400</code> response</li>
      </ul>

      <Callout type="warning">
        Never expose your webhook signing secret. If compromised, rotate it immediately in the Stripe dashboard.
      </Callout>

      <h2 id="testing">Testing Webhooks</h2>
      <p>For local development, use the <strong>Stripe CLI</strong> to forward webhook events:</p>
      <CodeBlock title="Terminal">{`# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/payments/webhook

# In another terminal, trigger a test event
stripe trigger checkout.session.completed`}</CodeBlock>
      <p>Alternatively, use the <strong>simulate payment</strong> endpoint for development without Stripe:</p>
      <CodeBlock title="POST /api/payments/simulate">{`{
  "bookingId": "uuid"
}
// Marks the booking as paid and auto-confirms it`}</CodeBlock>
    </DocLayout>
  )
}
