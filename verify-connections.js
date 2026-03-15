// Complete Connection Verification Script
require('dotenv').config();

console.log('🔍 COMPLETE SYSTEM VERIFICATION');
console.log('===============================\n');

// Test 1: Environment Variables
console.log('1️⃣ ENVIRONMENT VARIABLES CHECK');
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET', 
  'JWT_REFRESH_SECRET',
  'PORT',
  'NODE_ENV',
  'CORS_ORIGIN'
];

let envScore = 0;
requiredEnvVars.forEach(variable => {
  const value = process.env[variable];
  const status = value ? '✅' : '❌';
  const display = value ? 'SET' : 'MISSING';
  console.log(`${status} ${variable}: ${display}`);
  if (value) envScore++;
});

console.log(`Environment Score: ${envScore}/${requiredEnvVars.length}\n`);

// Test 2: Database Connection
console.log('2️⃣ DATABASE CONNECTION TEST');
const { Pool } = require('pg');

async function testDatabase() {
  try {
    // Test with DATABASE_URL first
    if (process.env.DATABASE_URL) {
      console.log('🔗 Testing Supabase connection...');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
      });
      
      const result = await pool.query('SELECT NOW() as current_time');
      console.log('✅ Supabase connected successfully!');
      console.log(`   Time: ${result.rows[0].current_time}`);
      await pool.end();
      return true;
    } else {
      console.log('❌ DATABASE_URL not configured');
      return false;
    }
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    
    // Try local PostgreSQL fallback
    console.log('🔄 Trying local PostgreSQL...');
    try {
      const localPool = new Pool({
        host: 'localhost',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: 'Satyam0408()',
        ssl: false,
        connectionTimeoutMillis: 3000
      });
      
      const result = await localPool.query('SELECT NOW() as current_time');
      console.log('✅ Local PostgreSQL connected!');
      console.log(`   Time: ${result.rows[0].current_time}`);
      await localPool.end();
      return true;
    } catch (localError) {
      console.log('❌ Local PostgreSQL also failed:', localError.message);
      return false;
    }
  }
}

// Test 3: Module Loading
console.log('\n3️⃣ MODULE LOADING TEST');
const criticalModules = [
  'express',
  'pg', 
  'jsonwebtoken',
  'bcryptjs',
  'helmet',
  'cors',
  'morgan',
  'twilio',
  'nodemailer',
  'googleapis',
  'stripe'
];

let moduleScore = 0;
criticalModules.forEach(module => {
  try {
    require.resolve(module);
    console.log(`✅ ${module}`);
    moduleScore++;
  } catch (error) {
    console.log(`❌ ${module}: Not installed`);
  }
});

console.log(`Module Score: ${moduleScore}/${criticalModules.length}\n`);

// Test 4: Server Startup Test
console.log('4️⃣ SERVER STARTUP TEST');
console.log('Starting server in test mode...');

// Mock database for server startup test
const originalPool = require('pg').Pool;
let serverStarted = false;

require('pg').Pool = class TestPool extends originalPool {
  constructor(config) {
    console.log('🔧 Using test database pool for server startup');
    return {
      query: async (text, params) => {
        if (text.includes('NOW()')) {
          return { rows: [{ now: new Date().toISOString() }] };
        }
        return { rows: [] };
      },
      end: async () => {},
      connect: async () => ({ query: async () => ({ rows: [] }), release: async () => {} })
    };
  }
};

// Start server with timeout
const serverTimeout = setTimeout(() => {
  if (!serverStarted) {
    console.log('❌ Server startup timeout (10 seconds)');
    process.exit(1);
  }
}, 10000);

// Override console.log to capture server startup
const originalConsoleLog = console.log;
console.log = (...args) => {
  const message = args.join(' ');
  if (message.includes('Server running') || message.includes('listening')) {
    serverStarted = true;
    console.log('✅ Server started successfully!');
    console.log(`   ${message}`);
    clearTimeout(serverTimeout);
    process.exit(0);
  }
  originalConsoleLog(...args);
};

// Start server
try {
  require('./server.js');
} catch (error) {
  console.log('❌ Server startup failed:', error.message);
  clearTimeout(serverTimeout);
}

// Run database test
testDatabase().then(dbConnected => {
  console.log('\n📊 VERIFICATION SUMMARY');
  console.log('====================');
  console.log(`Environment Variables: ${envScore}/${requiredEnvVars.length}`);
  console.log(`Database Connection: ${dbConnected ? '✅ Connected' : '❌ Failed'}`);
  console.log(`Module Loading: ${moduleScore}/${criticalModules.length}`);
  
  const overallScore = (envScore + (dbConnected ? 1 : 0) + moduleScore) / (requiredEnvVars.length + 1 + criticalModules.length) * 10;
  console.log(`\nOverall System Health: ${overallScore.toFixed(1)}/10`);
  
  if (overallScore >= 8) {
    console.log('🎉 EXCELLENT: System is ready for development!');
  } else if (overallScore >= 6) {
    console.log('✅ GOOD: System mostly ready with minor issues');
  } else {
    console.log('⚠️  NEEDS ATTENTION: System has issues that need fixing');
  }
  
  console.log('\n🔧 NEXT STEPS:');
  if (!dbConnected) {
    console.log('- Fix database connection (check DATABASE_URL or local PostgreSQL)');
  }
  if (envScore < requiredEnvVars.length) {
    console.log('- Complete environment variable configuration');
  }
  if (moduleScore < criticalModules.length) {
    console.log('- Install missing dependencies: npm install');
  }
  
  if (dbConnected && envScore === requiredEnvVars.length && moduleScore === criticalModules.length) {
    console.log('- Start development servers: npm run dev');
    console.log('- Test API endpoints: curl http://localhost:5000/health');
    console.log('- Access frontend: http://localhost:3002');
  }
});
