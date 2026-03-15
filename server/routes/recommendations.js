'use strict';

const router = require('express').Router();
const { getRecommendations } = require('../controllers/recommendationController');
const { optionalAuth } = require('../middleware/auth');

// Optional auth — authenticated users get personalised scores
router.get('/recommended-slots', optionalAuth, getRecommendations);

module.exports = router;
