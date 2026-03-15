const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up SQLite fallback for development...\n');

// Create a simple SQLite-based environment for testing
const envPath = path.join(__dirname, 'server', '.env');

const sqliteEnv = `# ════════════════════════════════════════════════════════════
#  Server - SQLite Fallback for Development
# ════════════════════════════════════════════════════════════
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3002

# ════════════════════════════════════════════════════════════
#  Logging
# ════════════════════════════════════════════════════════════
LOG_LEVEL=debug

# ════════════════════════════════════════════════════════════
#  Database - SQLite Fallback (for development only)
# ════════════════════════════════════════════════════════════
DATABASE_URL=sqlite:./data/booking.db

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
  // Create data directory
  const dataDir = path.join(__dirname, 'server', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Write SQLite environment
  fs.writeFileSync(envPath, sqliteEnv);
  console.log('✅ Set up SQLite fallback environment');
  console.log('📁 Database will be stored at: server/data/booking.db');
  
} catch (error) {
  console.log('❌ Error setting up SQLite fallback:', error.message);
}

console.log('\n⚠️  Note: This is a temporary SQLite setup for development.');
console.log('The app is designed for PostgreSQL. Some features may not work with SQLite.');
console.log('\n🚀 Start the server with:');
console.log('cd server && npm run dev');

console.log('\n🔧 To switch back to Supabase later:');
console.log('1. Fix your Supabase project DNS issues');
console.log('2. Update DATABASE_URL in server/.env');
console.log('3. Apply the PostgreSQL schema');
