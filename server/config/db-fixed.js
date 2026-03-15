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
  const { Pool } = require('pg');
  
  // ── Pool configuration ───────────────────────────────────────
  // DATABASE_URL (Supabase / Render / Heroku) takes priority over individual
  // DB_* vars, which are used for local development.
  const poolConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        // Supabase requires SSL with proper certificate verification
        ssl: {
          rejectUnauthorized: false, // Required for Supabase's SSL certificates
          // For production, you might want to use: rejectUnauthorized: true
          // with proper CA certificates, but Supabase works with false
        },
        // Additional Supabase-specific settings
        application_name: 'saas-booking-platform',
        // Connection timeout for Supabase (longer for cloud connections)
        connectionTimeoutMillis: 10_000,
      }
    : {
        host:     process.env.DB_HOST     || 'localhost',
        port:     parseInt(process.env.DB_PORT  || '5432', 10),
        database: process.env.DB_NAME     || 'saas_booking',
        user:     process.env.DB_USER     || 'postgres',
        password: process.env.DB_PASSWORD || 'Satyam0408()',
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

    // Pool sizing — Optimized for Supabase connection limits
    min:                          1,  // Fewer idle connections for cloud DB
    max:                         10,  // Respect Supabase connection limits
    idleTimeoutMillis:       30_000,  // Drop idle connections after 30s
  connectionTimeoutMillis:  poolConfig.connectionTimeoutMillis || 5_000,

  // TCP keepalives prevent cloud providers from dropping idle connections
  keepAlive:                    true,
  keepAliveInitialDelayMillis: 10_000,
  
  // Supabase-specific optimizations
  statement_timeout:          30_000,  // Prevent long-running queries
  query_timeout:              30_000,  // Consistent timeout for all queries
  
  // Enable prepared statements for better performance
  preparedStatements:         true,
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

module.exports = pool;

} // End of SQLite check
