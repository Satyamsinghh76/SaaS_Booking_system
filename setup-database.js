const fs = require('fs');
const path = require('path');

console.log('🚀 BookFlow SaaS Platform Setup');
console.log('================================\n');

// Generate secure JWT secrets
const crypto = require('crypto');
const jwtSecret = crypto.randomBytes(32).toString('hex');
const jwtRefreshSecret = crypto.randomBytes(32).toString('hex');

console.log('📝 Generated secure JWT secrets:');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`JWT_REFRESH_SECRET=${jwtRefreshSecret}\n`);

// Server .env content
const serverEnv = `# ════════════════════════════════════════════════════════════
#  Server
# ════════════════════════════════════════════════════════════
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# ════════════════════════════════════════════════════════════
#  Logging
# ════════════════════════════════════════════════════════════
LOG_LEVEL=debug

# ════════════════════════════════════════════════════════════
#  PostgreSQL - Replace with your Supabase DATABASE_URL
# ════════════════════════════════════════════════════════════
# Get this from Supabase Settings > Database > Connection string > Pooling
DATABASE_URL=postgresql://postgres:your_password@db.your-project.supabase.co:5432/postgres

# ════════════════════════════════════════════════════════════
#  JWT  (secure random secrets)
# ════════════════════════════════════════════════════════════
JWT_SECRET=${jwtSecret}
JWT_REFRESH_SECRET=${jwtRefreshSecret}
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ════════════════════════════════════════════════════════════
#  Stripe (Optional - get from stripe.com)
# ════════════════════════════════════════════════════════════
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CURRENCY=usd
CLIENT_URL=http://localhost:3000
STRIPE_SUCCESS_URL=http://localhost:3000/booking/success
STRIPE_CANCEL_URL=http://localhost:3000/booking/cancel

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

// Client .env.local content
const clientEnv = `# Base URL of the backend API server
# Development: http://localhost:5000
# Production:  https://api.yourdomain.com
NEXT_PUBLIC_API_URL=http://localhost:5000
`;

console.log('📁 Creating environment files...\n');

try {
  // Write server .env
  fs.writeFileSync(path.join(__dirname, 'server', '.env'), serverEnv);
  console.log('✅ Created server/.env');
  
  // Write client .env.local
  fs.writeFileSync(path.join(__dirname, 'client', '.env.local'), clientEnv);
  console.log('✅ Created client/.env.local');
  
} catch (error) {
  console.log('❌ Could not create environment files automatically.');
  console.log('Please create them manually:\n');
  console.log('1. Create server/.env with the following content:');
  console.log('---');
  console.log(serverEnv);
  console.log('---\n');
  console.log('2. Create client/.env.local with the following content:');
  console.log('---');
  console.log(clientEnv);
  console.log('---\n');
}

console.log('🔧 Next Steps:');
console.log('1. Set up a free Supabase database:');
console.log('   - Go to https://supabase.com');
console.log('   - Create a new project');
console.log('   - Get DATABASE_URL from Settings > Database > Connection string > Pooling');
console.log('   - Replace the DATABASE_URL in server/.env\n');

console.log('2. Apply the database schema:');
console.log('   - In Supabase dashboard, go to SQL Editor');
console.log('   - Copy and paste the contents of server/db/schema.sql');
console.log('   - Run the SQL script\n');

console.log('3. Install dependencies:');
console.log('   npm run install:all\n');

console.log('4. Start the development servers:');
console.log('   npm run dev\n');

console.log('🌐 The application will be available at:');
console.log('   Frontend: http://localhost:3000');
console.log('   Backend API: http://localhost:5000');
console.log('   Health check: http://localhost:5000/health');
