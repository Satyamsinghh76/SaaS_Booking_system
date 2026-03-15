// Test server startup without database
require('dotenv').config();

// Mock database for testing
const mockPool = {
  query: async (text, params) => {
    console.log('🔧 Mock DB Query:', text, params ? `Params: ${params}` : '');
    if (text.includes('NOW()')) {
      return { rows: [{ now: new Date().toISOString() }] };
    }
    return { rows: [] };
  },
  end: async () => console.log('🔧 Mock DB pool closed')
};

// Override the real pool
const originalPool = require('pg').Pool;
require('pg').Pool = class MockPool extends originalPool {
  constructor(config) {
    console.log('🔧 Using mock database pool');
    return mockPool;
  }
};

console.log('🚀 Starting server with mock database...');
require('./server.js');
