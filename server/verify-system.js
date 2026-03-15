// Complete System Verification Script (run from server directory)
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
    return false;
  }
}

// Test 3: Module Loading
console.log('3️⃣ MODULE LOADING TEST');
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

// Test 4: Configuration Files
console.log('4️⃣ CONFIGURATION FILES TEST');
const fs = require('fs');
const configFiles = [
  'server.js',
  'config/db.js',
  'config/env.js',
  'config/logger.js',
  '.env'
];

let configScore = 0;
configFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (exists) configScore++;
});

console.log(`Config Score: ${configScore}/${configFiles.length}\n`);

// Test 5: API Routes Check
console.log('5️⃣ API ROUTES TEST');
const routeFiles = [
  'routes/auth.js',
  'routes/bookings.js',
  'routes/services.js',
  'routes/payments.js',
  'routes/calendar.js',
  'routes/sms.js',
  'routes/admin.js'
];

let routeScore = 0;
routeFiles.forEach(route => {
  const exists = fs.existsSync(route);
  console.log(`${exists ? '✅' : '❌'} ${route}`);
  if (exists) routeScore++;
});

console.log(`Routes Score: ${routeScore}/${routeFiles.length}\n`);

// Run all tests and provide summary
async function runAllTests() {
  const dbConnected = await testDatabase();
  
  console.log('📊 VERIFICATION SUMMARY');
  console.log('====================');
  console.log(`Environment Variables: ${envScore}/${requiredEnvVars.length}`);
  console.log(`Database Connection: ${dbConnected ? '✅ Connected' : '❌ Failed'}`);
  console.log(`Module Loading: ${moduleScore}/${criticalModules.length}`);
  console.log(`Configuration Files: ${configScore}/${configFiles.length}`);
  console.log(`API Routes: ${routeScore}/${routeFiles.length}`);
  
  const totalScore = (envScore + (dbConnected ? 1 : 0) + moduleScore + configScore + routeScore) / 
                     (requiredEnvVars.length + 1 + criticalModules.length + configFiles.length + routeFiles.length) * 10;
  
  console.log(`\n🎯 Overall System Health: ${totalScore.toFixed(1)}/10`);
  
  if (totalScore >= 9) {
    console.log('🎉 EXCELLENT: System is ready for production!');
  } else if (totalScore >= 7) {
    console.log('✅ GOOD: System is mostly ready with minor issues');
  } else if (totalScore >= 5) {
    console.log('⚠️  FAIR: System needs some fixes before production');
  } else {
    console.log('❌ POOR: System requires significant work');
  }
  
  console.log('\n🔧 SPECIFIC ISSUES FOUND:');
  
  if (envScore < requiredEnvVars.length) {
    console.log('❌ Missing environment variables');
    console.log('   Fix: Copy server/.env.example to server/.env and fill values');
  }
  
  if (!dbConnected) {
    console.log('❌ Database connection failed');
    console.log('   Fix: Check DATABASE_URL or set up local PostgreSQL');
  }
  
  if (moduleScore < criticalModules.length) {
    console.log('❌ Missing dependencies');
    console.log('   Fix: Run npm install in server directory');
  }
  
  if (configScore < configFiles.length) {
    console.log('❌ Missing configuration files');
    console.log('   Fix: Ensure all config files exist');
  }
  
  console.log('\n🚀 NEXT STEPS:');
  
  if (totalScore >= 8) {
    console.log('✅ Start development servers:');
    console.log('   npm run dev (from project root)');
    console.log('   Or individually:');
    console.log('   npm run server (backend)');
    console.log('   npm run client (frontend)');
    console.log('\n✅ Test endpoints:');
    console.log('   curl http://localhost:5000/health');
    console.log('   curl http://localhost:5000/ready');
    console.log('\n✅ Access application:');
    console.log('   Frontend: http://localhost:3002');
    console.log('   Backend API: http://localhost:5000');
  } else {
    console.log('❌ Fix the issues above before starting servers');
  }
}

runAllTests().catch(console.error);
