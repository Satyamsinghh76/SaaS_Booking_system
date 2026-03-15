console.log('🔍 Testing different Supabase connection formats...\n');

const formats = [
  'postgresql://postgres:Satyam0408()@db.dofqdvocepggeifwhhal.supabase.co:5432/postgres',
  'postgresql://postgres:Satyam0408()@aws-0-us-east-1.pooler.supabase.co:6543/postgres',
  'postgresql://postgres:Satyam0408()@db.dofqdvocepggeifwhhal.supabase.co:5432/postgres?sslmode=require',
  'postgresql://postgres:Satyam0408()@dofqdvocepggeifwhhal.supabase.co:5432/postgres'
];

console.log('📋 Please check your Supabase dashboard for the correct format:');
console.log('1. Go to https://supabase.com/dashboard');
console.log('2. Select your project');
console.log('3. Settings → Database → Connection string');
console.log('4. Copy the exact connection string');

console.log('\n🔧 Common formats to try:');
formats.forEach((format, index) => {
  console.log(`${index + 1}. ${format}`);
});

console.log('\n⚠️  Your current project URL suggests:');
console.log('- Project ID: dofqdvocepggeifwhhal');
console.log('- Region might be: us-east-1 (but verify in dashboard)');
console.log('- Password: Satyam0408()');

console.log('\n📝 Once you have the correct connection string:');
console.log('1. Update server/.env DATABASE_URL line');
console.log('2. Restart the server: npm run dev');
console.log('3. Apply schema in Supabase SQL Editor');
