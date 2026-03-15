// Comprehensive QA Audit Report
const fs = require('fs');
const path = require('path');

console.log('🔍 COMPREHENSIVE QA AUDIT REPORT');
console.log('=====================================\n');

// STEP 1: Project Structure Validation
console.log('📁 STEP 1 — PROJECT STRUCTURE VALIDATION');
const requiredDirs = [
  'client',
  'server',
  'server/controllers',
  'server/routes',
  'server/services',
  'server/models',
  'server/middleware',
  'server/config',
  'client/app',
  'client/components',
  'client/lib'
];

let structureScore = 0;
requiredDirs.forEach(dir => {
  const exists = fs.existsSync(dir);
  console.log(`${exists ? '✅' : '❌'} ${dir}`);
  if (exists) structureScore++;
});

console.log(`Structure Score: ${structureScore}/${requiredDirs.length}\n`);

// STEP 2: Environment Variables Check
console.log('🔧 STEP 2 — ENVIRONMENT VARIABLES TEST');
const envFile = 'server/.env';
const envExample = 'server/.env.example';

if (fs.existsSync(envFile)) {
  console.log('✅ .env file exists');
  const envContent = fs.readFileSync(envFile, 'utf8');
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET', 
    'JWT_REFRESH_SECRET',
    'PORT',
    'NODE_ENV',
    'CORS_ORIGIN'
  ];
  
  let envScore = 0;
  requiredVars.forEach(variable => {
    const exists = envContent.includes(variable + '=');
    console.log(`${exists ? '✅' : '❌'} ${variable}`);
    if (exists) envScore++;
  });
  
  console.log(`Environment Score: ${envScore}/${requiredVars.length}\n`);
} else {
  console.log('❌ .env file missing\n');
}

// STEP 3: Module Dependencies Check
console.log('📦 STEP 3 — MODULE DEPENDENCIES VALIDATION');

// Check server package.json
const serverPackage = JSON.parse(fs.readFileSync('server/package.json', 'utf8'));
const serverDeps = Object.keys(serverPackage.dependencies || {});

const requiredServerDeps = [
  'express',
  'pg',
  'jsonwebtoken',
  'bcryptjs',
  'helmet',
  'cors',
  'morgan',
  'dotenv',
  'twilio',
  'nodemailer',
  'googleapis',
  'stripe'
];

let serverDepScore = 0;
requiredServerDeps.forEach(dep => {
  const exists = serverDeps.includes(dep);
  console.log(`${exists ? '✅' : '❌'} ${dep}`);
  if (exists) serverDepScore++;
});

console.log(`Server Dependencies Score: ${serverDepScore}/${requiredServerDeps.length}\n`);

// Check client package.json
const clientPackage = JSON.parse(fs.readFileSync('client/package.json', 'utf8'));
const clientDeps = Object.keys(clientPackage.dependencies || {});

const requiredClientDeps = [
  'next',
  'react',
  'axios',
  'zustand',
  'react-hook-form',
  'zod',
  'tailwindcss',
  'framer-motion',
  'date-fns'
];

let clientDepScore = 0;
requiredClientDeps.forEach(dep => {
  const exists = clientDeps.includes(dep);
  console.log(`${exists ? '✅' : '❌'} ${dep}`);
  if (exists) clientDepScore++;
});

console.log(`Client Dependencies Score: ${clientDepScore}/${requiredClientDeps.length}\n`);

// STEP 4: API Routes Validation
console.log('🛣️  STEP 4 — API ROUTES VALIDATION');
const routesDir = 'server/routes';
const expectedRoutes = [
  'auth.js',
  'bookings.js',
  'services.js',
  'payments.js',
  'calendar.js',
  'sms.js',
  'admin.js'
];

let routesScore = 0;
expectedRoutes.forEach(route => {
  const exists = fs.existsSync(path.join(routesDir, route));
  console.log(`${exists ? '✅' : '❌'} ${route}`);
  if (exists) routesScore++;
});

console.log(`Routes Score: ${routesScore}/${expectedRoutes.length}\n`);

// STEP 5: Controllers Validation
console.log('🎮 STEP 5 — CONTROLLERS VALIDATION');
const controllersDir = 'server/controllers';
const expectedControllers = [
  'authController.js',
  'bookingController.js',
  'serviceController.js',
  'paymentController.js',
  'calendarController.js',
  'smsController.js',
  'adminController.js'
];

let controllersScore = 0;
expectedControllers.forEach(controller => {
  const exists = fs.existsSync(path.join(controllersDir, controller));
  console.log(`${exists ? '✅' : '❌'} ${controller}`);
  if (exists) controllersScore++;
});

console.log(`Controllers Score: ${controllersScore}/${expectedControllers.length}\n`);

// STEP 6: Services Validation
console.log('🔧 STEP 6 — SERVICES VALIDATION');
const servicesDir = 'server/services';
const expectedServices = [
  'twilioService.js',
  'calendarService.js',
  'stripeService.js',
  'notificationService.js'
];

let servicesScore = 0;
expectedServices.forEach(service => {
  const exists = fs.existsSync(path.join(servicesDir, service));
  console.log(`${exists ? '✅' : '❌'} ${service}`);
  if (exists) servicesScore++;
});

console.log(`Services Score: ${servicesScore}/${expectedServices.length}\n`);

// STEP 7: Database Schema Check
console.log('🗄️  STEP 7 — DATABASE SCHEMA VALIDATION');
const schemaFile = 'fixed_supabase_schema.sql';
if (fs.existsSync(schemaFile)) {
  console.log('✅ Database schema file exists');
  const schemaContent = fs.readFileSync(schemaFile, 'utf8');
  
  const expectedTables = [
    'CREATE TABLE users',
    'CREATE TABLE services',
    'CREATE TABLE bookings',
    'CREATE TABLE availability',
    'CREATE TABLE sms_logs',
    'CREATE TABLE google_tokens',
    'CREATE TABLE payment_sessions'
  ];
  
  let schemaScore = 0;
  expectedTables.forEach(table => {
    const exists = schemaContent.includes(table);
    console.log(`${exists ? '✅' : '❌'} ${table}`);
    if (exists) schemaScore++;
  });
  
  console.log(`Schema Score: ${schemaScore}/${expectedTables.length}\n`);
} else {
  console.log('❌ Database schema file missing\n');
}

// STEP 8: Frontend Components Check
console.log('⚛️  STEP 8 — FRONTEND COMPONENTS VALIDATION');
const componentsDir = 'client/components';
const expectedComponents = [
  'ui',
  'landing',
  'dashboard'
];

let componentsScore = 0;
expectedComponents.forEach(component => {
  const exists = fs.existsSync(path.join(componentsDir, component));
  console.log(`${exists ? '✅' : '❌'} ${component}`);
  if (exists) componentsScore++;
});

console.log(`Components Score: ${componentsScore}/${expectedComponents.length}\n`);

// FINAL SCORE CALCULATION
console.log('📊 FINAL AUDIT SCORE');
console.log('===================');

const totalPossible = 8;
const scores = [
  structureScore / requiredDirs.length,
  serverDepScore / requiredServerDeps.length,
  clientDepScore / requiredClientDeps.length,
  routesScore / expectedRoutes.length,
  controllersScore / expectedControllers.length,
  servicesScore / expectedServices.length,
  componentsScore / expectedComponents.length
];

const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length * 10;

console.log(`Overall Project Readiness: ${averageScore.toFixed(1)}/10`);

if (averageScore >= 8) {
  console.log('🎉 EXCELLENT: Project is production-ready!');
} else if (averageScore >= 6) {
  console.log('✅ GOOD: Project is mostly ready with minor issues');
} else if (averageScore >= 4) {
  console.log('⚠️  FAIR: Project needs significant work before production');
} else {
  console.log('❌ POOR: Project requires major development work');
}

console.log('\n📋 RECOMMENDATIONS:');
if (!fs.existsSync(envFile)) {
  console.log('- Create and configure server/.env file');
}
if (structureScore < requiredDirs.length) {
  console.log('- Fix missing directory structure');
}
if (serverDepScore < requiredServerDeps.length) {
  console.log('- Install missing server dependencies');
}
if (clientDepScore < requiredClientDeps.length) {
  console.log('- Install missing client dependencies');
}

console.log('\n🔧 NEXT STEPS:');
console.log('1. Set up local PostgreSQL database');
console.log('2. Configure environment variables');
console.log('3. Test database connection');
console.log('4. Start development servers');
console.log('5. Run end-to-end tests');
