'use strict';

/**
 * Unified authentication & authorization middleware.
 * Consolidates: adminAuth.js (admin-api, booking, payments, availability, services),
 *               auth.js (core, google-calendar, slot-recommender),
 *               authMiddleware.js (auth module).
 */

const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Verify Bearer JWT and attach req.user.
 * Returns 401 on missing or invalid token.
 */
const authenticate = (req, res, next) => {
  const header = req.headers['authorization'];
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  try {
    req.user = jwt.verify(header.split(' ')[1], env.jwt.secret, { algorithms: ['HS256'] });
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Session expired.' : 'Invalid token.';
    return res.status(401).json({ success: false, message: msg });
  }
};

/**
 * Attempt to decode Bearer JWT but do NOT block unauthenticated requests.
 * Useful for routes that personalise results when a user is logged in.
 */
const optionalAuth = (req, res, next) => {
  const header = req.headers['authorization'];
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.split(' ')[1], env.jwt.secret, { algorithms: ['HS256'] });
    } catch (_) {
      // invalid token — treat as unauthenticated
    }
  }
  next();
};

/**
 * Role-based authorization factory.
 * Call after authenticate.
 * Example: authorize('admin', 'staff')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({
      success: false,
      message: `Forbidden. Required role: ${roles.join(' or ')}.`,
    });
  }
  next();
};

/** Shorthand: authenticate + require admin role. Spread into route: ...requireAdmin */
const requireAdmin = [authenticate, authorize('admin')];

/**
 * Validate common date range query params (from, to).
 * Returns 422 if either date is in an invalid format or from > to.
 */
const validateDateRange = (req, res, next) => {
  const { from, to } = req.query;
  const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

  if (from && !ISO_DATE.test(from)) {
    return res.status(422).json({ success: false, message: 'from must be a valid date in YYYY-MM-DD format.' });
  }
  if (to && !ISO_DATE.test(to)) {
    return res.status(422).json({ success: false, message: 'to must be a valid date in YYYY-MM-DD format.' });
  }
  if (from && to && from > to) {
    return res.status(422).json({ success: false, message: 'from must not be after to.' });
  }
  next();
};

/**
 * Validate UUID path params.
 * Usage: router.get('/:id', validateUuidParam('id'), handler)
 */
const validateUuidParam = (paramName) => (req, res, next) => {
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(req.params[paramName])) {
    return res.status(422).json({ success: false, message: `${paramName} must be a valid UUID.` });
  }
  next();
};

module.exports = { authenticate, optionalAuth, authorize, requireAdmin, validateDateRange, validateUuidParam };
