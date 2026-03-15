const dns = require('dns');
const https = require('https');

console.log('🔍 Simple Network Connectivity Test...\n');

const hostname = 'dofqdvocepggeifwhhal.supabase.co';
const dbHostname = 'db.dofqdvocepggeifwhhal.supabase.co';
const poolerHostname = 'aws-0-us-east-1.pooler.supabase.co';

console.log('='.repeat(50));
console.log('DNS RESOLUTION TEST');
console.log('='.repeat(50));

const testDNS = (hostname, description) => {
  return new Promise((resolve) => {
    dns.lookup(hostname, (err, address, family) => {
      if (err) {
        console.log(`❌ ${description}: FAILED - ${err.message}`);
        resolve({ success: false, error: err.message });
      } else {
        console.log(`✅ ${description}: ${address} (IPv${family})`);
        resolve({ success: true, address });
      }
    });
  });
};

const testHTTPS = (hostname, description) => {
  return new Promise((resolve) => {
    const options = {
      hostname: hostname,
      port: 443,
      path: '/',
      method: 'GET',
      timeout: 5000,
    };

    const req = https.request(options, (res) => {
      console.log(`✅ ${description}: HTTPS OK (${res.statusCode})`);
      resolve({ success: true, statusCode: res.statusCode });
    });

    req.on('error', (err) => {
      console.log(`❌ ${description}: HTTPS FAILED - ${err.message}`);
      resolve({ success: false, error: err.message });
    });

    req.on('timeout', () => {
      console.log(`❌ ${description}: HTTPS TIMEOUT`);
      req.destroy();
      resolve({ success: false, error: 'timeout' });
    });

    req.end();
  });
};

async function runTests() {
  // Test DNS resolution
  console.log('\n📡 Testing DNS Resolution:\n');
  const dnsResults = await Promise.all([
    testDNS(hostname, 'Main Project'),
    testDNS(dbHostname, 'Database Host'),
    testDNS(poolerHostname, 'Pooler Host'),
  ]);

  // Test HTTPS for successful DNS
  console.log('\n🌐 Testing HTTPS Connectivity:\n');
  const successfulDNS = dnsResults.filter(r => r.success);
  
  if (successfulDNS.length > 0) {
    await testHTTPS(hostname, 'Main Project HTTPS');
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('SUMMARY');
  console.log('='.repeat(50));

  const dnsSuccess = dnsResults.some(r => r.success);
  
  if (dnsSuccess) {
    console.log('\n✅ DNS Resolution: WORKING');
    console.log('🔧 Next steps:');
    console.log('• Test PostgreSQL connection separately');
    console.log('• Check if port 5432/6543 is blocked');
    console.log('• Try session pooler connection');
  } else {
    console.log('\n❌ DNS Resolution: FAILED');
    console.log('🔧 Solutions:');
    console.log('• Check internet connection');
    console.log('• Try different DNS (8.8.8.8)');
    console.log('• Check if Supabase is blocked');
    console.log('• Try from different network');
  }

  console.log('\n🎯 Quick Fixes to Try:');
  console.log('1. Flush DNS: ipconfig /flushdns');
  console.log('2. Change DNS: 8.8.8.8, 1.1.1.1');
  console.log('3. Disable VPN/Proxy');
  console.log('4. Try mobile hotspot');
}

runTests().catch(console.error);
