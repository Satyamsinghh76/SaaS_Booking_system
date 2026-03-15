// API Endpoint Testing
const axios = require('axios');

const API_BASE = 'http://localhost:5000';

console.log('🧪 TESTING API ENDPOINTS');
console.log('========================\n');

async function testEndpoint(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method: method.toLowerCase(),
      url: `${API_BASE}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
      config.data = data;
    }
    
    const response = await axios(config);
    console.log(`✅ ${method} ${endpoint} - Status: ${response.status}`);
    return { success: true, data: response.data };
  } catch (error) {
    if (error.response) {
      console.log(`❌ ${method} ${endpoint} - Status: ${error.response.status}`);
      return { success: false, error: error.response.data };
    } else {
      console.log(`❌ ${method} ${endpoint} - Connection Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

async function runTests() {
  // Test 1: Health Check
  console.log('1️⃣ Health Check');
  await testEndpoint('GET', '/health');
  
  // Test 2: Readiness Check
  console.log('\n2️⃣ Readiness Check');
  await testEndpoint('GET', '/ready');
  
  // Test 3: Public Services
  console.log('\n3️⃣ Public Services');
  await testEndpoint('GET', '/api/services');
  
  // Test 4: Authentication (without token)
  console.log('\n4️⃣ Authentication Test (No Token)');
  await testEndpoint('GET', '/api/auth/me');
  
  // Test 5: Invalid Route
  console.log('\n5️⃣ Invalid Route');
  await testEndpoint('GET', '/api/nonexistent');
  
  console.log('\n📊 API TEST SUMMARY');
  console.log('==================');
  console.log('✅ Health endpoints tested');
  console.log('✅ Public routes tested');
  console.log('✅ Authentication middleware tested');
  console.log('✅ Error handling tested');
}

runTests().catch(console.error);
