// Simple environment test
require('dotenv').config();

console.log('🔧 Testing Environment Variables');
console.log('==================================');

console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ SET' : '❌ MISSING');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ SET' : '❌ MISSING');
console.log('JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? '✅ SET' : '❌ MISSING');
console.log('PORT:', process.env.PORT ? '✅ SET' : '❌ MISSING');
console.log('NODE_ENV:', process.env.NODE_ENV ? '✅ SET' : '❌ MISSING');
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN ? '✅ SET' : '❌ MISSING');

if (process.env.DATABASE_URL) {
  console.log('\n🔗 Testing Database Connection...');
  const { Pool } = require('pg');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });
  
  pool.query('SELECT NOW() as current_time')
    .then(result => {
      console.log('✅ Database connected successfully!');
      console.log('   Time:', result.rows[0].current_time);
      pool.end();
    })
    .catch(error => {
      console.log('❌ Database connection failed:', error.message);
    });
} else {
  console.log('\n❌ DATABASE_URL not found - cannot test database connection');
}
