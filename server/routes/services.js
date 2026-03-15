'use strict';

const router = require('express').Router();

const {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} = require('../controllers/serviceController');

const { requireAdmin } = require('../middleware/auth');

const {
  createServiceRules,
  updateServiceRules,
  idParamRules,
  listQueryRules,
} = require('../middleware/validateService');

// Public
router.get('/', listQueryRules, getAllServices);
router.get('/:id', idParamRules, getServiceById);

// Admin
router.post('/', ...requireAdmin, createServiceRules, createService);
router.patch('/:id', ...requireAdmin, updateServiceRules, updateService);
router.delete('/:id', ...requireAdmin, idParamRules, deleteService);

module.exports = router;
