#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { seedDatabase } from '../src/lib/seed';

async function setupDatabase() {
  console.log('🚀 Setting up database...');

  try {
    // Generate Prisma client
    console.log('📦 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    // Run database migrations
    console.log('🔄 Running database migrations...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });

    // Seed the database
    console.log('🌱 Seeding database...');
    await seedDatabase();

    console.log('✅ Database setup completed successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Access SuperAdmin at: http://localhost:3000/superadmin/login');
    console.log('3. Login with: admin@superadmin.com / admin123');
    console.log('');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase(); 