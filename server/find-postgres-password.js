// Find PostgreSQL Password Helper
console.log('🔍 FINDING POSTGRESQL PASSWORD');
console.log('==============================\n');

const { Pool } = require('pg');

// Common passwords to try
const commonPasswords = [
  '',           // No password
  'postgres',   // Default
  'admin',      // Common admin
  'password',   // Common password
  '123456',     // Numeric
  'root',       // Root
  'Satyam0408()', // Your current attempt
];

async function findPassword() {
  console.log('🔍 Testing common PostgreSQL passwords...\n');
  
  for (const password of commonPasswords) {
    try {
      const pool = new Pool({
        host: 'localhost',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: password,
        ssl: false,
        connectionTimeoutMillis: 2000
      });
      
      const result = await pool.query('SELECT NOW()');
      console.log(`✅ SUCCESS! Password is: "${password}"`);
      console.log(`   Time: ${result.rows[0].now}`);
      
      await pool.end();
      
      // Create working .env file
      const fs = require('fs');
      const envContent = `# Server Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3002

# Logging
LOG_LEVEL=debug

# Local PostgreSQL Connection (WORKING)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=saas_booking
DB_USER=postgres
DB_PASSWORD=${password}

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
TWILIO_PHONE_NUMBER=+1234567890`;
      
      fs.writeFileSync('.env.working', envContent);
      console.log('✅ Created .env.working with correct password');
      console.log('\n📋 NEXT STEPS:');
      console.log('1. copy .env.working .env');
      console.log('2. npm run dev');
      console.log('3. Your system will work perfectly!');
      
      return;
      
    } catch (error) {
      console.log(`❌ Password "${password}" failed: ${error.message}`);
    }
  }
  
  console.log('\n❌ No common passwords worked.');
  console.log('\n🔧 MANUAL SETUP REQUIRED:');
  console.log('1. Open pgAdmin (installed with PostgreSQL)');
  console.log('2. Connect to PostgreSQL server');
  console.log('3. Note the password you use');
  console.log('4. Update DB_PASSWORD in your .env file');
  console.log('5. Or reinstall PostgreSQL with password: Satyam0408()');
}

findPassword().catch(console.error);
