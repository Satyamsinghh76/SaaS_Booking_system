const ServiceModel = require('../models/serviceModel');

// ── Helpers ───────────────────────────────────────────────────

/**
 * Build a pagination meta object that is included in list responses.
 */
const buildPaginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1,
});

// ── Public controllers ────────────────────────────────────────

/**
 * GET /api/services
 * Returns a paginated list of all active services.
 * Accessible to anyone — no auth required.
 *
 * Query params:
 *   page    (int, default 1)
 *   limit   (int, default 20, max 100)
 *   search  (string, partial name match)
 */
const getAllServices = async (req, res, next) => {
  try {
    const page   = parseInt(req.query.page  ?? '1',  10);
    const limit  = parseInt(req.query.limit ?? '20', 10);
    const offset = (page - 1) * limit;
    const search = req.query.search?.trim();

    const { rows, total } = await ServiceModel.findAll({ limit, offset, search });

    return res.json({
      success: true,
      data: rows,
      meta: buildPaginationMeta(total, page, limit),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/services/:id
 * Returns a single active service by UUID.
 * Accessible to anyone — no auth required.
 */
const getServiceById = async (req, res, next) => {
  try {
    const service = await ServiceModel.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found.',
      });
    }

    return res.json({ success: true, data: service });
  } catch (err) {
    next(err);
  }
};

// ── Admin-only controllers ────────────────────────────────────

/**
 * POST /api/services
 * Create a new service.
 * Requires: authenticated admin.
 *
 * Body: { name, description?, duration_minutes, price }
 */
const createService = async (req, res, next) => {
  try {
    const { name, description, duration_minutes, price } = req.body;
    const adminId = req.user?.id;

    // Prevent duplicate service names
    if (await ServiceModel.nameExists(name)) {
      return res.status(409).json({
        success: false,
        message: `A service named "${name}" already exists.`,
      });
    }

    const service = await ServiceModel.create({
      name,
      description,
      duration_minutes,
      price,
      createdBy: adminId,
    });

    return res.status(201).json({
      success: true,
      message: 'Service created successfully.',
      data: service,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/services/:id
 * Partially update a service.
 * Requires: authenticated admin.
 *
 * Body: any subset of { name, description, duration_minutes, price }
 */
const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, duration_minutes, price } = req.body;
    const adminId = req.user?.id;

    // Ensure the service actually exists before any further checks
    const existing = await ServiceModel.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    // If the name is changing, check for collisions with other records
    if (name && name !== existing.name && (await ServiceModel.nameExists(name, id))) {
      return res.status(409).json({
        success: false,
        message: `A service named "${name}" already exists.`,
      });
    }

    const updated = await ServiceModel.update(
      id,
      { name, description, duration_minutes, price },
      adminId
    );

    return res.json({
      success: true,
      message: 'Service updated successfully.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/services/:id
 * Soft-delete a service (sets is_active = FALSE).
 * The row is kept so that existing booking records remain valid.
 * Requires: authenticated admin.
 */
const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;

    const deleted = await ServiceModel.softDelete(id, adminId);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    return res.json({
      success: true,
      message: 'Service deleted successfully.',
      data: deleted,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
};
