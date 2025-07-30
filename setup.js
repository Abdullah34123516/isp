#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up ISP Management Platform...');

try {
  // Check if .env file exists
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.log('📝 Creating .env file...');
    fs.writeFileSync(envPath, `DATABASE_URL="file:./dev.db"\nNEXTAUTH_SECRET="your-secret-key-here"\nNEXTAUTH_URL="http://localhost:3000"`);
    console.log('✅ .env file created');
  }

  // Run database push
  console.log('🗄️  Setting up database...');
  execSync('npm run db:push', { stdio: 'inherit' });
  
  // Run database seeding
  console.log('🌱 Seeding database...');
  execSync('npm run db:seed', { stdio: 'inherit' });

  console.log('🎉 Setup completed successfully!');
  console.log('');
  console.log('📋 Default Login Credentials:');
  console.log('   Email: admin@isp.com');
  console.log('   Password: password');
  console.log('   Role: SUPER_ADMIN');
  console.log('');
  console.log('📄 Environment Configuration:');
  console.log('   .env file created with basic configuration');
  console.log('   See .env.example for all available options');
  console.log('');
  console.log('🚀 You can now start the application with: npm run dev');

} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}