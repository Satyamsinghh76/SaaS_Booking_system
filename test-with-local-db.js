// Test with local SQLite fallback
require('dotenv').config();

// Create a simple in-memory database for testing
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

// Initialize test tables
db.serialize(() => {
  console.log('🔧 Setting up test database...');
  
  // Create users table
  db.run(`CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  // Create services table
  db.run(`CREATE TABLE services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    price REAL NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  // Insert test data
  db.run(`INSERT INTO users (id, name, email, password_hash) VALUES 
    ('test-user-1', 'Test User', 'test@example.com', 'hashed_password')`);
    
  db.run(`INSERT INTO services (id, name, description, duration_minutes, price) VALUES 
    ('test-service-1', 'Test Service', 'A test service', 60, 50.00)`);
  
  console.log('✅ Test database ready');
});

// Mock the pg pool to use our SQLite
const originalPool = require('pg').Pool;
require('pg').Pool = class MockPool extends originalPool {
  constructor(config) {
    console.log('🔧 Using SQLite mock database');
    return {
      query: async (text, params) => {
        console.log('🔧 Mock Query:', text);
        
        // Simple query simulation
        if (text.includes('SELECT NOW()')) {
          return { rows: [{ now: new Date().toISOString() }] };
        }
        
        if (text.includes('users') && text.includes('WHERE email')) {
          return { rows: [{ id: 'test-user-1', name: 'Test User', email: 'test@example.com', role: 'user' }] };
        }
        
        if (text.includes('services')) {
          return { rows: [{ id: 'test-service-1', name: 'Test Service', price: 50.00 }] };
        }
        
        return { rows: [] };
      },
      end: async () => console.log('🔧 Mock database closed')
    };
  }
};

console.log('🚀 Starting server with test database...');
require('./server/server.js');
