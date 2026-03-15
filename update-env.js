const fs = require('fs');
const path = require('path');

console.log('🔧 Updating database connection...\n');

// Read the render example file
const renderExamplePath = path.join(__dirname, 'server', '.env.render.example');
const envPath = path.join(__dirname, 'server', '.env');

try {
  const renderExample = fs.readFileSync(renderExamplePath, 'utf8');
  const currentEnv = fs.readFileSync(envPath, 'utf8');
  
  // Extract the DATABASE_URL from render example
  const dbUrlMatch = renderExample.match(/DATABASE_URL=(.+)/);
  if (dbUrlMatch) {
    const newDbUrl = dbUrlMatch[1];
    console.log('Found DATABASE_URL:', newDbUrl);
    
    // Update the .env file
    const updatedEnv = currentEnv.replace(
      /DATABASE_URL=.+/,
      `DATABASE_URL=${newDbUrl}`
    );
    
    fs.writeFileSync(envPath, updatedEnv);
    console.log('✅ Updated server/.env with your Supabase connection string');
    
  } else {
    console.log('❌ DATABASE_URL not found in render example file');
  }
} catch (error) {
  console.log('❌ Error updating environment:', error.message);
  console.log('\nPlease manually update server/.env with:');
  console.log('DATABASE_URL=postgresql://postgres:Satyam0408()@db.dofqdvocepggeifwhhal.supabase.co:5432/postgres');
}

console.log('\n🚀 Now run: npm run dev');
