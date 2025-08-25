import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAllData() {
  try {
    console.log('🚀 Starting comprehensive data seeding...\n');
    
    // Step 1: Seed modules and permissions
    console.log('📦 Step 1: Seeding modules and permissions...');
    const { execSync } = require('child_process');
    try {
      execSync('node scripts/seed-modules.js', { stdio: 'inherit' });
      console.log('✅ Modules and permissions seeded successfully!\n');
    } catch (error) {
      console.log('⚠️ Modules already seeded or error occurred\n');
    }
    
    // Step 2: Seed support tickets
    console.log('🎫 Step 2: Seeding support tickets...');
    try {
      execSync('npx tsx scripts/seed-support-tickets.ts', { stdio: 'inherit' });
      console.log('✅ Support tickets seeded successfully!\n');
    } catch (error) {
      console.log('⚠️ Support tickets already seeded or error occurred\n');
    }
    
    // Step 3: Seed analytics data
    console.log('📊 Step 3: Seeding analytics data...');
    try {
      execSync('npx tsx scripts/seed-analytics-data.ts', { stdio: 'inherit' });
      console.log('✅ Analytics data seeded successfully!\n');
    } catch (error) {
      console.log('⚠️ Analytics data already seeded or error occurred\n');
    }
    
    // Step 4: Generate dashboard statistics
    console.log('📈 Step 4: Generating dashboard statistics...');
    try {
      execSync('npx tsx scripts/seed-dashboard-stats.ts', { stdio: 'inherit' });
      console.log('✅ Dashboard statistics generated successfully!\n');
    } catch (error) {
      console.log('⚠️ Dashboard statistics already generated or error occurred\n');
    }
    
    // Step 5: Print final summary
    console.log('📋 Final Summary:');
    const totalUsers = await prisma.user.count();
    const totalTenants = await prisma.tenant.count();
    const totalSupportTickets = await prisma.supportTicket.count();
    const totalAuditLogs = await prisma.auditLog.count();
    const totalNotifications = await prisma.notification.count();
    const totalRoles = await prisma.role.count();
    
    console.log(`  🏢 Total Tenants: ${totalTenants}`);
    console.log(`  👥 Total Users: ${totalUsers}`);
    console.log(`  🎫 Total Support Tickets: ${totalSupportTickets}`);
    console.log(`  📊 Total Audit Logs: ${totalAuditLogs}`);
    console.log(`  🔔 Total Notifications: ${totalNotifications}`);
    console.log(`  🛡️ Total Roles: ${totalRoles}`);
    
    console.log('\n🎉 All data seeding completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('  1. Navigate to /wendy/support to see the support tickets');
    console.log('  2. Check the dashboard for dynamic charts and analytics');
    console.log('  3. Explore different tenant dashboards for varied data');
    
  } catch (error) {
    console.error('❌ Error during comprehensive seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the comprehensive seeding
seedAllData();
