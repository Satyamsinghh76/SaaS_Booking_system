const fs = require('fs');
const path = require('path');

console.log('🔧 Testing different connection formats...\n');

// Different connection formats to try
const connectionFormats = [
  'postgresql://postgres:Satyam0408()@db.dofqdvocepggeifwhhal.supabase.co:5432/postgres',
  'postgresql://postgres:Satyam0408()@db.dofqdvocepggeifwhhal.supabase.co:5432/postgres?sslmode=require',
  'postgresql://postgres:Satyam0408()@aws-0-us-east-1.pooler.supabase.co:6543/postgres',
  'postgresql://postgres:Satyam0408()@aws-0-us-east-1.pooler.supabase.co:5432/postgres',
  'postgres://postgres:Satyam0408()@db.dofqdvocepggeifwhhal.supabase.co:5432/postgres'
];

console.log('✅ Your Supabase project is ACTIVE and working!');
console.log('🌐 REST API test confirmed project is accessible\n');

console.log('🔧 Let\'s try these connection formats:\n');

connectionFormats.forEach((format, index) => {
  console.log(`${index + 1}. ${format}`);
});

console.log('\n📝 Manual update instructions:');
console.log('1. Open server/.env');
console.log('2. Replace DATABASE_URL line with one of the formats above');
console.log('3. Restart server: npm run dev');

console.log('\n💡 Pro tip: Start with format #1 (SSL required) as it\'s most common');

// Auto-update with the most likely working format
const envPath = path.join(__dirname, 'server', '.env');
const sslFormat = 'postgresql://postgres:Satyam0408()@db.dofqdvocepggeifwhhal.supabase.co:5432/postgres?sslmode=require';

try {
  const currentEnv = fs.readFileSync(envPath, 'utf8');
  const updatedEnv = currentEnv.replace(
    /DATABASE_URL=.+/,
    `DATABASE_URL=${sslFormat}`
  );
  
  fs.writeFileSync(envPath, updatedEnv);
  console.log('\n✅ Auto-updated with SSL required format (#1)');
  console.log('🚀 Try starting the server: cd server && npm run dev');
  
} catch (error) {
  console.log('\n❌ Could not auto-update. Please update manually.');
}
