const { query } = require('../config/database');

/**
 * Columns projected in every public-facing response.
 * is_active, created_by, updated_by are internal — excluded from public reads.
 */
const PUBLIC_COLS = `
  id,
  name,
  description,
  duration_minutes,
  price,
  category,
  is_active,
  created_at,
  updated_at
`.trim();

const ServiceModel = {

  // ── Reads ──────────────────────────────────────────────────

  /**
   * List all active services.
   * Supports optional pagination and a name search filter.
   *
   * @param {object} opts
   * @param {number}  opts.limit   - page size          (default 50)
   * @param {number}  opts.offset  - rows to skip        (default 0)
   * @param {string}  opts.search  - partial name match  (optional)
   * @returns {Promise<{rows: object[], total: number}>}
   */
  async findAll({ limit = 50, offset = 0, search } = {}) {
    const conditions = ['is_active = TRUE'];
    const values = [];

    if (search) {
      values.push(`%${search.toLowerCase()}%`);
      conditions.push(`LOWER(name) LIKE $${values.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    // Run count + data queries in parallel
    const [countResult, dataResult] = await Promise.all([
      query(`SELECT COUNT(*) AS total FROM services ${where}`, values),
      query(
        `SELECT ${PUBLIC_COLS}
         FROM   services
         ${where}
         ORDER  BY name ASC
         LIMIT  $${values.length + 1}
         OFFSET $${values.length + 2}`,
        [...values, limit, offset]
      ),
    ]);

    return {
      rows:  dataResult.rows,
      total: parseInt(countResult.rows[0].total, 10),
    };
  },

  /**
   * Find a single active service by UUID.
   * Returns null if not found or soft-deleted.
   */
  async findById(id) {
    const { rows } = await query(
      `SELECT ${PUBLIC_COLS} FROM services WHERE id = $1 AND is_active = TRUE`,
      [id]
    );
    return rows[0] ?? null;
  },

  /**
   * Check whether a service with the given name already exists (case-insensitive).
   * Optionally exclude a specific ID to allow same-name updates.
   */
  async nameExists(name, excludeId = null) {
    const { rows } = await query(
      `SELECT 1 FROM services
       WHERE LOWER(name) = LOWER($1)
         AND is_active = TRUE
         ${excludeId ? 'AND id <> $2' : ''}
       LIMIT 1`,
      excludeId ? [name, excludeId] : [name]
    );
    return rows.length > 0;
  },

  // ── Writes ─────────────────────────────────────────────────

  /**
   * Create a new service.
   *
   * @param {object} data
   * @param {string}  data.name
   * @param {string}  [data.description]
   * @param {number}  data.duration_minutes
   * @param {number}  data.price
   * @param {string}  [data.createdBy] - admin user UUID
   * @returns {Promise<object>} The created service row
   */
  async create({ name, description, duration_minutes, price, category, createdBy }) {
    const { rows } = await query(
      `INSERT INTO services (name, description, duration_minutes, price, category, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${PUBLIC_COLS}`,
      [name, description ?? null, duration_minutes, price, category || '', createdBy ?? null]
    );
    return rows[0];
  },

  /**
   * Update an existing service's fields.
   * Only the supplied fields are changed (COALESCE pattern).
   *
   * @param {string} id
   * @param {object} data         - partial fields to update
   * @param {string} [updatedBy]  - admin user UUID
   * @returns {Promise<object|null>}
   */
  async update(id, { name, description, duration_minutes, price, category }) {
    const { rows } = await query(
      `UPDATE services
       SET  name             = COALESCE($2, name),
            description      = COALESCE($3, description),
            duration_minutes = COALESCE($4, duration_minutes),
            price            = COALESCE($5, price),
            category         = COALESCE($6, category)
       WHERE id = $1 AND is_active = TRUE
       RETURNING ${PUBLIC_COLS}`,
      [id, name ?? null, description ?? null, duration_minutes ?? null, price ?? null, category ?? null]
    );
    return rows[0] ?? null;
  },

  /**
   * Soft-delete a service by setting is_active = FALSE.
   * The row is preserved for historical booking records.
   *
   * @param {string} id
   * @param {string} [deletedBy] - admin user UUID
   * @returns {Promise<object|null>} The deleted row or null if not found
   */
  async softDelete(id) {
    const { rows } = await query(
      `UPDATE services
       SET  is_active = FALSE
       WHERE id = $1 AND is_active = TRUE
       RETURNING ${PUBLIC_COLS}`,
      [id]
    );
    return rows[0] ?? null;
  },
};

module.exports = ServiceModel;
