const fs = require('fs');
const path = require('path');

console.log('🔍 DevOps Environment Configuration Audit\n');
console.log('='.repeat(60));

// Audit configuration
const audit = {
  backend: {
    file: 'server/.env',
    required: [
      'DATABASE_URL',
      'JWT_SECRET', 
      'JWT_REFRESH_SECRET',
      'PORT',
      'NODE_ENV',
      'CORS_ORIGIN'
    ],
    optional: [
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_USER',
      'SMTP_PASS',
      'EMAIL_FROM'
    ],
    validation: {
      DATABASE_URL: (value) => {
        if (!value) return { valid: false, error: 'DATABASE_URL is required for Supabase' };
        
        const supabasePattern = /^postgresql:\/\/postgres:[^@]+@[^:]+:[0-9]+\/.+$/;
        if (!supabasePattern.test(value)) {
          return { 
            valid: false, 
            error: 'Invalid DATABASE_URL format. Expected: postgresql://postgres:password@host:port/database' 
          };
        }
        
        return { valid: true };
      },
      JWT_SECRET: (value) => {
        if (!value || value.length < 32) {
          return { valid: false, error: 'JWT_SECRET must be at least 32 characters' };
        }
        if (value.includes('replace_with') || value.includes('your_')) {
          return { valid: false, error: 'JWT_SECRET appears to be placeholder' };
        }
        return { valid: true };
      },
      JWT_REFRESH_SECRET: (value) => {
        if (!value || value.length < 32) {
          return { valid: false, error: 'JWT_REFRESH_SECRET must be at least 32 characters' };
        }
        if (value.includes('replace_with') || value.includes('your_')) {
          return { valid: false, error: 'JWT_REFRESH_SECRET appears to be placeholder' };
        }
        return { valid: true };
      },
      PORT: (value) => {
        const port = parseInt(value);
        if (isNaN(port) || port < 1 || port > 65535) {
          return { valid: false, error: 'PORT must be a valid port number (1-65535)' };
        }
        return { valid: true };
      },
      STRIPE_SECRET_KEY: (value) => {
        if (!value) return { valid: true, warning: 'Stripe not configured' };
        if (!value.startsWith('sk_')) {
          return { valid: false, error: 'STRIPE_SECRET_KEY must start with sk_' };
        }
        return { valid: true };
      },
      SMTP_HOST: (value) => {
        if (!value) return { valid: true, warning: 'Email not configured' };
        return { valid: true };
      }
    }
  },
  frontend: {
    file: 'client/.env.local',
    required: [
      'NEXT_PUBLIC_API_URL'
    ],
    optional: [
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
    ],
    validation: {
      NEXT_PUBLIC_API_URL: (value) => {
        if (!value) return { valid: false, error: 'NEXT_PUBLIC_API_URL is required' };
        
        const urlPattern = /^https?:\/\/[^:]+:[0-9]+$/;
        if (!urlPattern.test(value)) {
          return { 
            valid: false, 
            error: 'NEXT_PUBLIC_API_URL must be a valid URL with port (e.g., http://localhost:5000)' 
          };
        }
        return { valid: true };
      }
    }
  }
};

// Read environment files
function readEnvFile(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
      return { exists: false, vars: {} };
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    const vars = {};
    
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          vars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    return { exists: true, vars };
  } catch (error) {
    return { exists: false, error: error.message };
  }
}

// Perform audit
function performAudit() {
  let totalIssues = 0;
  let totalWarnings = 0;
  
  Object.entries(audit).forEach(([service, config]) => {
    console.log(`\n📁 ${service.toUpperCase()} ENVIRONMENT AUDIT`);
    console.log('-'.repeat(40));
    
    const envData = readEnvFile(config.file);
    
    if (!envData.exists) {
      console.log(`❌ File not found: ${config.file}`);
      console.log(`   Copy ${config.file}.example to ${config.file}`);
      totalIssues++;
      return;
    }
    
    console.log(`✅ File exists: ${config.file}`);
    
    // Check required variables
    console.log('\n🔒 Required Variables:');
    config.required.forEach(varName => {
      const value = envData.vars[varName];
      const validator = config.validation[varName];
      
      if (!value) {
        console.log(`❌ ${varName}: Missing`);
        totalIssues++;
      } else if (validator) {
        const result = validator(value);
        if (!result.valid) {
          console.log(`❌ ${varName}: ${result.error}`);
          totalIssues++;
        } else {
          console.log(`✅ ${varName}: Valid`);
        }
      } else {
        console.log(`✅ ${varName}: Present`);
      }
    });
    
    // Check optional variables
    console.log('\n⚙️  Optional Variables:');
    config.optional.forEach(varName => {
      const value = envData.vars[varName];
      const validator = config.validation[varName];
      
      if (!value) {
        console.log(`⚠️  ${varName}: Not set (optional)`);
        totalWarnings++;
      } else if (validator) {
        const result = validator(value);
        if (!result.valid) {
          console.log(`❌ ${varName}: ${result.error}`);
          totalIssues++;
        } else {
          console.log(`✅ ${varName}: Valid${result.warning ? ` (${result.warning})` : ''}`);
        }
      } else {
        console.log(`✅ ${varName}: Present`);
      }
    });
    
    // Check for unexpected variables
    const expectedVars = [...config.required, ...config.optional];
    const unexpectedVars = Object.keys(envData.vars).filter(v => !expectedVars.includes(v));
    
    if (unexpectedVars.length > 0) {
      console.log('\n🔍 Unexpected Variables:');
      unexpectedVars.forEach(varName => {
        console.log(`ℹ️  ${varName}: ${envData.vars[varName]}`);
      });
    }
  });
  
  // Cross-service validation
  console.log('\n🔗 CROSS-SERVICE VALIDATION');
  console.log('-'.repeat(40));
  
  const backendEnv = readEnvFile('server/.env');
  const frontendEnv = readEnvFile('client/.env.local');
  
  if (backendEnv.exists && frontendEnv.exists) {
    const backendPort = backendEnv.vars.PORT || '5000';
    const frontendApiUrl = frontendEnv.vars.NEXT_PUBLIC_API_URL;
    
    if (frontendApiUrl) {
      const expectedUrl = `http://localhost:${backendPort}`;
      if (frontendApiUrl !== expectedUrl) {
        console.log(`⚠️  Frontend API URL mismatch`);
        console.log(`   Expected: ${expectedUrl}`);
        console.log(`   Actual:   ${frontendApiUrl}`);
        totalWarnings++;
      } else {
        console.log(`✅ Frontend/Backend URLs aligned`);
      }
    }
    
    const backendCors = backendEnv.vars.CORS_ORIGIN;
    if (backendCors && frontendApiUrl) {
      if (backendCors !== frontendApiUrl) {
        console.log(`⚠️  CORS_ORIGIN mismatch with frontend URL`);
        console.log(`   Backend CORS: ${backendCors}`);
        console.log(`   Frontend URL:  ${frontendApiUrl}`);
        totalWarnings++;
      } else {
        console.log(`✅ CORS configuration aligned`);
      }
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 AUDIT SUMMARY');
  console.log('='.repeat(60));
  
  if (totalIssues === 0 && totalWarnings === 0) {
    console.log('🎉 All environment variables are correctly configured!');
  } else {
    console.log(`❌ Issues found: ${totalIssues}`);
    console.log(`⚠️  Warnings: ${totalWarnings}`);
    
    if (totalIssues > 0) {
      console.log('\n🔧 REQUIRED FIXES:');
      console.log('1. Address all ❌ issues before starting the application');
      console.log('2. Ensure DATABASE_URL is correctly formatted for Supabase');
      console.log('3. Generate secure JWT secrets (32+ characters each)');
    }
    
    if (totalWarnings > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      console.log('1. Configure optional services (Stripe, Email) for full functionality');
      console.log('2. Align frontend/backend URLs for proper CORS');
    }
  }
  
  console.log('\n🚀 Next Steps:');
  console.log('1. Fix any issues identified above');
  console.log('2. Test database connection: cd server && npm run dev');
  console.log('3. Start frontend: cd client && npm run dev');
}

// Run audit
performAudit().catch(console.error);
