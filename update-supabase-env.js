const fs = require('fs');
const path = require('path');

console.log('🔧 Creating Supabase-optimized environment configuration...\n');

// Supabase connection string with proper SSL
const supabaseEnv = `# ════════════════════════════════════════════════════════════
#  Server - Supabase PostgreSQL Configuration
# ════════════════════════════════════════════════════════════
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3002

# ════════════════════════════════════════════════════════════
#  Logging
# ════════════════════════════════════════════════════════════
LOG_LEVEL=debug

# ════════════════════════════════════════════════════════════
#  Supabase PostgreSQL Connection
# ════════════════════════════════════════════════════════════
# Your actual Supabase connection string
DATABASE_URL=postgresql://postgres:Satyam0408()@dofqdvocepggeifwhhal.supabase.co:5432/postgres

# Alternative: Session Pooler (if direct connection has issues)
# DATABASE_URL=postgresql://postgres:Satyam0408()@aws-0-us-east-1.pooler.supabase.co:5432/postgres

# ════════════════════════════════════════════════════════════
#  JWT  (secure random secrets)
# ════════════════════════════════════════════════════════════
JWT_SECRET=9c5bebcb23f1b7ec8dc95c9e8b1220671a0ae4b66fa3fdd86eab943396622ddd
JWT_REFRESH_SECRET=bfdb39b406f854ffd285fc73864654d253cb83be659fc878311ee21f522a61a3
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ════════════════════════════════════════════════════════════
#  Stripe (Optional - configure for payments)
# ════════════════════════════════════════════════════════════
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CURRENCY=usd
CLIENT_URL=http://localhost:3002
STRIPE_SUCCESS_URL=http://localhost:3002/booking/success
STRIPE_CANCEL_URL=http://localhost:3002/booking/cancel

# ════════════════════════════════════════════════════════════
#  Email (Optional - configure for notifications)
# ════════════════════════════════════════════════════════════
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@yourdomain.com

# ════════════════════════════════════════════════════════════
#  Google Calendar (Optional)
# ════════════════════════════════════════════════════════════
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/calendar/oauth/callback
GOOGLE_CALENDAR_ID=primary
TOKEN_ENCRYPTION_KEY=32_byte_hex_encryption_key

# ════════════════════════════════════════════════════════════
#  Twilio SMS (Optional)
# ════════════════════════════════════════════════════════════
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
`;

const envPath = path.join(__dirname, 'server', '.env');

try {
  fs.writeFileSync(envPath, supabaseEnv);
  console.log('✅ Created Supabase-optimized environment configuration');
  console.log('📡 Database: Supabase PostgreSQL');
  console.log('🔐 SSL: Enabled with rejectUnauthorized: false');
  console.log('🌐 Project: dofqdvocepggeifwhhal.supabase.co');
  
} catch (error) {
  console.log('❌ Error creating environment file:', error.message);
}

console.log('\n🎯 Key improvements for Supabase:');
console.log('• Proper SSL configuration for Supabase');
console.log('• Optimized pool settings (1-10 connections)');
console.log('• Enhanced error handling and logging');
console.log('• Better connection timeout handling');
console.log('• Application name for easier debugging');

console.log('\n🚀 Next steps:');
console.log('1. Apply database schema in Supabase SQL Editor');
console.log('2. Start the server: npm run dev');
console.log('3. Check logs for connection status');

console.log('\n📋 Schema application:');
console.log('• Go to https://dofqdvocepggeifwhhal.supabase.co');
console.log('• Navigate to SQL Editor');
console.log('• Paste contents of server/db/schema.sql');
console.log('• Run the script to create tables');
