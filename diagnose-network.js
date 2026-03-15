const dns = require('dns');
const https = require('https');
const { Pool } = require('pg');

console.log('🔍 Diagnosing Supabase Network Connectivity...\n');

const hostname = 'dofqdvocepggeifwhhal.supabase.co';
const dbHostname = 'db.dofqdvocepggeifwhhal.supabase.co';
const poolerHostname = 'aws-0-us-east-1.pooler.supabase.co';

// Test 1: DNS Resolution
console.log('1. Testing DNS Resolution...\n');

const testDNS = (hostname, description) => {
  return new Promise((resolve) => {
    dns.lookup(hostname, (err, address, family) => {
      if (err) {
        console.log(`❌ ${description}: DNS FAILED - ${err.message}`);
        resolve({ success: false, error: err.message, address: null });
      } else {
        console.log(`✅ ${description}: ${address} (IPv${family})`);
        resolve({ success: true, address, family });
      }
    });
  });
};

// Test 2: HTTP/HTTPS Connectivity
const testHTTP = (hostname, description) => {
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

// Test 3: PostgreSQL Connection Test
const testPostgres = (connectionString, description) => {
  return new Promise((resolve) => {
    const pool = new Pool({
      connectionString: connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });

    pool.connect()
      .then(client => {
        console.log(`✅ ${description}: PostgreSQL CONNECTED`);
        client.release();
        pool.end();
        resolve({ success: true });
      })
      .catch(err => {
        console.log(`❌ ${description}: PostgreSQL FAILED - ${err.message}`);
        pool.end();
        resolve({ success: false, error: err.message });
      });
  });
};

// Run all tests
async function runDiagnostics() {
  console.log('='.repeat(60));
  console.log('NETWORK CONNECTIVITY DIAGNOSTICS');
  console.log('='.repeat(60));

  // DNS Tests
  console.log('\n📡 DNS Resolution Tests:');
  const results = await Promise.all([
    testDNS(hostname, 'Main Project'),
    testDNS(dbHostname, 'Database Host'),
    testDNS(poolerHostname, 'Pooler Host'),
  ]);

  // HTTP Tests (only for successful DNS)
  console.log('\n🌐 HTTPS Connectivity Tests:');
  const httpResults = await Promise.all([
    testHTTP(hostname, 'Main Project HTTPS'),
  ]);

  // PostgreSQL Tests
  console.log('\n🐘 PostgreSQL Connection Tests:');
  const connectionStrings = [
    'postgresql://postgres:Satyam0408()@db.dofqdvocepggeifwhhal.supabase.co:5432/postgres',
    'postgresql://postgres:Satyam0408()@aws-0-us-east-1.pooler.supabase.co:5432/postgres',
    'postgresql://postgres:Satyam0408()@aws-0-us-east-1.pooler.supabase.co:6543/postgres',
  ];

  const pgResults = await Promise.all([
    testPostgres(connectionStrings[0], 'Direct Connection (5432)'),
    testPostgres(connectionStrings[1], 'Pooler Connection (5432)'),
    testPostgres(connectionStrings[2], 'Pooler Connection (6543)'),
  ]);

  // Summary and Recommendations
  console.log('\n' + '='.repeat(60));
  console.log('DIAGNOSTIC SUMMARY');
  console.log('='.repeat(60));

  const dnsSuccess = results.some(r => r.success);
  const httpSuccess = httpResults.some(r => r.success);
  const pgSuccess = pgResults.some(r => r.success);

  console.log(`\n📊 Results:`);
  console.log(`• DNS Resolution: ${dnsSuccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`• HTTPS Connectivity: ${httpSuccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`• PostgreSQL Connection: ${pgSuccess ? '✅ PASS' : '❌ FAIL'}`);

  if (!dnsSuccess) {
    console.log('\n🔧 RECOMMENDATION: DNS Issue');
    console.log('• Check internet connection');
    console.log('• Try different DNS server (8.8.8.8)');
    console.log('• Check if Supabase domain is blocked');
  } else if (!httpSuccess) {
    console.log('\n🔧 RECOMMENDATION: HTTPS Issue');
    console.log('• Check firewall/proxy settings');
    console.log('• Try from different network');
    console.log('• Check SSL certificate issues');
  } else if (!pgSuccess) {
    console.log('\n🔧 RECOMMENDATION: PostgreSQL Issue');
    console.log('• PostgreSQL port (5432/6543) may be blocked');
    console.log('• Check corporate firewall');
    console.log('• Try using session pooler');
  } else {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('• Network connectivity is working');
    console.log('• Issue may be with application configuration');
  }

  // Find working connection string
  const workingPG = pgResults.find((r, i) => r.success);
  if (workingPG) {
    const workingIndex = pgResults.indexOf(workingPG);
    console.log(`\n✅ WORKING CONNECTION: ${connectionStrings[workingIndex]}`);
    console.log('Update your server/.env with this connection string');
  }

  console.log('\n' + '='.repeat(60));
}

runDiagnostics().catch(console.error);
