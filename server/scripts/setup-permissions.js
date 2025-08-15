#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Setting up Permissions System Database Schema...\n');

async function setupPermissions() {
  try {
    // Step 1: Generate Prisma client
    console.log('1. Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated\n');

    // Step 2: Run database migrations
    console.log('2. Running database migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('✅ Database migrations completed\n');

    // Step 3: Seed the database
    console.log('3. Seeding database with test data...');
    execSync('npx prisma db seed', { stdio: 'inherit' });
    console.log('✅ Database seeding completed\n');

    // Step 4: Validate schema
    console.log('4. Validating schema implementation...');
    const { validateSchema } = require('../test-schema-validation.js');
    await validateSchema();
    console.log('✅ Schema validation completed\n');

    console.log('🎉 Permissions System Setup Completed Successfully!');
    console.log('\n📋 What was implemented:');
    console.log('✅ Database schema with all required permission fields');
    console.log('✅ Performance indexes for optimized queries');
    console.log('✅ Foreign key constraints for data integrity');
    console.log('✅ Test data with roles, permissions, and users');
    console.log('✅ Multi-tenant support with proper isolation');
    console.log('✅ Role-based access control (RBAC) system');
    console.log('✅ Support ticket system');
    console.log('✅ Audit logging system');
    console.log('✅ Device and token management');

    console.log('\n🔑 Test Credentials:');
    console.log('Superadmin: superadmin@example.com / password123');
    console.log('Tenant A Admin: admin@tenant-a.com / password123');
    console.log('Tenant B Admin: admin@tenant-b.com / password123');
    console.log('Tenant A User: john@tenant-a.com / password123');
    console.log('Tenant B User: bob@tenant-b.com / password123');

    console.log('\n📊 Database Tables Created:');
    console.log('- users (with is_superadmin field)');
    console.log('- tenants (multi-tenant support)');
    console.log('- roles (global and tenant-specific)');
    console.log('- modules (system modules)');
    console.log('- submodules (module sub-components)');
    console.log('- user_roles (user-role assignments)');
    console.log('- role_permissions (granular permissions)');
    console.log('- support_tickets (support system)');
    console.log('- support_replies (ticket responses)');
    console.log('- audit_logs (activity tracking)');
    console.log('- refresh_tokens (session management)');
    console.log('- reset_tokens (password reset)');
    console.log('- login_devices (device tracking)');

    console.log('\n🔧 Next Steps:');
    console.log('1. Start your server: npm run dev');
    console.log('2. Test the API endpoints');
    console.log('3. Verify permissions work correctly');
    console.log('4. Check audit logs for activity tracking');
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure MySQL database is running');
    console.log('2. Check DATABASE_URL in .env file');
    console.log('3. Verify database connection');
    console.log('4. Check for any migration conflicts');
    process.exit(1);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupPermissions();
}

module.exports = { setupPermissions };
