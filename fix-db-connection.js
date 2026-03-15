const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing database connection with pooler URL...\n');

// Try pooler format (more reliable for connections)
const poolerUrl = 'postgresql://postgres:Satyam0408()@aws-0-us-east-1.pooler.supabase.co:6543/postgres';

const envPath = path.join(__dirname, 'server', '.env');

try {
  const currentEnv = fs.readFileSync(envPath, 'utf8');
  
  // Update with pooler URL
  const updatedEnv = currentEnv.replace(
    /DATABASE_URL=.+/,
    `DATABASE_URL=${poolerUrl}`
  );
  
  fs.writeFileSync(envPath, updatedEnv);
  console.log('✅ Updated server/.env with pooler URL');
  console.log('📡 New connection string:', poolerUrl);
  
} catch (error) {
  console.log('❌ Error updating environment:', error.message);
}

console.log('\n🚀 Try starting the server again:');
console.log('cd server && npm run dev');

console.log('\n🔍 If this still fails, please check:');
console.log('1. Your Supabase project status at https://supabase.com/dashboard');
console.log('2. The project URL and region in Supabase settings');
console.log('3. Whether the project is fully active (not paused)');
