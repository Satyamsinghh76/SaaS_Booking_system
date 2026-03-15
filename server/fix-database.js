// Database Connection Fix Script (run from server directory)
console.log('🔧 DATABASE CONNECTION FIX');
console.log('========================\n');

// Test different Supabase connection formats
const connectionFormats = [
  {
    name: 'Direct Connection (Port 5432)',
    url: 'postgresql://postgres:JaiShreeRam@dofqdvocepggeifwhhal.supabase.co:5432/postgres'
  },
  {
    name: 'Session Pooler (Port 6543)',
    url: 'postgresql://postgres:JaiShreeRam@dofqdvocepggeifwhhal.supabase.co:6543/postgres?sslmode=require'
  },
  {
    name: 'Connection Pooler (Port 5432)',
    url: 'postgresql://postgres:JaiShreeRam@dofqdvocepggeifwhhal.supabase.co:5432/postgres?pgbouncer=true&sslmode=require'
  }
];

const { Pool } = require('pg');

async function testConnection(format) {
  console.log(`\n🔗 Testing: ${format.name}`);
  console.log(`   URL: ${format.url}`);
  
  try {
    const pool = new Pool({
      connectionString: format.url,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });
    
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ SUCCESS!');
    console.log(`   Time: ${result.rows[0].current_time}`);
    
    await pool.end();
    return format.url;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    return null;
  }
}

async function fixConnection() {
  console.log('Testing different connection formats...\n');
  
  for (const format of connectionFormats) {
    const workingUrl = await testConnection(format);
    if (workingUrl) {
      console.log('\n🎉 FOUND WORKING CONNECTION!');
      console.log(`Working URL: ${workingUrl}`);
      
      // Update .env file
      const fs = require('fs');
      const envPath = '.env';
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Replace DATABASE_URL line
      envContent = envContent.replace(/DATABASE_URL=.*/g, `DATABASE_URL=${workingUrl}`);
      
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Updated .env file with working connection');
      console.log('\n🚀 You can now start your server: npm run dev');
      return;
    }
  }
  
  console.log('\n❌ No Supabase connection worked.');
  console.log('\n📋 SOLUTION OPTIONS:');
  console.log('1. Check your Supabase project is active');
  console.log('2. Verify Supabase credentials in dashboard');
  console.log('3. Use local PostgreSQL for development');
  console.log('4. Check network/firewall settings');
}

fixConnection().catch(console.error);
