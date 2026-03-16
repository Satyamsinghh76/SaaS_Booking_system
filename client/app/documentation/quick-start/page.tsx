'use client'

import { Zap } from 'lucide-react'
import { DocLayout, CodeBlock, Callout } from '@/components/docs/doc-layout'

const toc = [
  { id: 'prerequisites', label: 'Prerequisites' },
  { id: 'setup', label: 'Project Setup' },
  { id: 'create-service', label: 'Create a Service' },
  { id: 'first-booking', label: 'Your First Booking' },
  { id: 'admin-dashboard', label: 'Admin Dashboard' },
  { id: 'next-steps', label: 'Next Steps' },
]

export default function QuickStartPage() {
  return (
    <DocLayout
      title="Quick Start"
      description="Get up and running with BookFlow in under 5 minutes. Create your first service and accept bookings."
      icon={<Zap className="h-7 w-7 text-primary" />}
      toc={toc}
    >
      <h2 id="prerequisites">Prerequisites</h2>
      <p>Before you begin, ensure you have the following installed:</p>
      <ul>
        <li><strong>Node.js 20+</strong> and npm/pnpm</li>
        <li><strong>PostgreSQL 14+</strong> (or use SQLite for local development)</li>
        <li>A Stripe account (optional, for payments)</li>
      </ul>

      <h2 id="setup">Project Setup</h2>
      <h3>1. Clone and install</h3>
      <CodeBlock title="Terminal">{`git clone <your-repo-url>
cd SaaS
npm run install:all`}</CodeBlock>

      <h3>2. Configure environment</h3>
      <p>Copy the example environment file and fill in your values:</p>
      <CodeBlock title="server/.env">{`PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/bookflow
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
CORS_ORIGIN=http://localhost:3000`}</CodeBlock>

      <Callout type="tip">
        For quick local development, set <code>DB_TYPE=sqlite</code> to skip PostgreSQL setup entirely.
      </Callout>

      <h3>3. Run the database migration</h3>
      <CodeBlock title="Terminal">{`psql -U postgres -d bookflow -f server/db/schema.sql`}</CodeBlock>
      <p>This creates all tables and seeds a default admin account:</p>
      <ul>
        <li>Admin: <code>admin@bookflow.com</code> / <code>Admin123!</code></li>
        <li>Test user: <code>user@bookflow.com</code> / <code>Admin123!</code></li>
      </ul>

      <h3>4. Start the development server</h3>
      <CodeBlock title="Terminal">{`npm run dev`}</CodeBlock>
      <p>This starts both the Express API server (port 3000) and the Next.js frontend concurrently.</p>

      <h2 id="create-service">Create a Service</h2>
      <p>Log in as admin and navigate to the <strong>Admin Dashboard</strong>. Click <strong>Add Service</strong> to create a bookable service:</p>
      <ul>
        <li><strong>Name</strong> &mdash; e.g. &ldquo;Strategy Consultation&rdquo;</li>
        <li><strong>Duration</strong> &mdash; in minutes (30, 60, 90, etc.)</li>
        <li><strong>Price</strong> &mdash; in USD</li>
        <li><strong>Category</strong> &mdash; Consulting, Design, Development, etc.</li>
      </ul>
      <p>The service immediately appears on the public booking page.</p>

      <h2 id="first-booking">Your First Booking</h2>
      <ol>
        <li>Log in as the test user (<code>user@bookflow.com</code>)</li>
        <li>Navigate to <strong>Book Now</strong></li>
        <li>Select a service, pick a date and time slot</li>
        <li>Fill in your details and confirm</li>
        <li>The booking is created with <code>pending</code> status</li>
      </ol>

      <Callout type="info">
        New bookings start as <strong>pending</strong> and require admin confirmation. The admin can confirm or cancel from the Admin Dashboard, and the user receives a notification immediately.
      </Callout>

      <h2 id="admin-dashboard">Admin Dashboard</h2>
      <p>The admin dashboard provides:</p>
      <ul>
        <li><strong>Booking management</strong> &mdash; Confirm, cancel, or mark bookings as completed</li>
        <li><strong>Revenue analytics</strong> &mdash; Charts showing revenue trends, top services, booking patterns</li>
        <li><strong>User management</strong> &mdash; View customer details, activate/deactivate accounts</li>
        <li><strong>Notifications</strong> &mdash; Automatic email and in-app notifications when booking status changes</li>
      </ul>

      <h2 id="next-steps">Next Steps</h2>
      <ul>
        <li>Read the <a href="/documentation/user-guide">User Guide</a> for a complete walkthrough</li>
        <li>Explore the <a href="/documentation/api-reference">API Reference</a> to integrate programmatically</li>
        <li>Set up <a href="/documentation/webhooks">Webhooks</a> for real-time event notifications</li>
        <li>Connect <a href="/documentation/authentication">Google OAuth</a> for seamless login</li>
      </ul>
    </DocLayout>
  )
}
