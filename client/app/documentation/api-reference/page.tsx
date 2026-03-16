'use client'

import { Code } from 'lucide-react'
import { DocLayout, CodeBlock, Callout, Endpoint } from '@/components/docs/doc-layout'

const toc = [
  { id: 'base-url', label: 'Base URL' },
  { id: 'auth-endpoints', label: 'Authentication' },
  { id: 'services-endpoints', label: 'Services' },
  { id: 'bookings-endpoints', label: 'Bookings' },
  { id: 'payments-endpoints', label: 'Payments' },
  { id: 'admin-endpoints', label: 'Admin' },
  { id: 'notifications-endpoints', label: 'Notifications' },
  { id: 'error-handling', label: 'Error Handling' },
]

export default function APIReferencePage() {
  return (
    <DocLayout
      title="API Reference"
      description="RESTful API documentation for integrating BookFlow into your existing applications."
      icon={<Code className="h-7 w-7 text-primary" />}
      toc={toc}
    >
      <h2 id="base-url">Base URL</h2>
      <CodeBlock>{`http://localhost:3000/api`}</CodeBlock>
      <p>All endpoints are prefixed with <code>/api</code>. Authenticated endpoints require a <code>Bearer</code> token in the <code>Authorization</code> header.</p>
      <CodeBlock title="Example request">{`curl -X GET http://localhost:3000/api/services \\
  -H "Authorization: Bearer <access_token>" \\
  -H "Content-Type: application/json"`}</CodeBlock>

      <h2 id="auth-endpoints">Authentication</h2>
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 divide-y divide-stone-100 dark:divide-stone-800 px-4 my-4">
        <Endpoint method="POST" path="/api/auth/signup" description="Register a new user account" />
        <Endpoint method="POST" path="/api/auth/login" description="Log in and receive JWT access + refresh tokens" />
        <Endpoint method="POST" path="/api/auth/google" description="Google OAuth login/signup" />
        <Endpoint method="GET" path="/api/auth/verify-email" description="Verify email with token" />
        <Endpoint method="POST" path="/api/auth/refresh" description="Refresh an expired access token" />
        <Endpoint method="POST" path="/api/auth/logout" description="Revoke refresh token" />
        <Endpoint method="GET" path="/api/auth/me" description="Get current user profile" auth="Bearer" />
      </div>

      <h3>Signup request body</h3>
      <CodeBlock title="POST /api/auth/signup">{`{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass1!"
}`}</CodeBlock>

      <h3>Login response</h3>
      <CodeBlock title="Response 200">{`{
  "success": true,
  "data": {
    "user": { "id": "uuid", "name": "John Doe", "email": "john@example.com", "role": "user" },
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}`}</CodeBlock>

      <h2 id="services-endpoints">Services</h2>
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 divide-y divide-stone-100 dark:divide-stone-800 px-4 my-4">
        <Endpoint method="GET" path="/api/services" description="List all active services" />
        <Endpoint method="GET" path="/api/services/:id" description="Get single service details" />
        <Endpoint method="POST" path="/api/services" description="Create a new service" auth="Admin" />
        <Endpoint method="PATCH" path="/api/services/:id" description="Update a service" auth="Admin" />
        <Endpoint method="DELETE" path="/api/services/:id" description="Soft-delete a service" auth="Admin" />
      </div>

      <h2 id="bookings-endpoints">Bookings</h2>
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 divide-y divide-stone-100 dark:divide-stone-800 px-4 my-4">
        <Endpoint method="POST" path="/api/bookings" description="Create a new booking" auth="Bearer" />
        <Endpoint method="GET" path="/api/bookings" description="List user's bookings (paginated)" auth="Bearer" />
        <Endpoint method="GET" path="/api/bookings/:id" description="Get single booking details" auth="Bearer" />
        <Endpoint method="GET" path="/api/bookings/booked-slots" description="Get booked slots for a date" auth="Bearer" />
        <Endpoint method="PATCH" path="/api/bookings/:id/status" description="Update booking status" auth="Bearer" />
        <Endpoint method="PATCH" path="/api/bookings/:id/reschedule" description="Reschedule a booking" auth="Bearer" />
        <Endpoint method="DELETE" path="/api/bookings/:id" description="Cancel a booking" auth="Bearer" />
        <Endpoint method="PATCH" path="/api/bookings/:id/payment" description="Update payment status" auth="Admin" />
        <Endpoint method="GET" path="/api/bookings/:id/events" description="Get booking audit trail" auth="Admin" />
      </div>

      <h3>Create booking request</h3>
      <CodeBlock title="POST /api/bookings">{`{
  "service_id": "uuid",
  "date": "2026-03-20",
  "start_time": "10:00",
  "customer_name": "Jane Doe",
  "customer_email": "jane@example.com",
  "customer_phone": "+1234567890",
  "notes": "First session"
}`}</CodeBlock>

      <Callout type="info">
        Bookings are created with <code>pending</code> status and <code>unpaid</code> payment status. The <code>end_time</code> is auto-calculated from the service duration.
      </Callout>

      <h2 id="payments-endpoints">Payments</h2>
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 divide-y divide-stone-100 dark:divide-stone-800 px-4 my-4">
        <Endpoint method="POST" path="/api/payments/checkout" description="Create a Stripe checkout session" auth="Bearer" />
        <Endpoint method="POST" path="/api/payments/webhook" description="Stripe webhook handler" />
        <Endpoint method="GET" path="/api/payments/session/:sessionId" description="Get checkout session status" auth="Bearer" />
        <Endpoint method="GET" path="/api/payments/booking/:bookingId" description="Get payment for a booking" auth="Bearer" />
        <Endpoint method="POST" path="/api/payments/:bookingId/refund" description="Issue a refund" auth="Admin" />
        <Endpoint method="POST" path="/api/payments/simulate" description="Simulate payment (dev only)" auth="Bearer" />
      </div>

      <h2 id="admin-endpoints">Admin</h2>
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 divide-y divide-stone-100 dark:divide-stone-800 px-4 my-4">
        <Endpoint method="GET" path="/api/admin/bookings" description="List all bookings with filters" auth="Admin" />
        <Endpoint method="GET" path="/api/admin/bookings/:id" description="Get booking details" auth="Admin" />
        <Endpoint method="PATCH" path="/api/admin/bookings/:id/confirm" description="Confirm a pending booking" auth="Admin" />
        <Endpoint method="PATCH" path="/api/admin/bookings/:id/cancel" description="Cancel a booking" auth="Admin" />
        <Endpoint method="GET" path="/api/admin/users" description="List users with aggregates" auth="Admin" />
        <Endpoint method="GET" path="/api/admin/users/:id" description="Get user detail" auth="Admin" />
        <Endpoint method="PATCH" path="/api/admin/users/:id/status" description="Activate/deactivate user" auth="Admin" />
        <Endpoint method="GET" path="/api/admin/analytics/dashboard" description="Full dashboard data" auth="Admin" />
        <Endpoint method="GET" path="/api/admin/analytics/overview" description="KPI overview" auth="Admin" />
        <Endpoint method="GET" path="/api/admin/analytics/revenue" description="Revenue analytics" auth="Admin" />
        <Endpoint method="GET" path="/api/admin/analytics/services" description="Service performance" auth="Admin" />
        <Endpoint method="GET" path="/api/admin/analytics/bookings" description="Booking patterns" auth="Admin" />
        <Endpoint method="GET" path="/api/admin/analytics/users" description="User analytics" auth="Admin" />
      </div>

      <h2 id="notifications-endpoints">Notifications</h2>
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 divide-y divide-stone-100 dark:divide-stone-800 px-4 my-4">
        <Endpoint method="GET" path="/api/user/notifications" description="Get user notifications" auth="Bearer" />
        <Endpoint method="POST" path="/api/user/notifications/:id/read" description="Mark notification as read" auth="Bearer" />
        <Endpoint method="POST" path="/api/user/notifications/read-all" description="Mark all as read" auth="Bearer" />
      </div>

      <h2 id="error-handling">Error Handling</h2>
      <p>All errors follow a consistent format:</p>
      <CodeBlock title="Error Response">{`{
  "success": false,
  "message": "Human-readable error description",
  "code": "ERROR_CODE",
  "errors": [
    { "field": "email", "message": "Must be a valid email address." }
  ]
}`}</CodeBlock>
      <p>Common HTTP status codes:</p>
      <ul>
        <li><code>400</code> &mdash; Bad request (missing required fields)</li>
        <li><code>401</code> &mdash; Unauthorized (invalid or expired token)</li>
        <li><code>403</code> &mdash; Forbidden (insufficient permissions)</li>
        <li><code>404</code> &mdash; Resource not found</li>
        <li><code>409</code> &mdash; Conflict (e.g. <code>SLOT_CONFLICT</code> for double-booking)</li>
        <li><code>422</code> &mdash; Validation error or invalid state transition</li>
        <li><code>429</code> &mdash; Rate limited</li>
      </ul>
    </DocLayout>
  )
}
