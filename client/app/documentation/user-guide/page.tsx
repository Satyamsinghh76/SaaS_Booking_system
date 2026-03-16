'use client'

import { Book } from 'lucide-react'
import { DocLayout, Callout } from '@/components/docs/doc-layout'

const toc = [
  { id: 'services', label: 'Managing Services' },
  { id: 'bookings', label: 'Booking Lifecycle' },
  { id: 'payments', label: 'Payments & Billing' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'calendar', label: 'Google Calendar' },
  { id: 'user-dashboard', label: 'User Dashboard' },
  { id: 'admin-actions', label: 'Admin Actions' },
]

export default function UserGuidePage() {
  return (
    <DocLayout
      title="User Guide"
      description="Complete guide to managing services, bookings, payments, and customer notifications."
      icon={<Book className="h-7 w-7 text-primary" />}
      toc={toc}
    >
      <h2 id="services">Managing Services</h2>
      <p>Services are the bookable offerings on your platform. Each service has:</p>
      <ul>
        <li><strong>Name &amp; description</strong> &mdash; shown to customers on the booking page</li>
        <li><strong>Duration</strong> &mdash; length in minutes (determines time slot size)</li>
        <li><strong>Price</strong> &mdash; in USD, captured as a snapshot at booking time</li>
        <li><strong>Category</strong> &mdash; for organizing services (Consulting, Design, etc.)</li>
      </ul>
      <p>Admins can create, edit, and soft-delete services from the admin dashboard. Deleting a service sets it as inactive &mdash; existing bookings are preserved.</p>

      <h2 id="bookings">Booking Lifecycle</h2>
      <p>Every booking goes through a defined state machine:</p>
      <table>
        <thead>
          <tr><th>Status</th><th>Description</th><th>Next States</th></tr>
        </thead>
        <tbody>
          <tr><td><code>pending</code></td><td>Newly created, awaiting admin approval</td><td>confirmed, cancelled</td></tr>
          <tr><td><code>confirmed</code></td><td>Admin has approved the booking</td><td>completed, cancelled, no_show</td></tr>
          <tr><td><code>completed</code></td><td>Service was delivered</td><td>(terminal)</td></tr>
          <tr><td><code>cancelled</code></td><td>Booking was cancelled by user or admin</td><td>(terminal)</td></tr>
          <tr><td><code>no_show</code></td><td>Customer did not attend</td><td>(terminal)</td></tr>
        </tbody>
      </table>

      <Callout type="info">
        When a booking is created, it starts as <strong>pending</strong>. The admin must explicitly confirm it. Users are notified by email and in-app notification when their booking status changes.
      </Callout>

      <h3>Double-Booking Prevention</h3>
      <p>BookFlow uses a 3-layer strategy to prevent double bookings:</p>
      <ol>
        <li><strong>Advisory lock</strong> &mdash; serializes concurrent requests for the same slot</li>
        <li><strong>Application overlap check</strong> &mdash; queries existing bookings before insert</li>
        <li><strong>Database constraint</strong> &mdash; PostgreSQL EXCLUDE constraint as a hard backstop</li>
      </ol>

      <h2 id="payments">Payments &amp; Billing</h2>
      <p>BookFlow integrates with <strong>Stripe</strong> for secure payment processing:</p>
      <ul>
        <li><strong>Checkout Sessions</strong> &mdash; redirect customers to Stripe-hosted payment page</li>
        <li><strong>Webhooks</strong> &mdash; receive real-time payment confirmations from Stripe</li>
        <li><strong>Refunds</strong> &mdash; admins can issue full refunds from the dashboard</li>
        <li><strong>Auto-confirm</strong> &mdash; bookings are automatically confirmed when payment succeeds</li>
      </ul>
      <p>Payment status is tracked separately from booking status: <code>unpaid</code>, <code>paid</code>, <code>refunded</code>, <code>failed</code>.</p>

      <Callout type="tip">
        For development without Stripe, use the <strong>Simulate Payment</strong> endpoint to mark bookings as paid instantly.
      </Callout>

      <h2 id="notifications">Notifications</h2>
      <p>BookFlow sends notifications through multiple channels:</p>

      <h3>Email Notifications</h3>
      <ul>
        <li><strong>Booking confirmed</strong> &mdash; sent when admin confirms a booking</li>
        <li><strong>Booking cancelled</strong> &mdash; sent when a booking is cancelled (includes refund info if applicable)</li>
        <li><strong>Email verification</strong> &mdash; sent after signup to verify email address</li>
      </ul>

      <h3>In-App Notifications</h3>
      <p>Users see a notification bell in their dashboard with real-time updates:</p>
      <ul>
        <li>Booking created, confirmed, completed, or cancelled</li>
        <li>Unread count badge on the bell icon</li>
        <li>Click to navigate directly to the relevant booking</li>
      </ul>

      <h3>SMS Notifications</h3>
      <p>Powered by Twilio, SMS reminders are sent 1 hour before appointments to customers with phone numbers on file. Users can opt in/out from settings.</p>

      <h2 id="calendar">Google Calendar Integration</h2>
      <p>Admin can connect Google Calendar to automatically sync bookings:</p>
      <ol>
        <li>Navigate to <strong>Settings &gt; Calendar</strong> in the admin dashboard</li>
        <li>Click <strong>Connect Google Calendar</strong> and authorize the app</li>
        <li>Confirmed bookings are automatically added as calendar events</li>
        <li>Cancelled bookings are automatically removed from the calendar</li>
      </ol>
      <p>Events include customer name, service details, and a link back to the booking.</p>

      <h2 id="user-dashboard">User Dashboard</h2>
      <p>The customer dashboard provides:</p>
      <ul>
        <li><strong>Overview</strong> &mdash; KPI cards showing upcoming, completed, and total bookings</li>
        <li><strong>Booking list</strong> &mdash; filterable by status (Pending, Confirmed, Completed, Cancelled)</li>
        <li><strong>Reschedule</strong> &mdash; pick a new date/time for pending or confirmed bookings</li>
        <li><strong>Cancel</strong> &mdash; cancel upcoming bookings with confirmation dialog</li>
        <li><strong>Payment</strong> &mdash; pay for unpaid bookings via Stripe checkout</li>
        <li><strong>Notifications</strong> &mdash; bell icon showing real-time status updates</li>
      </ul>

      <h2 id="admin-actions">Admin Actions</h2>
      <p>From the admin dashboard, administrators can:</p>
      <ul>
        <li><strong>Confirm bookings</strong> &mdash; approve pending bookings (triggers notification + calendar sync)</li>
        <li><strong>Cancel bookings</strong> &mdash; cancel pending or confirmed bookings with an optional reason</li>
        <li><strong>Mark completed</strong> &mdash; mark confirmed bookings as completed after service delivery</li>
        <li><strong>Issue refunds</strong> &mdash; process Stripe refunds for paid bookings</li>
        <li><strong>View analytics</strong> &mdash; revenue trends, service popularity, booking patterns</li>
        <li><strong>Manage users</strong> &mdash; activate/deactivate customer accounts</li>
      </ul>
    </DocLayout>
  )
}
