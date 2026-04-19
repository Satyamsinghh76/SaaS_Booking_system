# BookFlow — Boeing Interview Cheat Sheet

---

## Q1: Walk through the full architecture — user clicks "Book Now" to confirmed booking.

**Frontend:** 3-step wizard (select service → pick date/time → confirm). Before showing slots, calls `GET /api/bookings/booked-slots` to gray out taken ones. On confirm, sends `POST /api/bookings` with JWT attached via Axios interceptor.

**Backend:** Request hits rate limiter (200 req/15min) → JWT auth middleware → validation middleware → `bookingController.createBooking()` → resolves service, calculates end_time → calls `BookingModel.create()`.

**Double-Booking Prevention (3 layers):**
- Layer 1: `pg_try_advisory_xact_lock()` — serializes concurrent requests for the same slot
- Layer 2: SELECT overlap check inside the transaction
- Layer 3: PostgreSQL EXCLUDE constraint with GiST index on tsrange — hard DB-level backstop

INSERT booking (status=pending, payment_status=unpaid) + audit event → COMMIT → return 201 immediately.

**Async (fire-and-forget):** Email, SMS, in-app notification, Google Calendar sync — don't block the response.

**Payment:** Stripe Checkout → webhook `checkout.session.completed` → marks booking paid + auto-confirms. Webhook is idempotent via unique event ID.

---

## Q2: Why advisory lock over SELECT ... FOR UPDATE?

`SELECT ... FOR UPDATE` locks an **existing row**. When two users book the **same new slot**, there's no row to lock — both SELECTs return empty, both INSERT. Race condition.

Advisory lock doesn't need an existing row. I hash `(service_id, date, start_time)` into a lock key. First request acquires it, second blocks or fails. Locks a **concept**, not a row. Transaction-scoped (`_xact_`) so auto-releases on COMMIT/ROLLBACK.

EXCLUDE constraint is the safety net — even if advisory lock logic has a bug, DB won't allow overlapping tsranges.

---

## Q3: What if the server crashes after INSERT but before COMMIT?

Nothing bad. PostgreSQL rolls back uncommitted writes automatically. Booking never existed. Advisory lock auto-releases. User retries, slot is still free.

---

## Q4: Why snapshot the price instead of joining the service table?

Prices change. If admin raises price from $50 to $75, existing bookings shouldn't show $75. Customer agreed to $50. Same for service_name — services can be renamed or deleted. Booking record must be **self-contained and historically accurate**. Standard e-commerce pattern: denormalize at write time.

---

## Q5: JWT auth flow — what happens when access token expires?

Dual-token strategy: short-lived access token (15-30 min) + longer-lived refresh token.

Axios **response interceptor** catches `401` → calls `/api/auth/refresh` → stores new access token → replays the original request. User never notices.

If refresh token also expired → redirect to login. Clear stale tokens from localStorage before login to prevent unnecessary refresh cycles.

---

## Q6: Why PostgreSQL over MongoDB?

- Bookings are inherently **relational** (user → booking → service → payment → audit events)
- Needed **EXCLUDE constraint with GiST indexing** — MongoDB has nothing equivalent
- Needed **ACID transactions** spanning multiple tables (bookings + booking_events + payment_sessions)
- Data integrity is non-negotiable for a booking system → relational DB is the right tool

---

## Q7: Webhook returns 200 immediately — what if async work fails?

Fast 200 is critical — Stripe has a timeout, retries on slow responses.

Safety nets:
1. **Idempotency** — `INSERT stripe_event_id ON CONFLICT DO NOTHING` prevents duplicate processing
2. **Success page** calls `GET /api/payments/session/:id` for live Stripe status — can reconcile if DB is out of sync
3. **Stripe retries** webhooks for up to 3 days with exponential backoff
4. For production: add a **reconciliation cron job** to catch anything missed

---

## Q8: Rate limiting — how would an attacker bypass it?

Current: IP-based (20 req/15min on auth, skips successful requests).

Bypass methods: distributed IPs, botnets, IPv6 rotation.

Defenses to add:
1. **Account-based rate limiting** — limit per email, not just IP
2. **CAPTCHA** after 3 failed attempts
3. **Exponential backoff per account** (1s, 2s, 4s, 8s)
4. **Credential stuffing detection** — one IP hitting many emails = block
5. **WAF** (Cloudflare) — catches bot patterns before reaching server

---

## Q9: 10,000 concurrent booking requests — what breaks first?

**Database** breaks first — advisory locks + EXCLUDE constraint serialize writes, connection pool exhaustion.

Scaling strategy:
1. **PgBouncer** — connection pooling, multiplexes hundreds of app connections
2. **Read replicas** — route `booked-slots` reads to replicas
3. **Message queue** (Redis + BullMQ) — queue writes, workers process sequentially per service
4. **Partition by service** — different services don't conflict, can shard
5. **Redis caching** — cache booked slots with 30s TTL, cuts 90% of read DB load
6. **Horizontal app scaling** — Express is stateless (JWT), load balance across 10+ instances

Advisory locks scale well because locks are scoped to `(service_id, date, time)` — different slots never contend.

---

## Q10: How do you enforce valid status transitions?

State machine in `BookingModel.updateStatus()`:

```
pending    → confirmed, cancelled
confirmed  → completed, cancelled, no_show
completed  → (terminal)
cancelled  → (terminal)
no_show    → (terminal)
```

Invalid transition → `400` error. Enforced **server-side in model layer**, not just controller. Every transition logged in `booking_events` with previous/new status, actor ID, timestamp — full audit trail.

---

## Q11: A real bug you hit and how you debugged it?

**Cold start problem.** Backend on Render free tier spins down after 15 min inactivity. First login attempt after idle period timed out — generic error, confusing UX.

Debugging: Checked Render logs → server taking 15-20s to cold start.

Fix (three-pronged):
1. **Server pre-warming** — login/signup page fires `GET /health` on mount. Server boots while user types credentials
2. **Retry interceptor** — Axios auto-retries on timeout with exponential backoff (2s, 4s)
3. **Progressive UI** — after 5s, button shows "Server is waking up, please wait..."

---

## Q12: What would you do differently starting from scratch?

1. **Event-driven architecture** — emit `booking.created` event, let independent consumers handle email/SMS/calendar with independent retry
2. **WebSockets** — push real-time slot updates to all users viewing the same time picker
3. **TypeScript on backend** — full-stack type safety, especially around state machine and payment flows

---

## Q13: Google OAuth — what happens when user clicks "Sign in with Google"?

1. `@react-oauth/google` renders Google's button. Google handles consent screen — we never see their password
2. Google returns a **JWT ID token** (not access token) with email, name, `sub` (unique Google ID)
3. Frontend sends ID token to `POST /api/auth/google`
4. Backend **verifies** against Google's public keys using `google-auth-library`:
   - Signature valid (Google issued it)
   - `aud` matches our Google Client ID
   - Token not expired
   - `iss` is `accounts.google.com`
5. Existing user → issue our own JWT tokens. New user → create user record with `auth_provider: 'google'`, no password hash
6. Google's token used once for verification, then discarded. Never stored.

If DB is breached, attackers can't access users' Google accounts.

---

## Q14: User signed up with email, then tries Google OAuth with same email?

**Account linking problem.** I reject with a clear error: "An account with this email exists. Please sign in with your password."

Why reject instead of merge: an attacker who controls a Google account with someone else's email could hijack their BookFlow account.

For future account linking: require user to be logged in with password first, then link Google from settings page — proves they own both credentials.

---

## Q15: Logging — how would you debug "booking created but no confirmation email"?

**Winston** with structured JSON logging (timestamp, level, message, metadata).

Debugging steps:
1. Search logs for booking ID — `createBooking` logs on creation
2. Check notification logs — NotificationService logs attempts, successes, failures
3. Common causes: email service error (rate limit, bad API key), unhandled async rejection, server restart killed async work

Improvements for production:
- **Correlation ID** per request for full lifecycle tracing
- **Dead letter queue** for failed email sends
- **Health checks** for external services
- Ship logs to centralized platform (Datadog, CloudWatch)

---

## Q16: How does RBAC work? What stops users from hitting admin endpoints?

Middleware chain: `authenticate` → `authorize(...roles)` → controller

1. `authenticate` — verifies JWT, attaches `req.user` with `id`, `email`, `role`
2. `authorize('admin')` — checks `req.user.role` is in allowed list. If not → `403`
3. `requireAdmin` — shorthand for `[authenticate, authorize('admin')]`

JWT tampering: changing `role: 'user'` to `role: 'admin'` breaks the signature → `authenticate` returns `401`.

Defense in depth: controllers also check ownership — regular users only see their own bookings even if middleware had a bug.

---

## Q17: Error handling strategy — 400, 401, 403, 409?

| Code | When | Example |
|------|------|---------|
| 400 | Validation failure | Invalid date format |
| 401 | Not authenticated | Missing/expired JWT |
| 403 | Not authorized | User on admin endpoint |
| 404 | Not found | Invalid booking ID |
| 409 | Conflict | SLOT_CONFLICT (double booking) |
| 422 | Business rule violation | Can't cancel completed booking |
| 429 | Rate limited | Too many requests |
| 500 | Server error | Unhandled exception |

Consistent response shape:
```json
{"success": false, "message": "...", "code": "SLOT_CONFLICT", "errors": []}
```

`code` field lets frontend handle errors programmatically. On `SLOT_CONFLICT`, frontend re-fetches slots instead of showing generic toast.

500 errors: **never** expose internals (stack traces, SQL) to client. Log full error server-side, return sanitized message.

---

## Q18: API versioning strategy?

Currently: single version under `/api/` — acceptable for MVP with one frontend.

For multi-client/third-party:
1. **URL-based versioning** — `/api/v1/bookings`, `/api/v2/bookings`
2. **Additive changes are safe** — new fields don't break existing clients
3. Only bump version for **breaking changes** (removing/renaming/retyping fields)
4. **Deprecation** — v1 gets `Deprecation` header + sunset date, log which clients still use it

At scale: API gateway (Kong, AWS API Gateway) handles versioning, rate limiting, auth at infrastructure level.

---

## Q19: Security concerns with user-supplied text fields (notes)?

1. **SQL Injection** — parameterized queries (`$1, $2`) everywhere, never string concatenation
2. **XSS** — React auto-escapes JSX content. No `dangerouslySetInnerHTML`. Server-side sanitization as second layer
3. **Stored XSS via admin panel** — same React auto-escaping applies
4. **Request size** — 500 char validation in middleware + Express `json({ limit: '10kb' })`
5. **Helmet** — CSP, `X-Content-Type-Options: nosniff`, `X-XSS-Protection` headers

Principle: **validate on input, escape on output, parameterize all queries**.

---

## Q20: If BookFlow was safety-critical (aircraft maintenance scheduling)?

1. **Idempotency on all writes** — client-generated idempotency key on every request. Already do it for Stripe, extend to all bookings
2. **Two-phase confirmation** — reserve (with TTL) → confirm. Reservation expires if phase 2 never comes
3. **Immutable audit trail** — append-only `booking_events`, no UPDATE/DELETE permissions, separate audit DB
4. **100% test coverage** on state machine. Integration tests against real PostgreSQL, not mocks. No deploy without full suite passing
5. **Circuit breakers** — fail fast if downstream services are down, degrade gracefully
6. **Multi-region replication** — synchronous replication for zero data loss, automatic failover
7. **Formal verification** — model check state transitions to mathematically prove no invalid state is reachable

Difference isn't architecture — it's **rigor**. Same patterns, every layer hardened, tested, audited.

---

## Key Buzzwords to Drop Naturally

- Defense in depth
- Idempotency
- Optimistic/pessimistic concurrency
- ACID transactions
- Event-driven architecture
- Circuit breaker pattern
- Denormalization at write time
- State machine
- Correlation ID
- Advisory locks vs row-level locks
- GiST index / EXCLUDE constraint
- Connection pooling (PgBouncer)
- Horizontal scaling (stateless services)
- Dead letter queue
- Content Security Policy

---

## Quick Stats to Remember

- Rate limit: 200 req/15min (general), 20 req/15min (auth)
- Booking statuses: pending, confirmed, completed, cancelled, no_show
- Payment statuses: unpaid, paid, refunded, failed
- 3-layer double booking: advisory lock → overlap query → EXCLUDE constraint
- Dual tokens: short-lived access + long-lived refresh
- Async notifications: email + SMS + in-app + Google Calendar

---
---

# HARD MODE — Edge Cases, Failures, Scaling, Security

---

## Q21: Advisory lock hashes into 32-bit integer. What about hash collisions?

Two unrelated slots hash to same value → false contention (one waits unnecessarily). Not a correctness issue — overlap check + EXCLUDE constraint still run.

Fix: use `pg_advisory_xact_lock(key1, key2)` with two 32-bit keys. Hash `service_id` → key1, `date+time` → key2. Collision probability drops to ~1 in 10^18.

Key insight: advisory locks optimize the **common case**, EXCLUDE constraint guarantees the **worst case**.

---

## Q22: Two overlapping but not identical slots — User A books 2:00-3:00, User B books 2:30-3:30. Does the advisory lock catch this?

**No.** Lock hashes on `start_time`. Different start times = different lock keys. Both acquire locks.

But Layer 2 (overlap query: `WHERE start_time < $end AND end_time > $start`) catches it. Layer 3 (EXCLUDE constraint with `tsrange && operator`) catches it.

Fix: lock on **normalized 30-min blocks** the booking spans. 2:00-3:00 locks blocks [4,5]. 2:30-3:30 locks blocks [5,6]. Block 5 contends. But adds complexity — overlap query + EXCLUDE already handle it correctly.

---

## Q23: Pending booking where user never pays — slot blocked forever (phantom booking problem).

Solutions:
1. **TTL cron job** — cancel bookings pending > 30 min: `UPDATE bookings SET status='cancelled' WHERE status='pending' AND created_at < NOW() - INTERVAL '30 min'`
2. **Payment-first flow** — Stripe Checkout session has built-in expiry. No payment = no booking. What Ticketmaster/airlines do.
3. **Two-phase reservation** — reserve with `expires_at`, expired reservations stop blocking slots.

Best: TTL cron + payment-first for high-demand slots.

---

## Q24: Email service down for 2 hours — all bookings in that window get no confirmation email.

**Outbox pattern:**
```sql
BEGIN;
INSERT INTO bookings (...) VALUES (...);
INSERT INTO notification_outbox (booking_id, type, status) VALUES ($1, 'email', 'pending');
COMMIT;
```

Worker polls outbox, sends emails, marks `sent`. Service down? Row stays `pending`, retried on next poll. Server crashes? Outbox row is committed — nothing lost.

Transactionally guaranteed. Same PostgreSQL instance — no new infrastructure. Retry with exponential backoff: 1m, 5m, 15m, 1hr, then alert.

---

## Q25: Where is the refresh token stored? Attack surface?

| Storage | Vulnerability | Risk |
|---------|--------------|------|
| localStorage | XSS — any JS on domain can read it | Token exfiltration |
| httpOnly cookie | CSRF — browser auto-attaches cookie | Mitigated by SameSite=Strict |
| httpOnly + rotation | Best option | Stolen token detected on next legitimate use |

Production answer: **httpOnly, Secure, SameSite=Strict cookie + token rotation**. Each refresh issues new token, invalidates old. If attacker uses stolen token, legitimate user's next refresh fails → detect theft → invalidate all tokens for user.

Additional: **token binding** (tie to IP/device fingerprint), **refresh token families** (reused rotated token = confirmed theft → nuke entire family).

---

## Q26: GiST index performance on INSERT-heavy workloads?

GiST inserts ~2-3x slower than B-tree (complex tree structure for multi-dimensional data). At BookFlow scale (hundreds/day) — irrelevant. At millions — matters.

Optimizations:
1. **Partition by date** — `PARTITION BY RANGE (booking_date)`. Smaller GiST per partition. Drop old partitions instantly.
2. **Archive** — move completed bookings > 90 days to `bookings_archive`. Active table stays small.

**Would I remove the EXCLUDE constraint? Never.** Optimize around it, never weaken it. Trade performance for correctness = wrong tradeoff for a booking system.

---

## Q27: Attacker scrapes `/api/bookings/booked-slots` to map out entire business schedule.

Information disclosure / competitive intelligence leak. Even knowing which slots are taken reveals occupancy, peak hours, demand patterns.

Defenses:
1. Auth required (already done)
2. Per-user rate limit on this endpoint (30 req/min)
3. **Return available slots instead of booked** — can't compute occupancy without knowing total capacity
4. **Date range restriction** — reject queries beyond 14 days server-side
5. **Anomaly detection** — alert if user queries > 10 service/date combos in short window

---

## Q28: WebSockets introduce state — how to scale across multiple Express instances?

**Redis Pub/Sub:**
```
User A (Server 1) books slot
→ Server 1 publishes to Redis channel: "slot-updates:service-123:2026-04-15"
→ Redis fans out to all subscribers
→ Server 2, 7, etc. push to their local WebSocket connections
```

Socket.IO has a built-in Redis adapter for this. Minimal infrastructure (likely already have Redis for caching). Scales to millions of connections.

Alternatives: sticky sessions (breaks scaling, loses connections on crash) or dedicated WebSocket service (cleaner separation, more infra).

---

## Q29: UUIDv4 — information leakage and database performance?

UUIDv4 = fully random, no info leakage. But **B-tree index fragmentation** — random inserts cause random I/O. At millions of rows, measurably slower.

**UUIDv7** (RFC 9562) = time-ordered + random bits. Sequential B-tree inserts (like auto-increment) but unpredictable. Sortable by creation time without separate `created_at` index.

Starting over → **UUIDv7 for all primary keys**. Best of both worlds.

---

## Q30: PostgreSQL crashes at 3 AM. What happens?

- In-flight transactions → **rolled back** (WAL ensures crash recovery)
- No data corruption, no partial writes — that's ACID
- Real pain: **downtime** + **connection storm** on recovery

Design for resilience:
1. **PgBouncer** — queues connections during crash, drains gradually on recovery (no thundering herd)
2. **Health check** — `/health` queries DB (`SELECT 1`). Fails → load balancer stops routing traffic
3. **Synchronous replication + auto-failover** — Patroni or RDS Multi-AZ. Replica promotes in <30s
4. **Exponential backoff on reconnect** — don't hammer recovering DB
5. **Circuit breaker** — return `503 + Retry-After` immediately instead of queuing until timeout

---

## Q31: Two identical Stripe webhooks arrive at same millisecond on different servers?

```sql
INSERT INTO stripe_events (event_id) VALUES ('evt_123') ON CONFLICT DO NOTHING;
```

PostgreSQL handles this — uniqueness check is **atomic at database level**. One INSERT succeeds (1 row), other gets DO NOTHING (0 rows). Check row count to decide.

Subtler issue: first INSERT succeeds but processing fails → event marked done but booking not updated. Stripe won't retry (we returned 200).

Fix: **same transaction** for event insert AND booking update:
```sql
BEGIN;
INSERT INTO stripe_events ... ON CONFLICT DO NOTHING; -- if 0 rows, ROLLBACK
UPDATE bookings SET payment_status = 'paid' ...;
COMMIT;
```

Failure → entire transaction rolls back including event insert → Stripe retries → clean reprocess.

---

## Q32: Design infrastructure for 99.99% uptime (52 min downtime/year).

**App Layer:** 3+ instances across 2 AZs, ALB with 10s health checks, auto-scaling, blue-green deploys

**Database:** PostgreSQL synchronous replication + auto-failover (Patroni/RDS Multi-AZ, <30s failover), WAL archival to S3, read replicas for analytics

**Cache:** Redis cluster (3 nodes), Redis Sentinel for failover

**External deps:** Circuit breakers on Stripe/SendGrid/Twilio, fallback email provider (SES), notification outbox for durability

**CDN:** Cloudflare in front of Next.js — static pages served even if origin is down

**Monitoring:** Prometheus + Grafana, PagerDuty (60s alert), synthetic probes from 3 regions every 30s

**Disaster Recovery:** Backups every 6h to different region, RTO: 5 min, RPO: 0 (sync replication)

**What actually kills uptime:** Bad deploys, migrations, config changes. So:
- Backward-compatible migrations only (add column, never rename/drop in same deploy)
- Feature flags — roll out to 5% first
- Auto-rollback if error rate > 1% within 5 min post-deploy

---

## Additional Buzzwords for Hard Mode

- Outbox pattern
- Thundering herd problem
- Phantom booking / reservation TTL
- Token rotation / token families
- GiST index fragmentation
- Table partitioning (PARTITION BY RANGE)
- UUIDv7 (RFC 9562)
- WAL (Write-Ahead Log)
- Blue-green deployment
- Circuit breaker pattern
- Synthetic monitoring
- RTO / RPO
- Birthday paradox (hash collisions)
- Two-phase reservation
- Redis Pub/Sub adapter

---
---

# BOEING SCENARIO — Safety-Critical Aircraft Maintenance Training System

---

## Q33: Pending status in aircraft maintenance training — what's the risk?

Pending = dangerous ambiguity. Supervisor assumes technician is scheduled. Technician assumes it's unconfirmed. Uncertified technician gets assigned to 737 MAX engine inspection.

**Redesigned state machine:**
```
REQUESTED → APPROVED → SCHEDULED → IN_PROGRESS → COMPLETED → VERIFIED
                ↓           ↓           ↓
             REJECTED    CANCELLED    FAILED
```

- **APPROVED** requires supervisor sign-off (no auto-confirm)
- **COMPLETED** = session happened. **VERIFIED** = assessor confirms technician passed → feeds certification DB
- Every transition requires `actor_id`, `reason`, **digital signature** (cryptographic, tied to employee badge)
- Nobody can approve their own training (separation of duties)

---

## Q34: Fire-and-forget notifications — technician misses training because notification failed.

Replace with **tracked, acknowledged delivery pipeline:**

1. **Outbox pattern** — notification in same transaction as booking state change
2. **Multi-channel fallback chain:** Email (read receipt) → SMS (delivery receipt) → Push → Supervisor alert
3. **Mandatory acknowledgment:**
   - Unacknowledged after 2 hours → escalate to supervisor
   - T-24 hours, still unacknowledged → escalate to department head
   - T-4 hours → flag at-risk, notify backup technician
4. **Delivery audit trail** — `notification_deliveries` table tracks sent/delivered/read/acknowledged per channel with timestamps

Every notification is auditable. Prove exactly when, how, and whether the technician was notified.

---

## Q35: Two roles (user/admin) are insufficient. What access control for Boeing?

**ABAC (Attribute-Based Access Control) on top of hierarchical RBAC:**

Roles: TECHNICIAN, INSTRUCTOR, SUPERVISOR, TRAINING_MANAGER, SAFETY_OFFICER, AUDITOR, SYSTEM_ADMIN

**Attribute constraints:**
- Instructor can only teach aircraft types they're **certified on** (737 instructor can't teach 787)
- Technician can only book at their **assigned facility**
- Supervisor can only approve for their **reporting chain**
- Nobody approves their own training (separation of duties)

**Dual-approval for critical ops:**
- Cancel within 48h → supervisor + training manager
- Mark VERIFIED → instructor assessment + independent assessor sign-off
- Modify historical records → **impossible** (append-only audit log, no UPDATE/DELETE)

---

## Q36: How to guarantee zero data loss (RPO = 0)?

**Database architecture:**
```
HAProxy (virtual IP, 3s health checks)
  ├→ Primary (AZ-1, writes)
  ├→ Sync Standby (AZ-2, failover) ← every COMMIT waits for standby confirmation
  └→ Async Standby (Region 2, disaster recovery)
```

- **Synchronous replication** — adds ~2-5ms per write, guarantees zero data loss
- **Patroni** — auto-failover in <30 seconds
- **WAL archival to S3** — point-in-time recovery to any second, 90-day retention
- **S3 Object Lock (WORM)** — even compromised admin can't delete backups
- **Write-ahead confirmation** — API returns success only after commit AND replication. Repl lag > 5s → system goes read-only
- **Checksums on every record** — SHA-256 hash, periodic integrity checks detect bit rot/corruption/tampering

---

## Q37: Logging and monitoring for regulatory audits?

**Three separate logging systems:**

### 1. Application Logs (Operational)
- Structured JSON, shipped to ELK/Datadog
- traceId + spanId for distributed tracing
- 1-year retention, PII hashed in logs

### 2. Audit Logs (Compliance)
```sql
CREATE TABLE audit_log (
    id, timestamp, actor_id, actor_role, actor_ip,
    action, resource_type, resource_id,
    previous_state JSONB, new_state JSONB,
    reason, digital_signature, checksum TEXT  -- SHA-256 for tamper detection
);
REVOKE UPDATE, DELETE ON audit_log FROM ALL;  -- append-only
```
- Replicated to **separate isolated database** app team can't access
- **7-year retention** (FAA requirement)
- Periodic export to WORM storage

### 3. Security Logs (Threat Detection)
- Shipped to SIEM (Splunk/Sentinel)
- Real-time alerts: failed logins > 5, admin actions off-hours, bulk export, unusual geolocations
- 2-year retention

**Monitoring dashboard alerts:**
- Replication lag > 5s → auto read-only mode
- Error rate > 1% for 5 min → page on-call
- Unacknowledged training < 24h away → escalate
- Certification expiring within 30 days → notify manager
- **Audit log write failure → HALT ALL WRITES** (better to refuse booking than create unauditable one)

---

## Q38: Instructor falsifies a training record — technician actually failed. How to prevent?

**Multi-party verification + non-repudiation:**

1. **Separation of duties** — instructor submits assessment, **different certified assessor** independently verifies. Both sign off before VERIFIED status.

2. **Digital signatures** — PIV card / smart badge authentication. Cryptographic signature = non-repudiable proof. Can't deny approving.

3. **Assessment evidence** — test scores, evaluation checklist, photos/video stored in immutable S3 (Object Lock), linked by hash.

4. **Anomaly detection:**
   - Instructor approves > 20/day → flag
   - Marked complete within 10 min of start → flag
   - Same instructor always certifies same group → rotation alert
   - 100% pass rate for months → statistical anomaly flag

5. **Random re-audits** — 5% of completions auto-selected for re-verification by different assessor. Discrepancies → review all recent certifications from that instructor.

6. **Hash chaining:** `checksum = SHA256(record_data + previous_checksum)` — modifying any historical record breaks the chain. Instantly detectable.

---

## Q39: Network outage at remote training facility. Training can't stop.

**Offline-first architecture:**

1. **Local sync database** — facility runs local PostgreSQL mirroring upcoming schedules
2. **Offline mode** — technicians view schedule (cached), instructors mark attendance and submit assessments, all queued in local outbox with timestamps + digital signatures
3. **Conflict resolution on reconnect:**
   - Last-write-wins for non-critical fields (notes)
   - Server-wins for scheduling (HQ cancellation takes precedence)
   - Manual resolution for critical conflicts (flagged for supervisor)
4. **Offline completions** marked `COMPLETED_OFFLINE` — queued for re-verification on reconnect
5. **Sync protocol:** Push outbox → server validates → pull updates → reconcile → clear synced items
6. **Max offline policy** — offline > 48 hours → all offline completions held for mandatory re-verification

---

## Q40: FAA auditor: "Show me every 787 engine training in 2 years, who was certified, prove records aren't tampered."

**Step 1: Query** — join training_sessions + users + assessment_evidence + audit_log for all 787 engine maintenance sessions in date range

**Step 2: Tamper verification** — verify audit log hash chain:
```sql
SELECT id,
    CASE WHEN checksum = SHA256(record_data || LAG(checksum) OVER (ORDER BY timestamp))
    THEN 'VALID' ELSE 'TAMPERED' END AS integrity_status
FROM audit_log WHERE resource_type = 'training_session';
```
All VALID → chain intact, no records modified.

**Step 3: Compliance report** — digitally signed PDF with session details, certifications, assessment scores, evidence links, full audit chain. Cross-referenced with current cert status. Report itself logged in audit trail.

**Step 4: Evidence retrieval** — files from immutable S3, each verified against stored SHA-256 hash.

**What the auditor sees:**
```
Sessions: 847 | Technicians certified: 312 | Pass rate: 94.2%
Audit chain integrity: ALL RECORDS VALID (0 tamper flags)
Overdue recertifications: 3 (flagged, Appendix D)
```

System doesn't just answer — it **proves** the answer is trustworthy.

---

## Boeing Scenario Buzzwords

- ABAC (Attribute-Based Access Control)
- Separation of duties / dual-approval
- Non-repudiation / digital signatures
- PIV card / Common Access Card
- Hash chaining / tamper detection
- WORM storage (Write Once Read Many)
- S3 Object Lock
- Append-only audit log
- Mandatory acknowledgment / escalation chain
- Offline-first / COMPLETED_OFFLINE status
- RPO = 0 / synchronous replication
- WAL archival / point-in-time recovery
- SIEM (Security Information and Event Management)
- FAA 7-year retention requirement
- Compliance report with chain-of-custody proof

---
---

# BOEING SOFTWARE APPRENTICE — ROLE-SPECIFIC PREP

## Resume vs. JD Gap Analysis

| They Want | You Have | Gap Level | Strategy |
|-----------|----------|-----------|----------|
| C#, Java | C++, C | MEDIUM | OOP transfers. Say "I'm proficient in C++ OOP — classes, inheritance, polymorphism, SOLID. C# and Java share these fundamentals. I've already started learning C# through Microsoft docs." |
| React Native | React.js | LOW | "React Native uses the same React paradigm — components, hooks, state management, JSX. The difference is rendering to native views instead of DOM. I can transfer my React skills directly." |
| ASP.NET MVC, IIS, SQL Server | Node.js, Express, PostgreSQL | MEDIUM | "The architecture is the same — MVC pattern, request routing, middleware, ORM layer. Express is my MVC framework today. Switching to ASP.NET MVC is learning new syntax, not new concepts." |
| 360-degree panoramic views | No 3D/graphics experience | HIGH | Research Three.js, WebGL, Pannellum, A-Frame. Say "I've researched panoramic rendering — libraries like Pannellum and A-Frame for web, and Unity/Unreal for desktop. The rendering is the domain knowledge; the full-stack architecture around it is what I bring." |
| SOA / Microservices | Monolithic Express app | MEDIUM | BookFlow has clear service boundaries (booking, payment, notification, auth). Say "BookFlow is structured as a modular monolith with clear service boundaries. Extracting these into microservices means separating them into independent deployments communicating via REST or message queues." |
| DevOps pipeline | Git/GitHub only | MEDIUM | "I understand CI/CD conceptually — automated testing on push, build pipeline, staging environment, production deploy. I use GitHub for version control and Vercel/Render for automated deployments triggered by git push." |
| Modeling & simulation | None | HIGH | "I don't have direct experience, but I understand the concept — creating digital representations of physical systems. The 360-degree panoramic views for aircraft training is exactly this — a virtual model simulating real aircraft for training purposes." |

---

## SECTION 1: Questions They WILL Ask About Gaps

---

### Q41: Your resume shows Node.js and JavaScript, but this role needs C# and Java. How will you handle that?

"The languages differ in syntax, but the engineering principles are identical. My C++ background gives me strong OOP fundamentals — classes, inheritance, polymorphism, encapsulation, memory management. C# and Java are actually *easier* coming from C++ because they handle memory management automatically with garbage collection.

More importantly, what I bring isn't tied to a language — it's architectural thinking. My BookFlow project demonstrates:
- **MVC pattern** — Express routes (controller) → service layer (model) → PostgreSQL (data). ASP.NET MVC is the same pattern, different framework.
- **REST API design** — HTTP verbs, status codes, resource naming, authentication middleware. Language-independent.
- **Database design** — PostgreSQL and SQL Server both speak SQL. My schema design, indexing strategy, and transaction management transfer directly.
- **Concurrency handling** — my advisory lock + EXCLUDE constraint pattern maps to C#'s `lock` keyword and Java's `synchronized` blocks.

I'm already working through Microsoft's C# fundamentals path and building a small REST API in ASP.NET Core to get hands-on experience before the role starts."

---

### Q42: This role requires React Native for mobile. Have you built a mobile app?

"Not yet, but the jump from React.js to React Native is one of the smallest leaps in frontend development. They share:
- Same component model (functional components + hooks)
- Same state management (useState, useContext, Redux)
- Same JSX syntax
- Same ecosystem (npm packages, TypeScript support)

The differences:
- Instead of `<div>`, you use `<View>`. Instead of `<p>`, you use `<Text>`. It's a vocabulary change, not a paradigm change.
- No CSS — you use StyleSheet, which is CSS-like but uses flexbox by default.
- Navigation uses `react-navigation` instead of `next/router`.
- You need to think about platform differences (iOS vs Android) — but React Native abstracts most of this.

From BookFlow, my experience with React components, API integration, form handling, and state management applies 1:1. I'd be productive in React Native within the first week."

---

### Q43: What do you know about 360-degree panoramic views and virtual tours?

"A 360-degree panoramic view is an interactive visual representation where the user can look in any direction from a fixed point — like Google Street View but for aircraft interiors/exteriors.

**How it works technically:**
1. **Capture** — multiple images taken from a fixed point using specialized cameras (or rendered from a 3D model). These are stitched into an **equirectangular projection** — a single 2:1 ratio image that maps the full sphere.

2. **Rendering** — the equirectangular image is projected onto the inside of a sphere. A virtual camera sits at the center. The user rotates the camera by dragging/swiping.

3. **For web:** Libraries like **Three.js** (WebGL) or **Pannellum** render the sphere in a browser. Three.js gives you full control — you create a `SphereGeometry`, apply the panoramic image as a texture, and place a `PerspectiveCamera` inside.

4. **For desktop (C#/Java):** Game engines like **Unity (C#)** or frameworks like **JavaFX with 3D** can render the same sphere. Unity is actually the most practical choice — it exports to desktop, mobile, and web from a single codebase.

5. **For mobile (React Native):** Libraries like `react-native-panorama-view` or embedding a WebGL view.

**For aircraft maintenance training specifically:**
- **Hotspots** — clickable points on the panorama that show component details ("This is the hydraulic pump — maintenance procedure #737-HP-04")
- **Annotations** — overlays showing part numbers, inspection intervals, safety warnings
- **Multi-point tours** — navigate between different positions around/inside the aircraft
- **Interactive checklists** — technician clicks through maintenance steps while viewing the relevant aircraft section

This is where my full-stack skills matter most — the panorama renderer is one component, but the real application is the **training platform around it**: user authentication, progress tracking, assessment system, API backend, database of aircraft models and training curricula. That's exactly what I built with BookFlow."

---

### Q44: Explain microservices architecture. How is it different from what you built?

"BookFlow is a **modular monolith** — one Node.js process, but internally organized into clear modules: auth, bookings, payments, notifications. Each has its own routes, controllers, models, and could theoretically run independently.

**Microservices** means actually deploying them independently:

```
MONOLITH (BookFlow today):
┌──────────────────────────────────┐
│  Express Server                  │
│  ├── /api/auth      (auth)       │
│  ├── /api/bookings  (bookings)   │
│  ├── /api/payments  (payments)   │
│  └── /api/services  (services)   │
│  Single DB connection            │
│  Single deployment               │
└──────────────────────────────────┘

MICROSERVICES (extracted):
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ Auth     │  │ Booking  │  │ Payment  │  │ Notif.   │
│ Service  │  │ Service  │  │ Service  │  │ Service  │
│ Port 3001│  │ Port 3002│  │ Port 3003│  │ Port 3004│
│ Own DB   │  │ Own DB   │  │ Own DB   │  │ Own DB   │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
      ↕              ↕              ↕              ↕
   ┌──────────────────────────────────────────────────┐
   │          API Gateway / Load Balancer              │
   └──────────────────────────────────────────────────┘
```

**Key differences:**
- **Independent deployment** — update the payment service without touching bookings
- **Independent scaling** — booking service gets 10 instances during peak, auth gets 2
- **Technology freedom** — auth in Node.js, payment in Java, notification in Go
- **Fault isolation** — payment service crashes, bookings still work (graceful degradation)

**Tradeoffs:**
- **Network latency** — function calls become HTTP calls (microseconds → milliseconds)
- **Data consistency** — no single transaction across services. Need saga pattern or eventual consistency
- **Operational complexity** — 4 services = 4 deployments, 4 log streams, 4 health checks, distributed tracing

**For Boeing's panoramic training app**, I'd suggest microservices for:
- **Rendering service** — handles 360° image processing (CPU-intensive, scales independently)
- **Training service** — manages courses, assessments, certifications
- **User service** — authentication, roles, permissions
- **Asset service** — stores/serves aircraft models, panoramic images (needs CDN)

Each team can own a service. The India team might own the rendering service while the US team owns the training service."

---

### Q45: What is your experience with DevOps?

"I haven't set up CI/CD pipelines from scratch, but I use continuous deployment daily:
- **Git + GitHub** — branching, pull requests, merge conflicts
- **Vercel** — auto-deploys my React frontend on every push to main. Zero-config CI/CD.
- **Render** — auto-deploys my Express backend on every push. Health checks, auto-restart on crash.

This is essentially a CI/CD pipeline — push code → automated build → automated deploy → health monitoring. I just haven't configured the YAML files manually.

**What I understand conceptually and would quickly learn to implement:**

```
Developer pushes code
    ↓
CI Pipeline (GitHub Actions / Jenkins / Azure DevOps):
    ├── Lint check (ESLint / StyleCop)
    ├── Unit tests (Jest / NUnit / JUnit)
    ├── Integration tests (against test DB)
    ├── Security scan (SAST — SonarQube)
    ├── Build artifact (Docker image / binary)
    └── Push to container registry
    ↓
CD Pipeline:
    ├── Deploy to staging environment
    ├── Run smoke tests
    ├── Manual approval gate (for production)
    ├── Blue-green deploy to production
    └── Post-deploy health check (rollback if failing)
```

**For Boeing specifically:**
- **Azure DevOps** is likely the platform (Boeing is a Microsoft shop)
- **Docker** containers for consistent environments across dev/staging/prod
- **Kubernetes** for orchestrating microservices at scale
- **SonarQube** for code quality gates — no deployment if coverage < 80% or critical vulnerabilities found
- **Artifact versioning** — every build is tagged, every deployment is traceable to a commit"

---

## SECTION 2: Role-Specific Technical Questions

---

### Q46: How would you design the architecture for the 360-degree panoramic training application?

"Three-tier architecture with clear separation:

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT TIER                           │
│                                                         │
│  Desktop App (C#/WPF or Unity)   Mobile App (React Native) │
│  ├── Panorama Viewer (WebGL/Unity)                      │
│  ├── Training Module Navigator                          │
│  ├── Assessment Interface                               │
│  ├── Offline Cache (SQLite)                             │
│  └── Progress Tracker                                   │
└─────────────────────┬───────────────────────────────────┘
                      │ REST API / WebSocket
┌─────────────────────┴───────────────────────────────────┐
│                  APPLICATION TIER                        │
│                                                         │
│  API Gateway (routing, auth, rate limiting)              │
│  ├── Training Service (courses, modules, assessments)   │
│  ├── Asset Service (panoramic images, 3D models, CDN)   │
│  ├── User Service (auth, roles, certifications)         │
│  ├── Analytics Service (progress, completion rates)     │
│  └── Notification Service (reminders, escalations)      │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────┐
│                    DATA TIER                             │
│                                                         │
│  SQL Server (users, training records, assessments)      │
│  Blob Storage / CDN (panoramic images, 3D models)       │
│  Redis (session cache, real-time progress)              │
└─────────────────────────────────────────────────────────┘
```

**Key design decisions:**

1. **Panoramic images are LARGE** (50-200MB per equirectangular image). Serve via CDN with progressive loading — load low-res first, stream high-res tiles as user pans. Never serve from the API server.

2. **Offline support is critical** — maintenance engineers work in hangars with poor connectivity. Pre-download training modules and panoramic assets. Sync progress when back online. Exactly like my BookFlow offline strategy.

3. **Multi-platform from shared logic** — business logic (training rules, assessment scoring) lives in the API layer, not in the clients. Desktop and mobile apps are thin clients that render the UI and call the same APIs.

4. **Hotspot system** — each panoramic image has associated metadata:
```json
{
    "panorama_id": "737-cockpit-01",
    "hotspots": [
        {
            "id": "hs-01",
            "position": {"yaw": 45.2, "pitch": -12.3},
            "type": "info",
            "title": "Overhead Panel — Hydraulic System",
            "content": "Maintenance procedure #737-HYD-04",
            "linked_assessment": "quiz-737-hyd"
        }
    ]
}
```

5. **Assessment engine** — after viewing a module, the technician takes an assessment. Questions can reference specific hotspots ('Identify the bleed air valve in this view'). Results feed into the certification system."

---

### Q47: You'll work with cross-functional teams in India and the US. How do you handle timezone differences and communication?

"I've collaborated asynchronously on BookFlow using GitHub — pull requests, issue tracking, code reviews. For cross-timezone work at Boeing:

**Async-first communication:**
- **Detailed commit messages and PR descriptions** — when the US team wakes up, they should understand my changes without needing to call me. I already do this — my BookFlow commits explain the *why*, not just the *what*.
- **Documentation in code** — clear API contracts, README updates, architecture decision records (ADRs) for non-obvious choices.
- **Shared task board** (Jira/Azure Boards) — every task has acceptance criteria, status, and blockers visible to both teams.

**Overlap hours (roughly 6:30 PM - 10:30 PM IST = 6 AM - 10 AM PST):**
- Daily standup in the overlap window — 15 minutes max
- Block this time for synchronous discussions, design reviews, pair programming
- Avoid scheduling deep work during overlap — save it for async hours

**What I'd specifically do:**
- End my day with a Slack summary: 'Completed X, blocked on Y, planning Z tomorrow'
- Record short Loom videos for UI changes instead of writing long descriptions
- Over-communicate context — assume the reader doesn't have my mental state
- Ask clarifying questions early. A wrong assumption that runs for 12 hours (one timezone cycle) costs a full day."

---

### Q48: Boeing takes code quality seriously. How do you ensure your code is production-ready?

"From BookFlow, here's what I already practice:

1. **Input validation at every boundary** — my Express middleware validates every field before it reaches the controller. No trusting client data.

2. **Parameterized queries everywhere** — zero SQL injection risk. Never string concatenation for queries.

3. **Error handling with consistent response shapes** — every error returns the same JSON structure with status code, message, and machine-readable error code.

4. **Separation of concerns** — routes → controllers → models. Each layer has one responsibility.

5. **Security headers** — Helmet, CORS, HPP, rate limiting. Defense in depth.

**What I'd add for Boeing:**

6. **Unit tests** — every function has tests. Aim for 80%+ coverage. For safety-critical code, 100%.

7. **Code reviews** — no code merges without at least one reviewer. For safety-critical changes, two reviewers from different teams.

8. **Static analysis** — SonarQube catches code smells, vulnerabilities, and complexity before review. Configure quality gates: no new bugs, no new vulnerabilities, coverage doesn't drop.

9. **Coding standards** — follow Boeing's internal style guide. Consistent naming, consistent patterns across the team.

10. **No shortcuts** — never `// TODO: fix later`, never `catch(e) {}` swallowing errors, never hardcoded credentials. In aviation software, 'temporary' hacks become permanent and kill people."

---

## SECTION 3: Behavioral Questions (Boeing Culture)

---

### Q49: Tell me about a time you faced a technical challenge and how you solved it.

"The **Render cold start problem** in BookFlow. Users trying to log in after server inactivity would get timeout errors. The symptom was confusing — they'd see a generic error, not knowing the server was still booting.

**How I diagnosed it:**
1. Noticed the pattern — failures only happened after periods of inactivity
2. Checked Render deployment logs — server taking 15-20 seconds to cold start
3. Reproduced locally by adding artificial startup delay

**How I solved it (three-pronged):**
1. **Server pre-warming** — fire a health check when the login page loads, so the server boots while the user types credentials
2. **Auto-retry with exponential backoff** — Axios interceptor retries on timeout (2s, 4s)
3. **Progressive UX** — after 5 seconds, the button shows 'Server is waking up, please wait...'

**What I learned:** Don't just fix the bug — fix the user experience around the bug. The server will always have cold starts on a free tier. But the user should never feel broken.

This is directly relevant to Boeing — in aviation software, you can't just handle the happy path. You need graceful degradation for every failure mode."

---

### Q50: Why Boeing? Why this role specifically?

"Three reasons:

1. **Impact** — BookFlow handles haircut bookings. If it fails, someone reschedules. At Boeing, the software I build trains maintenance engineers who service aircraft carrying hundreds of people. That level of responsibility is what I want. It forces me to write better code, think about edge cases, and never cut corners.

2. **The technical challenge** — this role combines full-stack development (my core strength), 3D/panoramic rendering (new domain for me), and cross-platform delivery (desktop + mobile). I've never worked on a system where a virtual model needs to be accurate enough to train someone on a real aircraft. That precision requirement is what excites me.

3. **Growth** — I'm a 3rd-year CS student. Working alongside Boeing engineers who build software for aircraft, defense systems, and space vehicles is an unmatched learning environment. I want to understand how software engineering works when failure is not an option — because those habits will make me a better engineer for the rest of my career.

I chose this role over generic SDE internships because I don't want to build another CRUD app. I want to build something where the code I write has a direct line to safety."

---

### Q51: How do you handle disagreements with a team member about a technical approach?

"On BookFlow, I had to decide between advisory locks and row-level locks for double-booking prevention. If a teammate pushed for row-level locks, here's how I'd handle it:

1. **Listen first** — understand their reasoning. Maybe they've used row-level locks successfully at scale. Maybe they're concerned about advisory lock complexity.

2. **Data over opinions** — I'd set up a benchmark. Both approaches, same concurrent load, measure which one handles the edge cases (new slot race condition, overlapping-but-different slots). Let the results decide.

3. **Find the real concern** — often disagreements aren't about the technical choice, they're about risk tolerance, maintenance burden, or familiarity. If the concern is 'advisory locks are unfamiliar to the team,' that's valid — I'd document the pattern thoroughly and run a knowledge-sharing session.

4. **Disagree and commit** — if after discussion the team chooses a different approach and it meets the requirements, I commit fully. I don't passive-aggressively undermine the decision. I can always propose changes later with evidence.

At Boeing, with cross-functional teams across India and the US, this becomes even more important. Cultural differences in communication style mean I need to be explicit about my reasoning, ask clarifying questions, and never assume silence means agreement."

---

### Q52: Where do you see yourself in 3-5 years?

"In 3 years, I want to be a contributing engineer at Boeing — not just writing code, but owning a component of a system. Maybe I own the rendering pipeline for the panoramic training tool, or the assessment engine, or the offline sync system. I want to be the person the team comes to for that component.

In 5 years, I want to have grown into someone who can design systems, not just build them. I want to lead technical design reviews, mentor new apprentices, and contribute to architectural decisions. I also want to have gained domain expertise in aviation software — understanding not just how to write code, but how it fits into Boeing's product lifecycle, certification processes, and safety standards.

I'm not looking for a stepping stone. I'm looking for a place where the problems are hard enough to keep me learning for years."

---

## SECTION 4: Quick One-Page Glance Card (Read 5 Min Before Interview)

---

### YOUR STORY IN 60 SECONDS
"I'm Satyam, 3rd-year CS at Manipal. I built BookFlow — a SaaS booking platform with Node.js, Express, PostgreSQL, React. It handles concurrent bookings without double-booking using a 3-layer concurrency strategy (advisory locks + overlap queries + PostgreSQL EXCLUDE constraints), has JWT auth with role-based access, Stripe payments with webhook handling, and multi-channel notifications. I've deployed it to production and solved real-world problems like server cold starts. I'm applying to Boeing because I want to build software where reliability isn't optional — it's life-critical."

### 5 THINGS TO MENTION NATURALLY
1. **3-layer double booking prevention** — shows you think about concurrency
2. **Cold start fix** — shows you debug production issues
3. **Webhook idempotency** — shows you understand distributed systems
4. **Audit trail (booking_events)** — directly relevant to Boeing's compliance needs
5. **Fire-and-forget → outbox pattern** — shows you know the right way vs. the easy way

### 5 THINGS TO AVOID
1. Don't apologize for not knowing C#/Java — frame it as "transferable OOP skills + actively learning"
2. Don't say "I'm just a student" — you built a production system
3. Don't oversell — if you don't know something, say "I haven't worked with that directly, but here's how I'd approach it"
4. Don't trash your current stack — "Node.js is great for what I built; C#/Java is the right choice for Boeing's needs"
5. Don't give one-word answers — always explain *why*, not just *what*

### QUESTIONS TO ASK THEM (Pick 2-3)
1. "What does the tech stack look like for the panoramic training tool — are you using Unity, custom WebGL, or a different rendering engine?"
2. "How is the team structured between India and the US? Who owns which parts of the application?"
3. "What does the deployment pipeline look like for safety-critical training software? Are there additional review gates beyond standard code review?"
4. "What's the biggest technical challenge the team is facing right now with the 360-degree viewer?"
5. "How do you handle versioning when the aircraft model changes — does the training tool need to support multiple aircraft configurations simultaneously?"
