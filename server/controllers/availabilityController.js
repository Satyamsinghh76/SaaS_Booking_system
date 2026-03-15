const AvailabilityModel = require('../models/availabilityModel');
const {
  generateSlotsForDate,
  getDateRange,
  toBookedIntervals,
} = require('../utils/slotGenerator');

// ── Helpers ───────────────────────────────────────────────────

/**
 * Group an array of rows by a string key.
 * e.g. groupBy(rows, 'date') → Map<"2024-06-01", [row, row]>
 */
const groupBy = (arr, key) =>
  arr.reduce((map, item) => {
    const k = item[key];
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(item);
    return map;
  }, new Map());

// ── Public controllers ─────────────────────────────────────────

/**
 * GET /api/availability/:serviceId/slots?date=YYYY-MM-DD
 *
 * Returns all bookable time slots for a service on a given date.
 * Slots already covered by confirmed bookings are excluded automatically.
 *
 * Optional query params:
 *   buffer_minutes   (int, default 0)   — gap between consecutive slots
 *   lead_time_minutes(int, default 15)  — how far in advance a slot can be booked
 */
const getAvailableSlots = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const { date, buffer_minutes, lead_time_minutes } = req.query;

    // ── Resolve service ──────────────────────────────────────
    const service = await AvailabilityModel.findServiceById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found.',
      });
    }

    // ── Fetch data in parallel ───────────────────────────────
    const [windows, bookings] = await Promise.all([
      AvailabilityModel.findWindowsByServiceAndDate(serviceId, date),
      AvailabilityModel.findConfirmedBookings(serviceId, date),
    ]);

    if (windows.length === 0) {
      return res.json({
        success: true,
        data: {
          service:     { id: service.id, name: service.name },
          date,
          total_slots: 0,
          windows:     [],
          slots:       [],
          message:     'No availability defined for this date.',
        },
      });
    }

    // ── Generate slots ───────────────────────────────────────
    const result = generateSlotsForDate(
      windows,
      toBookedIntervals(bookings),
      {
        durationMinutes:  service.duration_minutes,
        bufferMinutes:    parseInt(buffer_minutes   ?? '0',  10),
        leadTimeMinutes:  parseInt(lead_time_minutes ?? '15', 10),
      },
      date
    );

    return res.json({
      success: true,
      data: {
        service: { id: service.id, name: service.name, duration_minutes: service.duration_minutes },
        ...result,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/availability/:serviceId/slots/range
 *     ?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 *
 * Returns available slots across a date range (max 30 days).
 * Each date in the response will have its own slot list.
 * Dates with no availability windows are omitted entirely.
 */
const getAvailableSlotsForRange = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const { start_date, end_date, buffer_minutes, lead_time_minutes } = req.query;

    // ── Validate range ───────────────────────────────────────
    const startD = new Date(`${start_date}T00:00:00Z`);
    const endD   = new Date(`${end_date}T00:00:00Z`);
    const dayDiff = (endD - startD) / 86_400_000;

    if (isNaN(dayDiff) || dayDiff < 0) {
      return res.status(400).json({
        success: false,
        message: 'start_date must be before or equal to end_date.',
      });
    }

    if (dayDiff > 30) {
      return res.status(400).json({
        success: false,
        message: 'Date range cannot exceed 30 days.',
      });
    }

    // ── Resolve service ──────────────────────────────────────
    const service = await AvailabilityModel.findServiceById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    // ── Fetch data in parallel ───────────────────────────────
    const [allWindows, allBookings] = await Promise.all([
      AvailabilityModel.findWindowsByServiceAndDateRange(serviceId, start_date, end_date),
      AvailabilityModel.findConfirmedBookingsForRange(serviceId, start_date, end_date),
    ]);

    const windowsByDate  = groupBy(allWindows,  'date');
    const bookingsByDate = groupBy(allBookings, 'date');
    const dates          = getDateRange(start_date, end_date);

    const serviceOpts = {
      durationMinutes: service.duration_minutes,
      bufferMinutes:   parseInt(buffer_minutes    ?? '0',  10),
      leadTimeMinutes: parseInt(lead_time_minutes ?? '15', 10),
    };

    // ── Generate per-date results ────────────────────────────
    const results = [];
    let totalSlots = 0;

    for (const date of dates) {
      const windows = windowsByDate.get(date) ?? [];
      if (windows.length === 0) continue; // skip days with no windows

      const bookings = bookingsByDate.get(date) ?? [];
      const result   = generateSlotsForDate(
        windows,
        toBookedIntervals(bookings),
        serviceOpts,
        date
      );

      if (result.total_slots > 0) {
        results.push(result);
        totalSlots += result.total_slots;
      }
    }

    return res.json({
      success: true,
      data: {
        service:     { id: service.id, name: service.name, duration_minutes: service.duration_minutes },
        start_date,
        end_date,
        total_slots: totalSlots,
        dates:       results,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Admin controllers ──────────────────────────────────────────

/**
 * GET /api/availability/:serviceId
 * List all availability windows for a service (admin view).
 */
const getWindowsForService = async (req, res, next) => {
  try {
    const { serviceId } = req.params;

    const service = await AvailabilityModel.findServiceById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    const windows = await AvailabilityModel.findAllWindowsForService(serviceId);

    return res.json({
      success: true,
      data: { service, windows },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/availability
 * Create a new availability window.
 * Body: { service_id, date, start_time, end_time }
 */
const createWindow = async (req, res, next) => {
  try {
    const { service_id, date, start_time, end_time } = req.body;
    const adminId = req.user?.id;

    const service = await AvailabilityModel.findServiceById(service_id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    const window = await AvailabilityModel.createWindow({
      serviceId: service_id,
      date,
      startTime: start_time,
      endTime:   end_time,
      createdBy: adminId,
    });

    return res.status(201).json({
      success: true,
      message: 'Availability window created.',
      data: window,
    });
  } catch (err) {
    // DB overlap exclusion constraint
    if (err.code === '23P01') {
      return res.status(409).json({
        success: false,
        message: 'This window overlaps with an existing availability window.',
      });
    }
    next(err);
  }
};

/**
 * PATCH /api/availability/:id
 * Update a window's date/times.
 */
const updateWindow = async (req, res, next) => {
  try {
    const { date, start_time, end_time } = req.body;

    const updated = await AvailabilityModel.updateWindow(req.params.id, {
      date,
      startTime: start_time,
      endTime:   end_time,
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Availability window not found.' });
    }

    return res.json({ success: true, message: 'Window updated.', data: updated });
  } catch (err) {
    if (err.code === '23P01') {
      return res.status(409).json({
        success: false,
        message: 'The new times overlap with an existing availability window.',
      });
    }
    next(err);
  }
};

/**
 * DELETE /api/availability/:id
 * Remove an availability window.
 */
const deleteWindow = async (req, res, next) => {
  try {
    const deleted = await AvailabilityModel.deleteWindow(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Availability window not found.' });
    }
    return res.json({ success: true, message: 'Window deleted.', data: deleted });
  } catch (err) {
    // FK violation — bookings reference this window
    if (err.code === '23503') {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete window: confirmed bookings exist within it.',
      });
    }
    next(err);
  }
};

module.exports = {
  getAvailableSlots,
  getAvailableSlotsForRange,
  getWindowsForService,
  createWindow,
  updateWindow,
  deleteWindow,
};
