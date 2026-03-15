// Database Connection Fix Script
require('dotenv').config();

console.log('🔧 DATABASE CONNECTION FIX');
console.log('========================\n');

// Test different Supabase connection formats
const connectionFormats = [
  {
    name: 'Direct Connection (Port 5432)',
    url: 'postgresql://postgres:JaiShreeRam@dofqdvocepggeifwhhal.supabase.co:5432/postgres'
  },
  {
    name: 'Session Pooler (Port 6543)',
    url: 'postgresql://postgres:JaiShreeRam@dofqdvocepggeifwhhal.supabase.co:6543/postgres?sslmode=require'
  },
  {
    name: 'Connection Pooler (Port 5432)',
    url: 'postgresql://postgres:JaiShreeRam@dofqdvocepggeifwhhal.supabase.co:5432/postgres?pgbouncer=true&sslmode=require'
  },
  {
    name: 'Direct with SSL',
    url: 'postgresql://postgres:JaiShreeRam@dofqdvocepggeifwhhal.supabase.co:5432/postgres?sslmode=verify-full'
  }
];

const { Pool } = require('pg');

async function testConnection(format) {
  console.log(`\n🔗 Testing: ${format.name}`);
  console.log(`   URL: ${format.url}`);
  
  try {
    const pool = new Pool({
      connectionString: format.url,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });
    
    const result = await pool.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ SUCCESS!');
    console.log(`   Time: ${result.rows[0].current_time}`);
    console.log(`   Version: ${result.rows[0].version.split(',')[0]}`);
    
    await pool.end();
    return format.url;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    return null;
  }
}

async function fixConnection() {
  console.log('Testing different connection formats...\n');
  
  for (const format of connectionFormats) {
    const workingUrl = await testConnection(format);
    if (workingUrl) {
      console.log('\n🎉 FOUND WORKING CONNECTION!');
      console.log(`Working URL: ${workingUrl}`);
      
      // Update .env file with working connection
      const fs = require('fs');
      const path = require('path');
      
      // Read current .env
      const envPath = path.join(__dirname, 'server', '.env');
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Replace DATABASE_URL line
      envContent = envContent.replace(/DATABASE_URL=.*/g, `DATABASE_URL=${workingUrl}`);
      
      // Write back to .env
      fs.writeFileSync(envPath, envContent);
      
      console.log('✅ Updated .env file with working connection');
      console.log('\n🚀 You can now start your server: npm run dev');
      return;
    }
  }
  
  console.log('\n❌ No Supabase connection worked. Trying local PostgreSQL...');
  
  // Test local PostgreSQL
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
    console.log('✅ Local PostgreSQL works!');
    console.log(`   Time: ${result.rows[0].current_time}`);
    
    await localPool.end();
    
    // Create local database config
    const localEnv = `
# Server Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3002

# Logging
LOG_LEVEL=debug

# Local PostgreSQL Connection
DB_HOST=localhost
DB_PORT=5432
DB_NAME=saas_booking
DB_USER=postgres
DB_PASSWORD=Satyam0408()

# JWT Secrets
JWT_SECRET=9c5bebcb23f1b7ec8dc95c9e8b1220671a0ae4b66fa3fdd86eab943396622ddd
JWT_REFRESH_SECRET=bfdb39b406f854ffd285fc73864654d253cb83be659fc878311ee21f522a61a3
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=mosaeee275@gmail.com
SMTP_PASS=lxpgkkedpfwrirkl
EMAIL_FROM=BookFlow <mosaeee275@gmail.com>

# Google Calendar
GOOGLE_CLIENT_ID=643350733295-vv5dd93lmnqhj9d0kcb89h45jlkv1vkb.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/oauth/callback
GOOGLE_CALENDAR_ID=primary
TOKEN_ENCRYPTION_KEY=54ac35d102fa79ae33d7868d8d3a8aa629a8da0b94bfca05e78bcb9cea752c86

# Twilio SMS
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
`;
    
    fs.writeFileSync(path.join(__dirname, 'server', '.env'), localEnv);
    console.log('✅ Created local PostgreSQL configuration');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Install PostgreSQL locally');
    console.log('2. Create database: CREATE DATABASE saas_booking;');
    console.log('3. Apply schema: psql -d saas_booking -f fixed_supabase_schema.sql');
    console.log('4. Start server: npm run dev');
    
  } catch (localError) {
    console.log('❌ Local PostgreSQL also failed:', localError.message);
    console.log('\n📋 SOLUTION OPTIONS:');
    console.log('1. Install PostgreSQL locally');
    console.log('2. Check your Supabase project settings');
    console.log('3. Verify your Supabase credentials');
    console.log('4. Check network connectivity');
  }
}

fixConnection().catch(console.error);
