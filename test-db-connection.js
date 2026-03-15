const https = require('https');
const dns = require('dns');

console.log('🔍 Testing Supabase connectivity...\n');

const hostname = 'db.dofqdvocepggeifwhhal.supabase.co';

// Test DNS resolution
dns.lookup(hostname, (err, address, family) => {
  if (err) {
    console.log('❌ DNS lookup failed:', err.message);
    console.log('\n🔧 Possible solutions:');
    console.log('1. Check if Supabase project is fully active');
    console.log('2. Try using the pooler URL instead');
    console.log('3. Check firewall/network restrictions');
    return;
  }
  
  console.log('✅ DNS resolution successful:', address);
  
  // Test HTTPS connectivity
  const options = {
    hostname: hostname,
    port: 5432,
    timeout: 5000
  };
  
  const req = https.request(options, (res) => {
    console.log('✅ HTTPS connection successful');
    console.log('Status:', res.statusCode);
  });
  
  req.on('error', (err) => {
    console.log('❌ HTTPS connection failed:', err.message);
    console.log('\n💡 This is normal - PostgreSQL uses different protocol');
    console.log('The issue might be:');
    console.log('1. Supabase project not fully ready');
    console.log('2. Incorrect password');
    console.log('3. Network restrictions');
  });
  
  req.on('timeout', () => {
    console.log('❌ Connection timeout');
    req.destroy();
  });
  
  req.end();
});

console.log('\n📋 Connection string being used:');
console.log('postgresql://postgres:Satyam0408()@db.dofqdvocepggeifwhhal.supabase.co:5432/postgres');

console.log('\n🔧 Alternative: Try the pooler URL:');
console.log('postgresql://postgres:Satyam0408()@aws-0-us-east-1.pooler.supabase.co:6543/postgres');
