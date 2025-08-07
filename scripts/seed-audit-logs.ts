import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '../src/lib/audit';

const prisma = new PrismaClient();

const sampleActions = [
  'tenant.create',
  'tenant.update',
  'tenant.suspend',
  'tenant.activate',
  'user.create',
  'user.update',
  'user.delete',
  'user.login',
  'user.logout',
  'user.password_reset',
  'role.create',
  'role.update',
  'role.delete',
  'permission.update',
  'system.settings',
  'audit.export'
];

const sampleUserAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
];

const sampleIPs = [
  '192.168.1.100',
  '203.0.113.45',
  '198.51.100.23',
  '203.0.113.67',
  '203.0.113.89',
  '198.51.100.45',
  '10.0.0.1',
  '172.16.0.1'
];

async function seedAuditLogs() {
  console.log('🌱 Seeding audit logs...');

  try {
    // Get existing data
    const superAdmins = await prisma.superAdmin.findMany();
    const tenants = await prisma.tenant.findMany();
    const users = await prisma.user.findMany();

    if (superAdmins.length === 0 || tenants.length === 0) {
      console.log('❌ No super admins or tenants found. Please run the main seed script first.');
      return;
    }

    // Generate audit logs for the last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const auditLogs = [];

    for (let i = 0; i < 200; i++) {
      const timestamp = new Date(
        thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime())
      );

      const action = sampleActions[Math.floor(Math.random() * sampleActions.length)];
      const userAgent = sampleUserAgents[Math.floor(Math.random() * sampleUserAgents.length)];
      const ipAddress = sampleIPs[Math.floor(Math.random() * sampleIPs.length)];

      // Determine actor and target
      const isSuperAdminAction = Math.random() < 0.3; // 30% chance of super admin action
      const actor = isSuperAdminAction 
        ? superAdmins[Math.floor(Math.random() * superAdmins.length)]
        : users[Math.floor(Math.random() * users.length)];

      const tenant = tenants[Math.floor(Math.random() * tenants.length)];

      // Generate details based on action
      let details = null;
      if (action.includes('tenant.create')) {
        details = {
          tenantName: `New Tenant ${Math.random().toString(36).substring(7)}`,
          plan: ['starter', 'professional', 'enterprise'][Math.floor(Math.random() * 3)],
          region: ['US East', 'US West', 'EU', 'Asia'][Math.floor(Math.random() * 4)]
        };
      } else if (action.includes('tenant.update')) {
        details = {
          before: { plan: 'starter', isActive: true },
          after: { plan: 'professional', isActive: true }
        };
      } else if (action.includes('user.create')) {
        details = {
          userEmail: `user${Math.random().toString(36).substring(7)}@example.com`,
          role: ['admin', 'user', 'viewer'][Math.floor(Math.random() * 3)]
        };
      } else if (action.includes('user.update')) {
        details = {
          before: { role: 'user', isActive: true },
          after: { role: 'admin', isActive: true }
        };
      } else if (action.includes('user.login')) {
        details = {
          success: Math.random() > 0.1, // 90% success rate
          failedAttempts: Math.random() > 0.9 ? Math.floor(Math.random() * 3) + 1 : 0
        };
      }

      const auditLog = {
        action,
        details: details, // Store as object directly, Prisma will handle JSON serialization
        ipAddress,
        userAgent,
        createdAt: timestamp,
        tenantId: tenant.id,
        userId: isSuperAdminAction ? null : actor.id,
        superAdminId: isSuperAdminAction ? actor.id : null,
      };

      auditLogs.push(auditLog);
    }

    // Insert audit logs in batches
    const batchSize = 50;
    for (let i = 0; i < auditLogs.length; i += batchSize) {
      const batch = auditLogs.slice(i, i + batchSize);
      await prisma.auditLog.createMany({
        data: batch,
        skipDuplicates: true
      });
      console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(auditLogs.length / batchSize)}`);
    }

    console.log(`🎉 Successfully seeded ${auditLogs.length} audit logs`);

  } catch (error) {
    console.error('❌ Error seeding audit logs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedAuditLogs()
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  }); 