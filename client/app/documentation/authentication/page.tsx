'use client'

import { Key } from 'lucide-react'
import { DocLayout, CodeBlock, Callout } from '@/components/docs/doc-layout'

const toc = [
  { id: 'overview', label: 'Overview' },
  { id: 'jwt-auth', label: 'JWT Authentication' },
  { id: 'token-refresh', label: 'Token Refresh Flow' },
  { id: 'google-oauth', label: 'Google OAuth' },
  { id: 'roles', label: 'Roles & Permissions' },
  { id: 'email-verification', label: 'Email Verification' },
  { id: 'password-policy', label: 'Password Policy' },
  { id: 'rate-limiting', label: 'Rate Limiting' },
]

export default function AuthenticationPage() {
  return (
    <DocLayout
      title="Authentication"
      description="JWT-based auth, Google OAuth integration, and API key management."
      icon={<Key className="h-7 w-7 text-primary" />}
      toc={toc}
    >
      <h2 id="overview">Overview</h2>
      <p>BookFlow uses <strong>JSON Web Tokens (JWT)</strong> for stateless authentication. Users can sign up with email/password or use <strong>Google OAuth</strong> for a seamless login experience.</p>

      <h2 id="jwt-auth">JWT Authentication</h2>
      <p>After a successful login, the server returns two tokens:</p>
      <ul>
        <li><strong>Access Token</strong> &mdash; short-lived (15 minutes), used for API requests</li>
        <li><strong>Refresh Token</strong> &mdash; long-lived (7 days), used to obtain new access tokens</li>
      </ul>

      <h3>Using the access token</h3>
      <p>Include the access token in the <code>Authorization</code> header of every authenticated request:</p>
      <CodeBlock title="Request">{`GET /api/bookings HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json`}</CodeBlock>

      <h3>Token payload</h3>
      <p>The JWT payload contains:</p>
      <CodeBlock title="Decoded JWT">{`{
  "id": "user-uuid",
  "email": "user@example.com",
  "role": "user",
  "name": "John Doe",
  "iat": 1711000000,
  "exp": 1711000900
}`}</CodeBlock>

      <h2 id="token-refresh">Token Refresh Flow</h2>
      <p>When the access token expires, use the refresh token to get a new one without re-authenticating:</p>
      <CodeBlock title="POST /api/auth/refresh">{`{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

// Response
{
  "success": true,
  "data": {
    "accessToken": "new-access-token",
    "refreshToken": "new-refresh-token"
  }
}`}</CodeBlock>

      <Callout type="info">
        Refresh tokens are stored hashed in the database and can be revoked on logout. Each refresh generates a new token pair (rotation).
      </Callout>

      <h2 id="google-oauth">Google OAuth</h2>
      <p>BookFlow supports Google OAuth for one-click login:</p>
      <ol>
        <li>Client-side: Use <code>@react-oauth/google</code> to get a Google credential token</li>
        <li>Send the credential to <code>POST /api/auth/google</code></li>
        <li>Server verifies the token with Google, creates/finds the user, and returns JWT tokens</li>
      </ol>

      <CodeBlock title="POST /api/auth/google">{`{
  "credential": "google-id-token-from-client"
}

// Response: same as login (accessToken + refreshToken)`}</CodeBlock>

      <h3>Setup</h3>
      <p>To enable Google OAuth:</p>
      <ol>
        <li>Create a project in <strong>Google Cloud Console</strong></li>
        <li>Enable the <strong>Google+ API</strong> and <strong>People API</strong></li>
        <li>Create OAuth 2.0 credentials (Web application)</li>
        <li>Add your environment variables:</li>
      </ol>
      <CodeBlock title="server/.env">{`GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret`}</CodeBlock>
      <CodeBlock title="client/.env.local">{`NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com`}</CodeBlock>

      <h2 id="roles">Roles &amp; Permissions</h2>
      <p>BookFlow has two roles:</p>
      <table>
        <thead>
          <tr><th>Role</th><th>Access</th></tr>
        </thead>
        <tbody>
          <tr><td><code>user</code></td><td>Book services, manage own bookings, view own notifications</td></tr>
          <tr><td><code>admin</code></td><td>All user permissions + manage all bookings, services, users, analytics</td></tr>
        </tbody>
      </table>

      <p>Admin-only endpoints are protected by the <code>requireAdmin</code> middleware, which checks both authentication and the <code>admin</code> role.</p>

      <h2 id="email-verification">Email Verification</h2>
      <p>After signup, users receive a verification email with a unique token link. Email verification is required before login.</p>
      <ul>
        <li>Verification tokens expire after <strong>24 hours</strong></li>
        <li>Unverified accounts cannot log in</li>
        <li>Google OAuth accounts are automatically verified</li>
      </ul>

      <h2 id="password-policy">Password Policy</h2>
      <p>Passwords must meet all of the following requirements:</p>
      <ul>
        <li>Minimum <strong>8 characters</strong></li>
        <li>At least one <strong>uppercase letter</strong></li>
        <li>At least one <strong>lowercase letter</strong></li>
        <li>At least one <strong>number</strong></li>
        <li>At least one <strong>special character</strong> (!@#$%^&amp;*)</li>
      </ul>
      <p>Passwords are hashed using <strong>bcryptjs</strong> with automatic salt generation.</p>

      <h2 id="rate-limiting">Rate Limiting</h2>
      <p>To prevent abuse, BookFlow enforces rate limits:</p>
      <table>
        <thead>
          <tr><th>Scope</th><th>Limit</th><th>Window</th></tr>
        </thead>
        <tbody>
          <tr><td>General API</td><td>200 requests</td><td>15 minutes</td></tr>
          <tr><td>Auth endpoints</td><td>20 requests</td><td>15 minutes</td></tr>
        </tbody>
      </table>

      <Callout type="warning">
        Exceeding the rate limit returns a <code>429 Too Many Requests</code> response. Implement exponential backoff in your client.
      </Callout>
    </DocLayout>
  )
}
