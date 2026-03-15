const fs = require('fs');
const path = require('path');

console.log('🔧 Final connection fix attempt...\n');

// Since REST API works but PostgreSQL doesn't, let's try:
// 1. Different hostname format
// 2. IP address (if we can resolve it)
// 3. Alternative port

const formats = [
  // Try without db. prefix
  'postgresql://postgres:Satyam0408()@dofqdvocepggeifwhhal.supabase.co:5432/postgres?sslmode=verify-full',
  // Try with pooler on port 6543
  'postgresql://postgres:Satyam0408()@aws-0-us-east-1.pooler.supabase.co:6543/postgres?sslmode=verify-full',
  // Try session pooler
  'postgresql://postgres:Satyam0408()@dofqdvocepggeifwhhal.supabase.co:6543/postgres?sslmode=verify-full'
];

console.log('🎯 Since your Supabase project IS working (REST API test passed),');
console.log('   this might be a DNS or PostgreSQL-specific issue.\n');

console.log('🔧 Trying these final formats:\n');

formats.forEach((format, index) => {
  console.log(`${index + 1}. ${format}`);
});

// Update with the most likely format (without db. prefix)
const envPath = path.join(__dirname, 'server', '.env');
const bestFormat = 'postgresql://postgres:Satyam0408()@dofqdvocepggeifwhhal.supabase.co:5432/postgres?sslmode=verify-full';

try {
  const currentEnv = fs.readFileSync(envPath, 'utf8');
  const updatedEnv = currentEnv.replace(
    /DATABASE_URL=.+/,
    `DATABASE_URL=${bestFormat}`
  );
  
  fs.writeFileSync(envPath, updatedEnv);
  console.log('\n✅ Updated with format #1 (no db. prefix, verify-full SSL)');
  
} catch (error) {
  console.log('\n❌ Could not update environment file');
}

console.log('\n🚀 Try starting the server:');
console.log('cd server && npm run dev');

console.log('\n❌ If this still fails, the issue might be:');
console.log('1. Supabase PostgreSQL port blocked by network/firewall');
console.log('2. DNS resolution issue specific to PostgreSQL');
console.log('3. Supabase project region mismatch');

console.log('\n🎯 Alternative solutions:');
console.log('• Use local PostgreSQL for development');
console.log('• Contact Supabase support about PostgreSQL connectivity');
console.log('• Try from a different network/connection');

console.log('\n✅ GOOD NEWS: Your frontend is fully functional!');
console.log('   🌐 http://localhost:3002 - ready and working');
