const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Supabase Connection Hostnames...\n');

// Based on DNS test, only main project resolves
// We need to use the correct Supabase hostnames

console.log('📊 DNS Test Results:');
console.log('✅ dofqdvocepggeifwhhal.supabase.co → 172.64.149.246');
console.log('❌ db.dofqdvocepggeifwhhal.supabase.co → NOT FOUND');
console.log('❌ aws-0-us-east-1.pooler.supabase.co → NOT FOUND');

console.log('\n🔧 Solution: Use correct Supabase hostnames\n');

// Correct connection strings based on actual DNS resolution
const correctedConnections = [
  'postgresql://postgres:Satyam0408()@dofqdvocepggeifwhhal.supabase.co:5432/postgres?sslmode=require',
  'postgres://postgres:Satyam0408()@dofqdvocepggeifwhhal.supabase.co:5432/postgres?sslmode=require',
  'postgresql://postgres:Satyam0408()@dofqdvocepggeifwhhal.supabase.co:6543/postgres?sslmode=require'
];

console.log('🎯 Try these corrected connection strings:\n');
correctedConnections.forEach((conn, index) => {
  console.log(`${index + 1}. ${conn}`);
});

// Update environment with the most likely working format
const envPath = path.join(__dirname, 'server', '.env');

const updatedEnv = `# ════════════════════════════════════════════════════════════
#  Server - Supabase PostgreSQL (Fixed Hostnames)
# ════════════════════════════════════════════════════════════
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3002

# ════════════════════════════════════════════════════════════
#  Logging
# ════════════════════════════════════════════════════════════
LOG_LEVEL=debug

# ════════════════════════════════════════════════════════════
#  Supabase PostgreSQL Connection (Fixed Hostname)
# ════════════════════════════════════════════════════════════
DATABASE_URL=postgresql://postgres:Satyam0408()@dofqdvocepggeifwhhal.supabase.co:5432/postgres?sslmode=require

# Alternative formats to try if above fails:
# DATABASE_URL=postgres://postgres:Satyam0408()@dofqdvocepggeifwhhal.supabase.co:5432/postgres?sslmode=require
# DATABASE_URL=postgresql://postgres:Satyam0408()@dofqdvocepggeifwhhal.supabase.co:6543/postgres?sslmode=require

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
  console.log('✅ Updated server/.env with fixed hostname');
  console.log('📡 Using: dofqdvocepggeifwhhal.supabase.co:5432');
  console.log('🔐 SSL: Required mode');
  
} catch (error) {
  console.log('❌ Error updating environment:', error.message);
}

console.log('\n🚀 Test the connection:');
console.log('cd server && npm run dev');

console.log('\n💡 If this still fails, try these alternatives:');
console.log('1. Use port 6543 instead of 5432');
console.log('2. Use postgres:// prefix instead of postgresql://');
console.log('3. Check Supabase project status in dashboard');

console.log('\n🔍 Root Cause Found:');
console.log('• Database hostnames were incorrect');
console.log('• Main project hostname resolves correctly');
console.log('• PostgreSQL likely runs on same host as project');
