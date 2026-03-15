/**
 * slotGenerator.js
 * ─────────────────────────────────────────────────────────────
 * Pure utility functions for generating bookable time slots
 * from availability windows, respecting:
 *
 *   • Service duration
 *   • Buffer time between slots
 *   • Already-booked intervals
 *   • An optional "buffer before now" to prevent same-minute bookings
 *
 * All functions are pure / side-effect-free — no DB access here.
 * DB queries live in availabilityModel.js.
 *
 * Time representation
 * ───────────────────
 * Internally we work with "minutes since midnight" (an integer)
 * for all arithmetic, then convert back to "HH:MM" strings for
 * the API response.  This avoids Date/timezone pitfalls entirely.
 */

// ── Low-level helpers ─────────────────────────────────────────

/**
 * Convert a "HH:MM" or "HH:MM:SS" string → minutes since midnight.
 *
 * @param {string} timeStr  e.g. "09:30" or "09:30:00"
 * @returns {number}        e.g. 570
 */
const toMinutes = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Convert minutes since midnight → zero-padded "HH:MM" string.
 *
 * @param {number} mins  e.g. 570
 * @returns {string}     e.g. "09:30"
 */
const toTimeString = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Return the current time as minutes since midnight (local server time).
 * Override in tests by injecting `nowMinutes` into generateSlots().
 *
 * @returns {number}
 */
const nowInMinutes = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

// ── Overlap detection ─────────────────────────────────────────

/**
 * Test whether two [start, end) intervals overlap.
 * Uses half-open intervals so back-to-back slots don't count as overlapping.
 *
 * @param {number} aStart
 * @param {number} aEnd
 * @param {number} bStart
 * @param {number} bEnd
 * @returns {boolean}
 */
const overlaps = (aStart, aEnd, bStart, bEnd) =>
  aStart < bEnd && aEnd > bStart;

/**
 * Check whether a proposed slot [slotStart, slotEnd) collides with
 * any booking in the bookedIntervals array.
 *
 * @param {number}   slotStart
 * @param {number}   slotEnd
 * @param {Array<{start:number, end:number}>} bookedIntervals
 * @returns {boolean}
 */
const isBooked = (slotStart, slotEnd, bookedIntervals) =>
  bookedIntervals.some(({ start, end }) =>
    overlaps(slotStart, slotEnd, start, end)
  );

// ── Core slot generator ───────────────────────────────────────

/**
 * Generate all bookable slots within a single availability window,
 * filtering out any that overlap with existing bookings.
 *
 * @param {object}  window
 * @param {string}  window.start_time         - "HH:MM"
 * @param {string}  window.end_time           - "HH:MM"
 * @param {string}  window.date               - "YYYY-MM-DD"
 * @param {string}  window.availability_id    - UUID
 *
 * @param {object}  options
 * @param {number}  options.durationMinutes   - service duration (required)
 * @param {number}  [options.bufferMinutes=0] - gap between consecutive slots
 * @param {Array}   [options.bookedIntervals] - [{start, end}] in minutes
 * @param {boolean} [options.isToday=false]   - true → skip slots starting in the past
 * @param {number}  [options.nowMinutes]      - override for testing
 * @param {number}  [options.leadTimeMinutes=0] - min minutes from now before a slot can start
 *
 * @returns {Array<{
 *   availability_id: string,
 *   date:            string,
 *   start_time:      string,
 *   end_time:        string,
 *   duration_minutes:number
 * }>}
 */
const generateSlotsForWindow = (window, options = {}) => {
  const {
    durationMinutes,
    bufferMinutes    = 0,
    bookedIntervals  = [],
    isToday          = false,
    nowMinutes:  now = nowInMinutes(),
    leadTimeMinutes  = 0,
  } = options;

  if (!durationMinutes || durationMinutes <= 0) {
    throw new Error('durationMinutes must be a positive integer.');
  }

  const windowStart = toMinutes(window.start_time);
  const windowEnd   = toMinutes(window.end_time);
  const step        = durationMinutes + bufferMinutes;

  // Minimum start time when booking on the current day
  const earliestStart = isToday ? now + leadTimeMinutes : -Infinity;

  const slots = [];

  for (let start = windowStart; start + durationMinutes <= windowEnd; start += step) {
    const end = start + durationMinutes;

    // Skip past/too-soon slots when booking for today
    if (start < earliestStart) continue;

    // Skip slots that collide with confirmed bookings
    if (isBooked(start, end, bookedIntervals)) continue;

    slots.push({
      availability_id:  window.availability_id,
      date:             window.date,
      start_time:       toTimeString(start),
      end_time:         toTimeString(end),
      duration_minutes: durationMinutes,
    });
  }

  return slots;
};

// ── Multi-window aggregator ───────────────────────────────────

/**
 * Aggregate slots across multiple availability windows for a given
 * service + date combination.
 *
 * @param {Array}   windows          - rows from `availability` table
 * @param {Array}   bookedIntervals  - [{start:number, end:number}]
 * @param {object}  serviceOpts
 * @param {number}  serviceOpts.durationMinutes
 * @param {number}  [serviceOpts.bufferMinutes=0]
 * @param {number}  [serviceOpts.leadTimeMinutes=0]
 * @param {string}  targetDate        - "YYYY-MM-DD"
 *
 * @returns {object}  { date, totalSlots, windows: [...], slots: [...] }
 */
const generateSlotsForDate = (windows, bookedIntervals, serviceOpts, targetDate) => {
  const today     = new Date().toISOString().slice(0, 10);
  const isToday   = targetDate === today;
  const now       = nowInMinutes();

  const allSlots    = [];
  const windowsMeta = [];

  for (const window of windows) {
    const windowSlots = generateSlotsForWindow(
      {
        start_time:      window.start_time,
        end_time:        window.end_time,
        date:            targetDate,
        availability_id: window.id,
      },
      {
        ...serviceOpts,
        bookedIntervals,
        isToday,
        nowMinutes: now,
      }
    );

    windowsMeta.push({
      availability_id:  window.id,
      start_time:       window.start_time,
      end_time:         window.end_time,
      slot_count:       windowSlots.length,
    });

    allSlots.push(...windowSlots);
  }

  return {
    date:        targetDate,
    total_slots: allSlots.length,
    windows:     windowsMeta,
    slots:       allSlots,
  };
};

// ── Date range helper ─────────────────────────────────────────

/**
 * Return an array of "YYYY-MM-DD" date strings for every calendar
 * day between startDate and endDate (inclusive).
 *
 * @param {string} startDate  "YYYY-MM-DD"
 * @param {string} endDate    "YYYY-MM-DD"
 * @returns {string[]}
 */
const getDateRange = (startDate, endDate) => {
  const dates = [];
  const cursor = new Date(`${startDate}T00:00:00Z`);
  const end    = new Date(`${endDate}T00:00:00Z`);

  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
};

// ── Booking interval converter ────────────────────────────────

/**
 * Convert raw booking rows (with time strings) into the minute-based
 * interval objects expected by generateSlotsForWindow.
 *
 * @param {Array<{start_time:string, end_time:string}>} bookingRows
 * @returns {Array<{start:number, end:number}>}
 */
const toBookedIntervals = (bookingRows) =>
  bookingRows.map(({ start_time, end_time }) => ({
    start: toMinutes(start_time),
    end:   toMinutes(end_time),
  }));

// ── Exports ───────────────────────────────────────────────────
module.exports = {
  // Core
  generateSlotsForWindow,
  generateSlotsForDate,
  // Helpers (also exported for unit testing)
  toMinutes,
  toTimeString,
  overlaps,
  isBooked,
  getDateRange,
  toBookedIntervals,
};
