const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing CORS Configuration Mismatch...\n');

// Read current frontend environment
const frontendEnvPath = path.join(__dirname, 'client', '.env.local');
const backendEnvPath = path.join(__dirname, 'server', '.env');

try {
  const frontendContent = fs.readFileSync(frontendEnvPath, 'utf8');
  const backendContent = fs.readFileSync(backendEnvPath, 'utf8');
  
  // Extract current values
  const frontendUrl = frontendContent.match(/NEXT_PUBLIC_API_URL=(.+)/)?.[1]?.trim();
  const backendCors = backendContent.match(/CORS_ORIGIN=(.+)/)?.[1]?.trim();
  const backendPort = backendContent.match(/PORT=(.+)/)?.[1]?.trim() || '5000';
  
  console.log('Current Configuration:');
  console.log(`Frontend NEXT_PUBLIC_API_URL: ${frontendUrl}`);
  console.log(`Backend CORS_ORIGIN: ${backendCors}`);
  console.log(`Backend PORT: ${backendPort}`);
  
  // Determine correct configuration
  const expectedFrontendUrl = `http://localhost:${backendPort}`;
  const expectedBackendCors = `http://localhost:3002`; // Frontend runs on 3002
  
  console.log('\nExpected Configuration:');
  console.log(`Frontend should point to: ${expectedFrontendUrl}`);
  console.log(`Backend CORS should allow: ${expectedBackendCors}`);
  
  // Fix frontend environment
  if (frontendUrl !== expectedFrontendUrl) {
    const updatedFrontend = frontendContent.replace(
      /NEXT_PUBLIC_API_URL=.+/,
      `NEXT_PUBLIC_API_URL=${expectedFrontendUrl}`
    );
    
    fs.writeFileSync(frontendEnvPath, updatedFrontend);
    console.log(`\n✅ Fixed frontend NEXT_PUBLIC_API_URL to: ${expectedFrontendUrl}`);
  }
  
  // Fix backend CORS
  if (backendCors !== expectedBackendCors) {
    const updatedBackend = backendContent.replace(
      /CORS_ORIGIN=.+/,
      `CORS_ORIGIN=${expectedBackendCors}`
    );
    
    fs.writeFileSync(backendEnvPath, updatedBackend);
    console.log(`✅ Fixed backend CORS_ORIGIN to: ${expectedBackendCors}`);
  }
  
  console.log('\n🎯 Configuration Summary:');
  console.log('• Frontend (Next.js) runs on: http://localhost:3002');
  console.log('• Backend (Express) runs on: http://localhost:5000');
  console.log('• Frontend calls backend at: http://localhost:5000');
  console.log('• Backend allows requests from: http://localhost:3002');
  
  console.log('\n✅ CORS configuration is now aligned!');
  
} catch (error) {
  console.error('❌ Error fixing CORS:', error.message);
}
