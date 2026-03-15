'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * Attach a correlation ID to every request so logs for the same
 * request can be linked across services and log files.
 *
 * Priority:
 *   1. X-Request-Id header sent by an upstream gateway/CDN
 *   2. Generated UUID v4
 *
 * The ID is available as req.id and echoed back in the response
 * header X-Request-Id so clients can include it in bug reports.
 */
const requestId = (req, res, next) => {
  const id = req.headers['x-request-id'] || uuidv4();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
};

module.exports = requestId;
