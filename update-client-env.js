const fs = require('fs');
const path = require('path');

console.log('🔧 Updating frontend environment...\n');

const envLocalPath = path.join(__dirname, 'client', '.env.local');

const envContent = `# Base URL of the backend API server
# Development: http://localhost:5000
# Production:  https://api.yourdomain.com
NEXT_PUBLIC_API_URL=http://localhost:5000
`;

try {
  fs.writeFileSync(envLocalPath, envContent);
  console.log('✅ Updated client/.env.local');
  console.log('🌐 Frontend will connect to backend at: http://localhost:5000');
} catch (error) {
  console.log('❌ Error updating client environment:', error.message);
}

console.log('\n📱 Frontend is running on: http://localhost:3002');
console.log('🔧 Backend needs database connection to start on port 5000');
