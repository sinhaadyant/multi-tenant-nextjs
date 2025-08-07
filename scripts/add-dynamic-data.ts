import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/jwt';

const prisma = new PrismaClient();

async function addDynamicData() {
  console.log('🚀 Adding dynamic data to database...');

  try {
    // Get existing tenants
    const existingTenants = await prisma.tenant.findMany();
    
    if (existingTenants.length === 0) {
      console.log('❌ No tenants found. Please run the setup script first.');
      return;
    }

    // Add more users with different creation dates for better chart data
    const userData = [
      { email: 'john.doe@techcorp.com', name: 'John Doe', tenantSlug: 'techcorp', daysAgo: 25 },
      { email: 'jane.smith@techcorp.com', name: 'Jane Smith', tenantSlug: 'techcorp', daysAgo: 20 },
      { email: 'mike.johnson@techcorp.com', name: 'Mike Johnson', tenantSlug: 'techcorp', daysAgo: 15 },
      { email: 'sarah.wilson@global-innovations.com', name: 'Sarah Wilson', tenantSlug: 'global-innovations', daysAgo: 12 },
      { email: 'david.brown@global-innovations.com', name: 'David Brown', tenantSlug: 'global-innovations', daysAgo: 8 },
      { email: 'emma.davis@dataflow.com', name: 'Emma Davis', tenantSlug: 'dataflow', daysAgo: 5 },
      { email: 'alex.taylor@dataflow.com', name: 'Alex Taylor', tenantSlug: 'dataflow', daysAgo: 3 },
      { email: 'lisa.anderson@cloudtech.com', name: 'Lisa Anderson', tenantSlug: 'cloudtech', daysAgo: 2 },
      { email: 'tom.martinez@digital-dynamics.com', name: 'Tom Martinez', tenantSlug: 'digital-dynamics', daysAgo: 1 },
      { email: 'anna.garcia@digital-dynamics.com', name: 'Anna Garcia', tenantSlug: 'digital-dynamics', hoursAgo: 12 },
      { email: 'robert.lee@techcorp.com', name: 'Robert Lee', tenantSlug: 'techcorp', daysAgo: 18 },
      { email: 'maria.gonzalez@global-innovations.com', name: 'Maria Gonzalez', tenantSlug: 'global-innovations', daysAgo: 10 },
      { email: 'james.wilson@dataflow.com', name: 'James Wilson', tenantSlug: 'dataflow', daysAgo: 6 },
      { email: 'sophia.chen@cloudtech.com', name: 'Sophia Chen', tenantSlug: 'cloudtech', daysAgo: 4 },
      { email: 'daniel.kim@digital-dynamics.com', name: 'Daniel Kim', tenantSlug: 'digital-dynamics', hoursAgo: 6 }
    ];

    for (const userInfo of userData) {
      const tenant = existingTenants.find(t => t.slug === userInfo.tenantSlug);
      if (tenant) {
        const existingUser = await prisma.user.findFirst({
          where: { email: userInfo.email, tenantId: tenant.id }
        });

        if (!existingUser) {
          const createdAt = userInfo.hoursAgo 
            ? new Date(Date.now() - userInfo.hoursAgo * 60 * 60 * 1000)
            : new Date(Date.now() - userInfo.daysAgo * 24 * 60 * 60 * 1000);

          const userPassword = await hashPassword('user123');
          await prisma.user.create({
            data: {
              email: userInfo.email,
              name: userInfo.name,
              password: userPassword,
              tenantId: tenant.id,
              createdAt,
              lastLogin: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) // Random last login
            }
          });
          console.log(`✅ Created user: ${userInfo.name}`);
        }
      }
    }

    // Add more audit logs with different timestamps
    const auditLogData = [
      { action: 'user.login', tenantSlug: 'techcorp', hoursAgo: 1 },
      { action: 'user.create', tenantSlug: 'dataflow', hoursAgo: 2 },
      { action: 'tenant.update', tenantSlug: 'global-innovations', hoursAgo: 3 },
      { action: 'user.login', tenantSlug: 'cloudtech', hoursAgo: 4 },
      { action: 'system.backup', hoursAgo: 6 },
      { action: 'user.update', tenantSlug: 'techcorp', hoursAgo: 8 },
      { action: 'tenant.create', tenantSlug: 'cloudtech', daysAgo: 1 },
      { action: 'user.login', tenantSlug: 'global-innovations', daysAgo: 2 },
      { action: 'system.maintenance', daysAgo: 3 },
      { action: 'user.delete', tenantSlug: 'dataflow', daysAgo: 4 },
      { action: 'role.create', daysAgo: 5 },
      { action: 'permission.update', daysAgo: 6 },
      { action: 'user.login', tenantSlug: 'digital-dynamics', hoursAgo: 12 },
      { action: 'tenant.suspend', tenantSlug: 'cloudtech', hoursAgo: 18 },
      { action: 'user.password_reset', tenantSlug: 'techcorp', hoursAgo: 20 },
      { action: 'system.alert', hoursAgo: 22 },
      { action: 'user.login', tenantSlug: 'global-innovations', hoursAgo: 24 },
      { action: 'audit.log_export', daysAgo: 1 },
      { action: 'security.scan', daysAgo: 2 },
      { action: 'backup.restore', daysAgo: 3 }
    ];

    for (const logInfo of auditLogData) {
      const tenant = logInfo.tenantSlug ? existingTenants.find(t => t.slug === logInfo.tenantSlug) : null;
      const user = tenant ? await prisma.user.findFirst({ where: { tenantId: tenant.id } }) : null;
      const superAdmin = await prisma.superAdmin.findFirst();

      const createdAt = logInfo.hoursAgo 
        ? new Date(Date.now() - logInfo.hoursAgo * 60 * 60 * 1000)
        : new Date(Date.now() - logInfo.daysAgo * 24 * 60 * 60 * 1000);

      await prisma.auditLog.create({
        data: {
          action: logInfo.action,
          details: { 
            description: `Sample audit log for ${logInfo.action}`,
            timestamp: createdAt.toISOString(),
            source: 'dashboard-test'
          },
          ipAddress: '192.168.1.' + Math.floor(Math.random() * 255),
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          tenantId: tenant?.id,
          userId: user?.id,
          superAdminId: superAdmin?.id,
          createdAt
        }
      });
    }

    console.log('✅ Added dynamic audit logs');

    // Update some users with recent lastLogin for active sessions
    const usersToUpdate = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    for (const user of usersToUpdate) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLogin: new Date(Date.now() - Math.random() * 30 * 60 * 1000) // Last 30 minutes
        }
      });
    }

    console.log('✅ Updated user last login times');

    // Add some system logs
    const systemLogs = [
      { level: 'info', message: 'Database backup completed successfully' },
      { level: 'info', message: 'User authentication successful' },
      { level: 'warning', message: 'High CPU usage detected' },
      { level: 'info', message: 'New tenant registration' },
      { level: 'error', message: 'Failed login attempt from suspicious IP' },
      { level: 'info', message: 'System maintenance completed' },
      { level: 'warning', message: 'Memory usage above 80%' },
      { level: 'info', message: 'Audit log rotation completed' }
    ];

    for (const log of systemLogs) {
      await prisma.systemLog.create({
        data: {
          level: log.level,
          message: log.message,
          details: {
            timestamp: new Date().toISOString(),
            component: 'dashboard-system'
          },
          createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
        }
      });
    }

    console.log('✅ Added system logs');

    console.log('🎉 Dynamic data added successfully!');
    console.log('📊 Dashboard now has rich data for testing all features');

  } catch (error) {
    console.error('❌ Error adding dynamic data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addDynamicData()
  .then(() => {
    console.log('✅ Dynamic data script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Dynamic data script failed:', error);
    process.exit(1);
  }); 