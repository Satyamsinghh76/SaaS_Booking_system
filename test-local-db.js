// Test local PostgreSQL connection
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Satyam0408()',
  ssl: false
});

async function testConnection() {
  try {
    console.log('Testing local PostgreSQL connection...');
    const result = await pool.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ Local PostgreSQL connected successfully!');
    console.log('Time:', result.rows[0].current_time);
    console.log('Version:', result.rows[0].version.split(',')[0]);
    
    // Test if saas_booking database exists
    const dbCheck = await pool.query('SELECT 1 FROM pg_database WHERE datname = $1', ['saas_booking']);
    if (dbCheck.rows.length > 0) {
      console.log('✅ saas_booking database exists');
    } else {
      console.log('❌ saas_booking database not found');
    }
    
  } catch (error) {
    console.error('❌ Local PostgreSQL connection failed:', error.message);
  } finally {
    await pool.end();
  }
}

testConnection();
