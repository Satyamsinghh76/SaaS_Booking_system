const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up local PostgreSQL for immediate development...\n');

// Create local PostgreSQL environment
const localEnv = `# ════════════════════════════════════════════════════════════
#  Server - Local PostgreSQL Setup
# ════════════════════════════════════════════════════════════
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3002

# ════════════════════════════════════════════════════════════
#  Logging
# ════════════════════════════════════════════════════════════
LOG_LEVEL=debug

# ════════════════════════════════════════════════════════════
#  PostgreSQL - Local Development
# ════════════════════════════════════════════════════════════
DB_HOST=localhost
DB_PORT=5432
DB_NAME=saas_booking
DB_USER=postgres
DB_PASSWORD=Satyam0408()

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

const envPath = path.join(__dirname, 'server', '.env');

try {
  fs.writeFileSync(envPath, localEnv);
  console.log('✅ Created local PostgreSQL environment');
  console.log('📁 Database: saas_booking on localhost:5432');
  console.log('👤 User: postgres');
  console.log('🔐 Password: Satyam0408()');
  
} catch (error) {
  console.log('❌ Error creating environment:', error.message);
}

console.log('\n🎯 Next Steps:');
console.log('1. Install PostgreSQL locally (if not already installed)');
console.log('2. Create database: CREATE DATABASE saas_booking;');
console.log('3. Apply schema: psql -U postgres -d saas_booking -f server/db/schema.sql');
console.log('4. Start server: npm run dev');

console.log('\n📦 Quick PostgreSQL setup options:');
console.log('• Download from: https://postgresql.org/download/windows/');
console.log('• Or use Docker: docker run --name postgres -e POSTGRES_PASSWORD=Satyam0408() -p 5432:5432 -d postgres:14');

console.log('\n✅ Once PostgreSQL is running, your app will be fully functional!');
