'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const logger   = require('./logger');

// Check if using SQLite for instant fix
if (process.env.DB_TYPE === 'sqlite') {
  logger.info('Using SQLite database (instant fix)');
  module.exports = require('./sqlite-db');
} else {
  // Original PostgreSQL configuration
  const { Pool, types } = require('pg');

  // Parse DATE (OID 1082) and TIMESTAMP (1114) as plain strings to avoid
  // timezone-shift issues (e.g. 2026-03-18 becoming Mar 19 in IST).
  types.setTypeParser(1082, (val) => val);  // DATE → 'YYYY-MM-DD'
  types.setTypeParser(1114, (val) => val);  // TIMESTAMP → string
  
  // ── Pool configuration ───────────────────────────────────────
  // DATABASE_URL (Supabase / Render / Heroku) takes priority over individual
  // DB_* vars, which are used for local development.
  const isLocalhost = process.env.DATABASE_URL?.includes('localhost') || process.env.DATABASE_URL?.includes('127.0.0.1');
  const poolConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        // Only enable SSL for remote/cloud databases, not localhost
        ssl: isLocalhost ? false : { rejectUnauthorized: false },
        application_name: 'saas-booking-platform',
        connectionTimeoutMillis: isLocalhost ? 5_000 : 10_000,
      }
    : {
        host:     process.env.DB_HOST     || 'localhost',
        port:     parseInt(process.env.DB_PORT  || '5432', 10),
        database: process.env.DB_NAME     || 'saas_booking',
        user:     process.env.DB_USER     || 'postgres',
        password: process.env.DB_PASSWORD,
        // Local development typically doesn't need SSL
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        application_name: 'saas-booking-platform',
        connectionTimeoutMillis: 5_000,
      };

  logger.info('Initializing PostgreSQL pool', {
    host: poolConfig.host || 'DATABASE_URL',
    port: poolConfig.port || 'default',
    database: poolConfig.database || 'from connection string',
    user: poolConfig.user || 'from connection string',
  });

  const pool = new Pool({
    ...poolConfig,
    min:                         1,
    max:                        10,
    idleTimeoutMillis:      30_000,
    connectionTimeoutMillis: poolConfig.connectionTimeoutMillis || 5_000,
    keepAlive:                true,
    keepAliveInitialDelayMillis: 10_000,
});

// ── Pool lifecycle events ────────────────────────────────────
pool.on('connect', (client) => {
  logger.debug('Database pool: new client connected', {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  });
});

pool.on('remove', (client) => {
  logger.debug('Database pool: client removed', {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  });
});

pool.on('error', (err) => {
  // Enhanced error handling for Supabase
  const isSupabase = process.env.DATABASE_URL?.includes('supabase');
  const errorContext = {
    message: err.message,
    code: err.code,
    isSupabase,
  };
  logger.error('Database pool error', errorContext);
});

// Bind methods so destructuring works: const { query, getClient } = require('../config/database')
pool.query = pool.query.bind(pool);
pool.getClient = () => pool.connect();

module.exports = pool;

} // End of SQLite check
