'use strict';

const router = require('express').Router();

const {
  getAvailableSlots,
  getAvailableSlotsForRange,
  getWindowsForService,
  createWindow,
  updateWindow,
  deleteWindow,
} = require('../controllers/availabilityController');

const { requireAdmin } = require('../middleware/auth');

const {
  getSlotsRules,
  getSlotsRangeRules,
  createWindowRules,
  updateWindowRules,
  idParamRules,
  serviceIdParamRules,
} = require('../middleware/validateAvailability');

// Public
router.get('/:serviceId/slots', getSlotsRules, getAvailableSlots);
router.get('/:serviceId/slots/range', getSlotsRangeRules, getAvailableSlotsForRange);

// Admin
router.get('/:serviceId', ...requireAdmin, serviceIdParamRules, getWindowsForService);
router.post('/', ...requireAdmin, createWindowRules, createWindow);
router.patch('/:id', ...requireAdmin, updateWindowRules, updateWindow);
router.delete('/:id', ...requireAdmin, idParamRules, deleteWindow);

module.exports = router;
