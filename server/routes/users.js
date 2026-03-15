'use strict';

const router = require('express').Router();
const { body, param, query, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const UserModel = require('../models/userModel');

// ── Shared helpers ────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors:  errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const uuidParam = (name) =>
  param(name).matches(UUID_RE).withMessage(`${name} must be a valid UUID.`);

// ── Route validation rule sets ────────────────────────────────

const ALLOWED_ROLES = ['user', 'admin'];

const patchUserRules = [
  uuidParam('id'),
  body('name')
    .optional()
    .isString().withMessage('name must be a string.')
    .trim()
    .notEmpty().withMessage('name cannot be blank.')
    .isLength({ max: 100 }).withMessage('name must be 100 characters or fewer.'),
  body('role')
    .optional()
    .isIn(ALLOWED_ROLES).withMessage(`role must be one of: ${ALLOWED_ROLES.join(', ')}.`),
  validate,
];

const listUsersRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer.').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1–100.').toInt(),
  validate,
];

// ── Routes ────────────────────────────────────────────────────

router.get('/', authenticate, authorize('admin'), listUsersRules, async (req, res, next) => {
  try {
    const page   = Math.max(1, req.query.page  || 1);
    const limit  = Math.min(100, req.query.limit || 20);
    const offset = (page - 1) * limit;

    const users = await UserModel.findAll({ limit, offset });
    res.json({ success: true, data: users, meta: { page, limit } });
  } catch (err) { next(err); }
});

router.get('/:id', authenticate, [uuidParam('id'), validate], async (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    const user = await UserModel.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

router.patch('/:id', authenticate, patchUserRules, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role } = req.body;
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    const updateRole = req.user.role === 'admin' ? role : undefined;
    const user = await UserModel.update(id, { name, role: updateRole });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, authorize('admin'), [uuidParam('id'), validate], async (req, res, next) => {
  try {
    const user = await UserModel.deactivate(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, message: 'User deactivated.', data: user });
  } catch (err) { next(err); }
});

module.exports = router;
