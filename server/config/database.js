'use strict';

/**
 * Backwards-compatibility shim.
 * Database logic now lives in config/db.js.
 * All existing imports of '../config/database' continue to work unchanged.
 */
module.exports = require('./db');
