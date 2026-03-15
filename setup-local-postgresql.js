// Local PostgreSQL Setup Script
console.log('🗄️  LOCAL POSTGRESQL SETUP');
console.log('========================\n');

const { Pool } = require('pg');

async function setupLocalDatabase() {
  console.log('1️⃣ Testing PostgreSQL connection...');
  
  try {
    // Connect to default postgres database
    const adminPool = new Pool({
      host: 'localhost',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: 'Satyam0408()',
      ssl: false
    });
    
    const timeResult = await adminPool.query('SELECT NOW()');
    console.log('✅ PostgreSQL connected successfully!');
    console.log(`   Time: ${timeResult.rows[0].now}`);
    
    // Check if saas_booking database exists
    console.log('\n2️⃣ Checking if saas_booking database exists...');
    const dbCheck = await adminPool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      ['saas_booking']
    );
    
    if (dbCheck.rows.length === 0) {
      console.log('❌ saas_booking database not found');
      console.log('🔧 Creating saas_booking database...');
      
      await adminPool.query('CREATE DATABASE saas_booking');
      console.log('✅ saas_booking database created successfully!');
    } else {
      console.log('✅ saas_booking database already exists');
    }
    
    await adminPool.end();
    
    // Test connection to saas_booking database
    console.log('\n3️⃣ Testing connection to saas_booking database...');
    const appPool = new Pool({
      host: 'localhost',
      port: 5432,
      database: 'saas_booking',
      user: 'postgres',
      password: 'Satyam0408()',
      ssl: false
    });
    
    const appResult = await appPool.query('SELECT NOW()');
    console.log('✅ Connected to saas_booking database!');
    console.log(`   Time: ${appResult.rows[0].now}`);
    
    await appPool.end();
    
    console.log('\n🎉 LOCAL POSTGRESQL SETUP COMPLETE!');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Apply database schema:');
    console.log('   psql -U postgres -d saas_booking -f ../fixed_supabase_schema.sql');
    console.log('2. Update .env file:');
    console.log('   copy .env.local-working .env');
    console.log('3. Start your server:');
    console.log('   npm run dev');
    
  } catch (error) {
    console.log('❌ PostgreSQL setup failed:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n🔧 SOLUTION: Fix PostgreSQL password');
      console.log('1. Open pgAdmin or psql');
      console.log('2. Connect with your actual PostgreSQL password');
      console.log('3. Update the password in .env.local-working');
    } else if (error.message.includes('connect')) {
      console.log('\n🔧 SOLUTION: Install PostgreSQL');
      console.log('1. Download PostgreSQL from: https://www.postgresql.org/download/');
      console.log('2. Install with password: Satyam0408()');
      console.log('3. Make sure PostgreSQL service is running');
    }
  }
}

setupLocalDatabase().catch(console.error);
