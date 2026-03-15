const fs = require('fs');
const path = require('path');

console.log('🔄 Switching to Session Pooler for IPv4 compatibility...\n');

const envPath = path.join(__dirname, 'server', '.env');

try {
  const currentEnv = fs.readFileSync(envPath, 'utf8');
  
  // Switch to session pooler
  const sessionPooler = 'postgresql://postgres:Satyam0408()@aws-0-us-east-1.pooler.supabase.co:5432/postgres';
  
  const updatedEnv = currentEnv.replace(
    /DATABASE_URL=.+/,
    `DATABASE_URL=${sessionPooler}`
  );
  
  fs.writeFileSync(envPath, updatedEnv);
  console.log('✅ Switched to Session Pooler URL');
  console.log('📡 New connection:', sessionPooler);
  
} catch (error) {
  console.log('❌ Error updating environment:', error.message);
}

console.log('\n🚀 Try starting the server again:');
console.log('cd server && npm run dev');

console.log('\n💡 Session Pooler benefits:');
console.log('- IPv4 compatible');
console.log('- Better for intermittent connections');
console.log('- Handles connection pooling automatically');
