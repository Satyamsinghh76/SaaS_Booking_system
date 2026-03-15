const fs = require('fs');
const path = require('path');

console.log('🔧 Updating with correct Supabase connection...\n');

// Your actual connection string from Supabase
const directConnection = 'postgresql://postgres:Satyam0408()@db.dofqdvocepggeifwhhal.supabase.co:5432/postgres';

// Session pooler for IPv4 compatibility
const sessionPooler = 'postgresql://postgres:Satyam0408()@aws-0-us-east-1.pooler.supabase.co:5432/postgres';

const envPath = path.join(__dirname, 'server', '.env');

const updatedEnv = `# ════════════════════════════════════════════════════════════
#  Server
# ════════════════════════════════════════════════════════════
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3002

# ════════════════════════════════════════════════════════════
#  Logging
# ════════════════════════════════════════════════════════════
LOG_LEVEL=debug

# ════════════════════════════════════════════════════════════
#  PostgreSQL - Your Supabase Connection
# ════════════════════════════════════════════════════════════
DATABASE_URL=${directConnection}

# Alternative (if direct connection fails due to IPv4):
# DATABASE_URL=${sessionPooler}

# ════════════════════════════════════════════════════════════
#  JWT  (secure random secrets)
# ════════════════════════════════════════════════════════════
JWT_SECRET=9c5bebcb23f1b7ec8dc95c9e8b1220671a0ae4b66fa3fdd86eab943396622ddd
JWT_REFRESH_SECRET=bfdb39b406f854ffd285fc73864654d253cb83be659fc878311ee21f522a61a3
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ════════════════════════════════════════════════════════════
#  Stripe (Optional)
# ════════════════════════════════════════════════════════════
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CURRENCY=usd
CLIENT_URL=http://localhost:3002
STRIPE_SUCCESS_URL=http://localhost:3002/booking/success
STRIPE_CANCEL_URL=http://localhost:3002/booking/cancel

# ════════════════════════════════════════════════════════════
#  Email (Optional)
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

try {
  fs.writeFileSync(envPath, updatedEnv);
  console.log('✅ Updated server/.env with your actual Supabase connection');
  console.log('📡 Using direct connection:', directConnection);
  console.log('\n🔄 Alternative session pooler (if needed):', sessionPooler);
  
} catch (error) {
  console.log('❌ Error updating environment:', error.message);
}

console.log('\n🚀 Now try starting the server:');
console.log('cd server && npm run dev');

console.log('\n📊 Next steps:');
console.log('1. If server starts successfully → Apply database schema');
console.log('2. If still fails → Try the session pooler URL');
console.log('3. Apply schema in Supabase SQL Editor with server/db/schema.sql');
