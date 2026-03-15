/**
 * recommendationService.js
 * ─────────────────────────────────────────────────────────────
 * AI-powered slot recommendation engine.
 *
 * ══════════════════════════════════════════════════════════════
 *  ALGORITHM OVERVIEW
 * ══════════════════════════════════════════════════════════════
 *
 *  The engine is a multi-signal weighted scoring system. Each
 *  available slot receives a composite score in [0, 1] that
 *  combines four independent signals:
 *
 *  ┌─────────────────────────────────────────────────────────┐
 *  │  SIGNAL              WEIGHT   RATIONALE                 │
 *  ├─────────────────────────────────────────────────────────┤
 *  │  Popularity           0.40    High-demand hours are     │
 *  │  (recency-weighted)           proven desirable;         │
 *  │                               recent 30 days weighted 3×│
 *  ├─────────────────────────────────────────────────────────┤
 *  │  Low Congestion       0.25    Slots with fewer          │
 *  │                               historical overlaps give  │
 *  │                               customers a quieter       │
 *  │                               experience                │
 *  ├─────────────────────────────────────────────────────────┤
 *  │  Recency Bonus        0.20    Slots available sooner    │
 *  │  (slot proximity)             score higher — users      │
 *  │                               generally prefer booking  │
 *  │                               in the near term          │
 *  ├─────────────────────────────────────────────────────────┤
 *  │  User Preference      0.15    Personal history bonus:   │
 *  │                               hours the user has        │
 *  │                               previously booked get a   │
 *  │                               personalisation lift      │
 *  └─────────────────────────────────────────────────────────┘
 *
 *  FINAL SCORE = Σ (signal_value × weight)
 *
 *  All signals are normalised to [0, 1] before weighting, so
 *  no single signal can dominate due to raw magnitude.
 *
 *  COLD-START HANDLING
 *  ─────────────────────
 *  When a service has fewer than MIN_BOOKINGS_FOR_HISTORY bookings,
 *  the popularity signal falls back to a time-of-day prior:
 *    morning (8–12):  0.8
 *    afternoon (12–17): 1.0  (peak)
 *    evening (17–20):  0.7
 *    other:            0.4
 *
 *  When a user has no personal history for this service, the
 *  user preference weight is redistributed to the other signals
 *  proportionally, keeping the total weight at 1.0.
 *
 *  TIE-BREAKING
 *  ────────────
 *  Ties are broken by: (1) slot start time earlier in the day,
 *  (2) date sooner. This prefers predictable, near-term slots.
 */

'use strict';

const Q = require('../utils/recommendationQueries');

// ── Constants ─────────────────────────────────────────────────

const WEIGHTS = {
  popularity:      0.40,
  lowCongestion:   0.25,
  recencyBonus:    0.20,
  userPreference:  0.15,
};

// Fewer than this → cold start fallback
const MIN_BOOKINGS_FOR_HISTORY = 5;

// Time-of-day priors used in cold-start (hour → score)
const TIME_OF_DAY_PRIOR = (hour) => {
  if (hour >= 8  && hour < 12) return 0.8;
  if (hour >= 12 && hour < 17) return 1.0;
  if (hour >= 17 && hour < 20) return 0.7;
  return 0.4;
};

// ── Normalisation helpers ─────────────────────────────────────

/** Min-max normalise an array of numbers to [0, 1]. */
const minMaxNorm = (values) => {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0.5); // all equal → neutral
  return values.map((v) => (v - min) / (max - min));
};

/** Normalise a single value given a known maximum. */
const normByMax = (value, max) => (max > 0 ? Math.min(value / max, 1) : 0);

// ── Signal builders ───────────────────────────────────────────

/**
 * Build a map of { hour → normalized_popularity_score } from
 * historical booking frequency data.
 *
 * Falls back to TIME_OF_DAY_PRIOR when history is insufficient.
 *
 * @param {Array}   popularityRows  from getHourlyPopularity()
 * @param {boolean} coldStart
 * @returns {Map<number, number>}
 */
const buildPopularityMap = (popularityRows, coldStart) => {
  if (coldStart || !popularityRows.length) {
    // Cold start: generate prior for all hours 0–23
    const map = new Map();
    for (let h = 0; h < 24; h++) map.set(h, TIME_OF_DAY_PRIOR(h));
    return map;
  }

  const weights = popularityRows.map((r) => parseFloat(r.recency_weighted_count));
  const normed  = minMaxNorm(weights);
  const map     = new Map();

  popularityRows.forEach((r, i) => {
    map.set(parseInt(r.hour), normed[i]);
  });

  return map;
};

/**
 * Build a map of { "HH:MM" → normalized_congestion_score }
 * where HIGHER score = LOWER congestion (better for recommendation).
 *
 * @param {Array} congestionRows  from getSlotCongestion()
 * @returns {Map<string, number>}
 */
const buildCongestionMap = (congestionRows) => {
  if (!congestionRows.length) return new Map();

  const counts   = congestionRows.map((r) => parseInt(r.overlapping_bookings));
  const maxCount = Math.max(...counts);
  const map      = new Map();

  congestionRows.forEach((r, i) => {
    // Invert: fewer overlaps → higher score
    const rawScore   = maxCount > 0 ? 1 - counts[i] / maxCount : 0.5;
    map.set(r.slot_start, rawScore);
  });

  return map;
};

/**
 * Build a map of { hour → normalized_personal_preference_score }.
 * Returns an empty map if the user has no history.
 *
 * @param {Array} preferenceRows  from getUserPreferences()
 * @returns {Map<number, number>}
 */
const buildPreferenceMap = (preferenceRows) => {
  if (!preferenceRows.length) return new Map();

  const counts = preferenceRows.map((r) => parseInt(r.personal_count));
  const max    = Math.max(...counts);
  const map    = new Map();

  preferenceRows.forEach((r) => {
    map.set(parseInt(r.hour), normByMax(parseInt(r.personal_count), max));
  });

  return map;
};

// ── Recency bonus ─────────────────────────────────────────────

/**
 * Score a slot based on how soon it is. Normalised across all
 * candidate slots so the soonest = 1.0, furthest = 0.0.
 *
 * @param {string} date       "YYYY-MM-DD"
 * @param {string} slotStart  "HH:MM"
 * @param {number} minDaysAhead  min days ahead across all candidates
 * @param {number} maxDaysAhead  max days ahead across all candidates
 * @returns {number}
 */
const calcRecencyBonus = (date, slotStart, minDaysAhead, maxDaysAhead) => {
  const today    = new Date();
  today.setHours(0, 0, 0, 0);
  const slotDate = new Date(`${date}T${slotStart}:00`);
  const daysAhead = (slotDate - today) / 86_400_000;

  if (maxDaysAhead === minDaysAhead) return 0.5;
  // Invert: sooner = higher score
  return 1 - (daysAhead - minDaysAhead) / (maxDaysAhead - minDaysAhead);
};

// ── Adjusted weights when no user history ────────────────────

/**
 * If the user has no preference history, redistribute the
 * userPreference weight proportionally to the other signals.
 *
 * @param {boolean} hasPreferences
 * @returns {object}  weights summing to 1.0
 */
const resolveWeights = (hasPreferences) => {
  if (hasPreferences) return { ...WEIGHTS };

  const spare = WEIGHTS.userPreference;
  const rest  = 1 - spare;

  return {
    popularity:    WEIGHTS.popularity    + spare * (WEIGHTS.popularity    / rest),
    lowCongestion: WEIGHTS.lowCongestion + spare * (WEIGHTS.lowCongestion / rest),
    recencyBonus:  WEIGHTS.recencyBonus  + spare * (WEIGHTS.recencyBonus  / rest),
    userPreference: 0,
  };
};

// ══════════════════════════════════════════════════════════════
//  PUBLIC API
// ══════════════════════════════════════════════════════════════

/**
 * Generate recommended booking slots for a service.
 *
 * @param {object} options
 * @param {string}   options.serviceId
 * @param {string}   [options.userId]          for personalisation (optional)
 * @param {number}   [options.topN=3]          how many slots to return
 * @param {number}   [options.lookAheadDays=14]
 * @param {number}   [options.leadTimeMinutes=60]
 * @param {boolean}  [options.includeColdStartNote=true]
 *
 * @returns {Promise<RecommendationResult>}
 */
const getRecommendedSlots = async ({
  serviceId,
  userId          = null,
  topN            = 5,
  lookAheadDays   = 14,
  leadTimeMinutes = 60,
} = {}) => {

  // ── Phase 1: Fetch all free upcoming slots ────────────────
  const freeSlots = await Q.getUpcomingFreeSlots(serviceId, lookAheadDays, leadTimeMinutes);

  if (!freeSlots.length) {
    return {
      serviceId,
      recommendations: [],
      meta: { message: 'No available slots found in the look-ahead window.', cold_start: false },
    };
  }

  // ── Phase 2: Gather historical signals (run in parallel) ──
  // Group slots by day-of-week for targeted history queries.
  const dowSet = [...new Set(freeSlots.map((s) => s.day_of_week))];

  const [serviceStats, preferenceRows, ...popularityByDow] = await Promise.all([
    Q.getServiceStats(serviceId),
    userId ? Q.getUserPreferences(userId, serviceId) : Promise.resolve([]),
    // One popularity query per distinct day-of-week present in free slots
    ...dowSet.map((dow) => Q.getHourlyPopularity(serviceId, dow)),
  ]);

  // ── Phase 3: Determine cold-start ─────────────────────────
  const totalBookings = parseInt(serviceStats?.total_bookings ?? 0);
  const isColdStart   = totalBookings < MIN_BOOKINGS_FOR_HISTORY;

  // ── Phase 4: Build slot congestion scores ─────────────────
  const slotStartStrings = [...new Set(freeSlots.map((s) => s.slot_start))];
  const durationMin      = serviceStats?.duration_minutes ?? 60;

  // Group slot starts by day-of-week and query congestion
  const congestionByDow = {};
  for (const dow of dowSet) {
    const dowSlots = freeSlots
      .filter((s) => s.day_of_week === dow)
      .map((s) => s.slot_start);
    const unique = [...new Set(dowSlots)];
    congestionByDow[dow] = await Q.getSlotCongestion(serviceId, dow, unique, durationMin);
  }

  // ── Phase 5: Assemble signal maps ─────────────────────────
  // popularityByDow[i] corresponds to dowSet[i]
  const popularityMapByDow = {};
  dowSet.forEach((dow, i) => {
    popularityMapByDow[dow] = buildPopularityMap(popularityByDow[i], isColdStart);
  });

  const congestionMapByDow = {};
  for (const dow of dowSet) {
    congestionMapByDow[dow] = buildCongestionMap(congestionByDow[dow]);
  }

  const preferenceMap  = buildPreferenceMap(preferenceRows);
  const hasPreferences = preferenceMap.size > 0;
  const weights        = resolveWeights(hasPreferences);

  // ── Phase 6: Compute recency bounds (for recency bonus) ───
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const daysAheadList = freeSlots.map((s) => {
    const d = new Date(`${s.date}T${s.slot_start}:00`);
    return (d - today) / 86_400_000;
  });
  const minDays = Math.min(...daysAheadList);
  const maxDays = Math.max(...daysAheadList);

  // ── Phase 7: Score every free slot ────────────────────────
  const scored = freeSlots.map((slot) => {
    const hour = parseInt(slot.slot_start.split(':')[0]);
    const dow  = slot.day_of_week;

    const popularityScore  = popularityMapByDow[dow]?.get(hour)                ?? TIME_OF_DAY_PRIOR(hour);
    const congestionScore  = congestionMapByDow[dow]?.get(slot.slot_start)     ?? 0.5;
    const recencyScore     = calcRecencyBonus(slot.date, slot.slot_start, minDays, maxDays);
    const preferenceScore  = preferenceMap.get(hour)                           ?? 0;

    const finalScore =
      popularityScore  * weights.popularity    +
      congestionScore  * weights.lowCongestion +
      recencyScore     * weights.recencyBonus  +
      preferenceScore  * weights.userPreference;

    return {
      date:       slot.date,
      start_time: slot.slot_start,
      end_time:   slot.slot_end,
      score:      parseFloat(finalScore.toFixed(4)),
      signals: {
        popularity:      parseFloat(popularityScore.toFixed(3)),
        low_congestion:  parseFloat(congestionScore.toFixed(3)),
        recency_bonus:   parseFloat(recencyScore.toFixed(3)),
        user_preference: parseFloat(preferenceScore.toFixed(3)),
      },
    };
  });

  // ── Phase 8: Sort and take top N ──────────────────────────
  // Primary: score DESC
  // Tie-break 1: slot_start ASC (prefer earlier in day)
  // Tie-break 2: date ASC      (prefer sooner date)
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.start_time !== b.start_time) return a.start_time.localeCompare(b.start_time);
    return a.date.localeCompare(b.date);
  });

  const topSlots = scored.slice(0, topN);

  return {
    serviceId,
    recommendations: topSlots,
    meta: {
      total_free_slots:    freeSlots.length,
      total_scored:        scored.length,
      cold_start:          isColdStart,
      personalised:        hasPreferences,
      look_ahead_days:     lookAheadDays,
      lead_time_minutes:   leadTimeMinutes,
      weights_used:        weights,
      service_name:        serviceStats?.service_name ?? null,
      duration_minutes:    durationMin,
      history_bookings:    totalBookings,
    },
  };
};

module.exports = { getRecommendedSlots, WEIGHTS, MIN_BOOKINGS_FOR_HISTORY };
