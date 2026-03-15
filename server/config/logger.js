'use strict';

/**
 * logger.js — Application-wide Winston logger
 *
 * Behaviour:
 *  - Development  : colourised single-line output to console
 *  - Production   : structured JSON to console + rotating log files
 *  - Log files    : written to  server/logs/  (auto-created)
 *    • error-YYYY-MM-DD.log  — error level only, 30-day retention
 *    • combined-YYYY-MM-DD.log — all levels, 14-day retention
 *
 * Morgan HTTP log stream:
 *   logger.stream.write is exposed so that morgan can pipe HTTP
 *   access logs through Winston instead of directly to stdout.
 */

const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path            = require('path');

const isProduction = process.env.NODE_ENV === 'production';
const logLevel     = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');
const logsDir      = path.join(__dirname, '../logs');

// ── Shared formats ────────────────────────────────────────────

const baseFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  format.errors({ stack: true }),   // include err.stack on Error objects
);

const jsonFormat = format.combine(
  baseFormat,
  format.json(),
);

const devConsoleFormat = format.combine(
  baseFormat,
  format.colorize({ all: true }),
  format.printf(({ timestamp, level, message, requestId, stack, ...meta }) => {
    const rid   = requestId ? ` [${requestId}]` : '';
    const extra = Object.keys(meta).length ? `\n  ${JSON.stringify(meta)}` : '';
    const trace = stack ? `\n${stack}` : '';
    return `${timestamp}${rid} ${level}: ${message}${extra}${trace}`;
  }),
);

// ── Transports ────────────────────────────────────────────────

const consoleTransport = new transports.Console({
  format: isProduction ? jsonFormat : devConsoleFormat,
});

const errorFileTransport = new DailyRotateFile({
  level:       'error',
  dirname:     logsDir,
  filename:    'error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles:    '30d',
  maxSize:     '20m',
  format:      jsonFormat,
  zippedArchive: true,
});

const combinedFileTransport = new DailyRotateFile({
  dirname:     logsDir,
  filename:    'combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles:    '14d',
  maxSize:     '50m',
  format:      jsonFormat,
  zippedArchive: true,
});

// Payment-specific log — only entries carrying { component: 'payment' }.
// Longer retention (90 days) to support financial audit requirements.
const paymentFileTransport = new DailyRotateFile({
  dirname:     logsDir,
  filename:    'payment-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles:    '90d',
  maxSize:     '20m',
  format: format.combine(
    format((info) => (info.component === 'payment' ? info : false))(),
    jsonFormat,
  ),
  zippedArchive: true,
});

// ── Logger instance ───────────────────────────────────────────

const logger = createLogger({
  level:       logLevel,
  defaultMeta: { service: 'saas-booking' },
  transports:  [
    consoleTransport,
    errorFileTransport,
    combinedFileTransport,
    paymentFileTransport,
  ],
  // Do not exit on uncaught exceptions inside transports
  exitOnError: false,
});

// ── Morgan stream adapter ─────────────────────────────────────

logger.stream = {
  write: (message) => logger.http(message.trimEnd()),
};

module.exports = logger;
