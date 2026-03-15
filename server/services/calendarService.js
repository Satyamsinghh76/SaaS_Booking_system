/**
 * calendarService.js
 * ─────────────────────────────────────────────────────────────
 * All Google Calendar API interactions live here.
 * Controllers and the booking flow import this service only —
 * they never touch googleapis directly.
 *
 * OAuth2 flow summary
 * ───────────────────
 * 1. Admin visits GET /api/calendar/oauth/url  → gets Google consent URL
 * 2. Admin completes consent → Google redirects to /api/calendar/oauth/callback
 * 3. Callback exchanges `code` for tokens → refresh_token stored encrypted in DB
 * 4. All subsequent API calls use getAuthorisedClient(userId):
 *    - Loads refresh token from DB
 *    - Creates OAuth2 client with that refresh token
 *    - google-auth-library automatically fetches/refreshes access tokens
 *
 * Event lifecycle
 * ───────────────
 * createEvent()  → booking confirmed
 * updateEvent()  → booking rescheduled (future feature)
 * deleteEvent()  → booking cancelled
 * syncBooking()  → idempotent: creates if missing, updates if stale
 */

'use strict';

const { google }  = require('googleapis');
const TokenModel  = require('../models/tokenModel');
const { query }   = require('../config/database');

// ── OAuth2 client factory ─────────────────────────────────────

/** Build a base OAuth2 client (no credentials set yet). */
const createOAuth2Client = () =>
  new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

/**
 * Build the Google OAuth consent URL.
 * Direct the admin to this URL once to authorise the app.
 *
 * @returns {string} URL to open in browser
 */
const getAuthUrl = () => {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type:  'offline',      // MUST be 'offline' to get a refresh_token
    prompt:       'consent',      // Force refresh_token on every auth (important for re-auth)
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email', // to get admin's email
    ],
  });
};

/**
 * Exchange an authorisation code (from the callback) for tokens.
 * Stores the refresh token encrypted in the database.
 *
 * @param {string} code    The `code` query param from Google's redirect
 * @param {string} userId  The admin user ID to associate tokens with
 * @returns {Promise<{ googleEmail: string, calendarId: string }>}
 */
const handleOAuthCallback = async (code, userId) => {
  const client       = createOAuth2Client();
  const { tokens }   = await client.getToken(code);

  if (!tokens.refresh_token) {
    throw new Error(
      'No refresh_token received. ' +
      'If you previously authorised this app, revoke access at ' +
      'https://myaccount.google.com/permissions and try again.'
    );
  }

  // Get the admin's Google email address
  client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: 'v2', auth: client });
  const { data: userInfo } = await oauth2.userinfo.get();

  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

  await TokenModel.upsert({
    userId,
    refreshToken: tokens.refresh_token,
    googleEmail:  userInfo.email,
    calendarId,
    scopes: ['calendar', 'calendar.events'],
  });

  console.log(`✅ [calendar] OAuth2 tokens stored for user ${userId} (${userInfo.email})`);
  return { googleEmail: userInfo.email, calendarId };
};

/**
 * Build an authenticated OAuth2 client for a specific admin user.
 * The google-auth-library handles access token refresh transparently.
 *
 * @param {string} userId  Admin user ID
 * @returns {Promise<google.auth.OAuth2>}
 * @throws if no valid token found
 */
const getAuthorisedClient = async (userId) => {
  const tokenData = await TokenModel.findByUserId(userId);

  if (!tokenData) {
    const err = new Error(
      'Google Calendar not connected. ' +
      'Please complete OAuth2 authorisation at GET /api/calendar/oauth/url.'
    );
    err.code = 'CALENDAR_NOT_AUTHORISED';
    err.statusCode = 403;
    throw err;
  }

  const client = createOAuth2Client();
  client.setCredentials({ refresh_token: tokenData.refreshToken });

  // Listen for token refresh events and update last_used_at
  client.on('tokens', async (newTokens) => {
    if (newTokens.refresh_token) {
      // New refresh token issued — update in DB
      await TokenModel.upsert({
        userId,
        refreshToken: newTokens.refresh_token,
        googleEmail:  tokenData.googleEmail,
        calendarId:   tokenData.calendarId,
      });
    }
    await TokenModel.touchLastUsed(userId);
  });

  return { client, calendarId: tokenData.calendarId };
};

// ── Event builders ────────────────────────────────────────────

/**
 * Build the Google Calendar event object from a booking row.
 *
 * @param {object} booking
 * @param {string} booking.service_name
 * @param {string} booking.user_name
 * @param {string} booking.user_email
 * @param {string} booking.date            "YYYY-MM-DD"
 * @param {string} booking.start_time      "HH:MM"
 * @param {string} booking.end_time        "HH:MM"
 * @param {string} booking.duration_minutes
 * @param {string} booking.id              booking UUID
 * @param {string} [booking.notes]
 * @returns {object}  Google Calendar event resource
 */
const buildEventResource = (booking) => {
  const tz      = process.env.CALENDAR_TIMEZONE || 'UTC';
  const appName = process.env.APP_NAME || 'BookIt';
  const appUrl  = process.env.APP_URL  || 'https://bookit.example.com';

  const startDateTime = `${booking.date}T${booking.start_time}:00`;
  const endDateTime   = `${booking.date}T${booking.end_time}:00`;

  return {
    summary:     `${booking.service_name} — ${booking.user_name}`,
    description: [
      `📋 Service:   ${booking.service_name}`,
      `👤 Customer:  ${booking.user_name} (${booking.user_email || 'no email'})`,
      `⏱  Duration:  ${booking.duration_minutes} min`,
      booking.notes ? `📝 Notes:     ${booking.notes}` : null,
      ``,
      `🔗 Booking:   ${appUrl}/bookings/${booking.id}`,
      ``,
      `Managed by ${appName}`,
    ].filter(Boolean).join('\n'),

    start: { dateTime: startDateTime, timeZone: tz },
    end:   { dateTime: endDateTime,   timeZone: tz },

    // Attendees — adds the customer to the event invite
    attendees: booking.user_email
      ? [{ email: booking.user_email, displayName: booking.user_name }]
      : [],

    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email',  minutes: 24 * 60 },  // 24h email reminder
        { method: 'popup',  minutes: 30 },        // 30m popup reminder
      ],
    },

    // Extended properties let us identify this event as ours
    extendedProperties: {
      private: {
        bookingId:  booking.id,
        source:     appName,
      },
    },

    status:       'confirmed',
    transparency: 'opaque',  // marks the time as "busy"
  };
};

// ── Core calendar operations ──────────────────────────────────

/**
 * Create a Google Calendar event for a confirmed booking.
 *
 * @param {object} booking  Full booking row (joined with user + service)
 * @param {string} adminId  ID of admin who confirmed (owns the token)
 * @returns {Promise<{ eventId: string, eventLink: string }>}
 */
const createEvent = async (booking, adminId) => {
  const { client, calendarId } = await getAuthorisedClient(adminId);
  const calendar = google.calendar({ version: 'v3', auth: client });

  const event = buildEventResource(booking);

  const { data } = await calendar.events.insert({
    calendarId,
    requestBody:          event,
    sendNotifications:    true,  // sends invite email to attendees
    sendUpdates:          'all',
  });

  console.log(`✅ [calendar] Event created: ${data.id} for booking ${booking.id}`);

  return {
    eventId:   data.id,
    eventLink: data.htmlLink,
    calendarId,
  };
};

/**
 * Update an existing calendar event (e.g. reschedule).
 *
 * @param {string} googleEventId  Stored on the booking row
 * @param {object} booking
 * @param {string} adminId
 * @returns {Promise<{ eventId: string }>}
 */
const updateEvent = async (googleEventId, booking, adminId) => {
  const { client, calendarId } = await getAuthorisedClient(adminId);
  const calendar = google.calendar({ version: 'v3', auth: client });

  const event = buildEventResource(booking);

  const { data } = await calendar.events.update({
    calendarId,
    eventId:     googleEventId,
    requestBody: event,
    sendUpdates: 'all',
  });

  console.log(`🔄 [calendar] Event updated: ${data.id} for booking ${booking.id}`);
  return { eventId: data.id };
};

/**
 * Delete a calendar event when a booking is cancelled.
 *
 * @param {string} googleEventId
 * @param {string} adminId
 */
const deleteEvent = async (googleEventId, adminId) => {
  const { client, calendarId } = await getAuthorisedClient(adminId);
  const calendar = google.calendar({ version: 'v3', auth: client });

  await calendar.events.delete({
    calendarId,
    eventId:     googleEventId,
    sendUpdates: 'all',  // notifies attendees of cancellation
  });

  console.log(`🗑  [calendar] Event deleted: ${googleEventId}`);
};

/**
 * Idempotent sync: creates the event if it doesn't exist,
 * updates it if it already does.
 *
 * @param {object} booking  Must include google_event_id (may be null)
 * @param {string} adminId
 * @returns {Promise<{ eventId: string, action: 'created'|'updated'|'skipped' }>}
 */
const syncBooking = async (booking, adminId) => {
  if (!['confirmed', 'completed'].includes(booking.status)) {
    return { action: 'skipped', reason: `Status is '${booking.status}'` };
  }

  if (booking.google_event_id) {
    // Event already exists — update it to reflect any changes
    try {
      const result = await updateEvent(booking.google_event_id, booking, adminId);
      return { ...result, action: 'updated' };
    } catch (err) {
      // Event was deleted from Google Calendar — re-create it
      if (err.code === 410 || err.status === 410) {
        const result = await createEvent(booking, adminId);
        return { ...result, action: 'created' };
      }
      throw err;
    }
  }

  // No event yet — create it
  const result = await createEvent(booking, adminId);
  return { ...result, action: 'created' };
};

/**
 * Check whether the calendar connection is healthy.
 * Makes a lightweight API call to verify credentials.
 *
 * @param {string} userId
 * @returns {Promise<{ connected: boolean, email?: string, calendarId?: string }>}
 */
const checkConnection = async (userId) => {
  try {
    const { client, calendarId } = await getAuthorisedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth: client });

    const { data } = await calendar.calendars.get({ calendarId });

    return {
      connected:   true,
      calendarId,
      calendarName: data.summary,
    };
  } catch (err) {
    if (err.code === 'CALENDAR_NOT_AUTHORISED') {
      return { connected: false, reason: 'No OAuth token stored.' };
    }
    return { connected: false, reason: err.message };
  }
};

// ── Audit log ─────────────────────────────────────────────────

/**
 * Write a record to calendar_sync_log.
 * Called by the controller — never throws.
 */
const logSyncAction = async ({ bookingId, adminId, action, status, googleEventId, errorMessage, metadata }) => {
  try {
    await query(
      `INSERT INTO calendar_sync_log
         (booking_id, admin_id, action, status, google_event_id, error_message, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        bookingId     ?? null,
        adminId       ?? null,
        action,
        status,
        googleEventId ?? null,
        errorMessage  ?? null,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );
  } catch (err) {
    console.error('[calendar] Failed to write sync log:', err.message);
  }
};

module.exports = {
  getAuthUrl,
  handleOAuthCallback,
  getAuthorisedClient,
  createEvent,
  updateEvent,
  deleteEvent,
  syncBooking,
  checkConnection,
  logSyncAction,
  buildEventResource,
};
