'use strict';

const { getRecommendedSlots } = require('../services/recommendationService');
const { query }               = require('../config/database');

/**
 * GET /api/bookings/recommended-slots
 * ─────────────────────────────────────────────────────────────
 * Returns the top-N recommended booking slots for a service,
 * scored by a multi-signal AI engine.
 *
 * Query parameters
 * ─────────────────
 * @param {string}  service_id          (required) UUID of the service
 * @param {number}  [top_n=3]           number of recommendations (1–10)
 * @param {number}  [look_ahead_days=14] days forward to scan (1–60)
 * @param {number}  [lead_time_minutes=60] min minutes from now before bookable
 * @param {boolean} [personalise=true]  whether to include user preference signal
 *
 * The user's ID is taken from the JWT payload (req.user.id),
 * not from the query string — prevents users querying as others.
 */
const getRecommendations = async (req, res, next) => {
  try {
    const { service_id, top_n, look_ahead_days, lead_time_minutes, personalise } = req.query;

    // ── Validation ────────────────────────────────────────────
    if (!service_id) {
      return res.status(422).json({
        success: false,
        message: 'service_id is required.',
        example: '/api/bookings/recommended-slots?service_id=<uuid>',
      });
    }

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(service_id)) {
      return res.status(422).json({ success: false, message: 'service_id must be a valid UUID.' });
    }

    // Validate service exists and is active
    const { rows: svcRows } = await query(
      'SELECT id, name FROM services WHERE id = $1 AND is_active = TRUE',
      [service_id]
    );
    if (!svcRows.length) {
      return res.status(404).json({ success: false, message: 'Service not found or inactive.' });
    }

    // Parse and clamp optional params
    const topN           = Math.min(10, Math.max(1, parseInt(top_n           || '5',  10)));
    const lookAheadDays  = Math.min(60, Math.max(1, parseInt(look_ahead_days || '14', 10)));
    const leadTimeMin    = Math.min(1440, Math.max(0, parseInt(lead_time_minutes || '60', 10)));

    // Personalise by default (uses JWT userId); opt-out with ?personalise=false
    const shouldPersonalise = personalise !== 'false';
    const userId            = shouldPersonalise ? req.user?.id ?? null : null;

    // ── Run engine ────────────────────────────────────────────
    const result = await getRecommendedSlots({
      serviceId:       service_id,
      userId,
      topN,
      lookAheadDays,
      leadTimeMinutes: leadTimeMin,
    });

    // ── Format response ───────────────────────────────────────
    return res.json({
      success: true,
      data: {
        service_id,
        service_name:    svcRows[0].name,
        recommendations: result.recommendations.map((slot, idx) => ({
          rank:         idx + 1,
          date:         slot.date,
          start_time:   slot.start_time,
          end_time:     slot.end_time,
          score:        slot.score,
          label:        buildLabel(slot, idx),
          signals:      slot.signals,
        })),
        meta: result.meta,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Generate a human-readable label for a recommendation.
 * The first slot gets a badge based on its strongest signal.
 */
const buildLabel = (slot, rank) => {
  if (rank > 0) return null; // only label the top slot

  const { popularity, low_congestion, user_preference } = slot.signals;
  const max = Math.max(popularity, low_congestion, user_preference);

  if (max === user_preference && user_preference > 0.6) return '⭐ Matches your preference';
  if (max === popularity)                               return '🔥 Most popular time';
  if (max === low_congestion)                           return '🌿 Quiet slot';
  return '✨ Recommended';
};

module.exports = { getRecommendations };
