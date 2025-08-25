import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Generate realistic dashboard statistics
const generateDashboardStats = async () => {
  try {
    console.log('🌱 Generating dashboard statistics...');
    
    // Get existing tenants
    const tenants = await prisma.tenant.findMany();
    
    if (tenants.length === 0) {
      console.log('❌ No tenants found. Please seed tenants first.');
      return;
    }
    
    for (const tenant of tenants) {
      console.log(`📊 Generating stats for tenant: ${tenant.name}`);
      
      // Create additional users for this tenant to make stats more realistic
      const existingUsers = await prisma.user.count({ where: { tenantId: tenant.id } });
      const targetUsers = 15 + Math.floor(Math.random() * 20); // 15-35 users per tenant
      
      if (existingUsers < targetUsers) {
        const usersToCreate = targetUsers - existingUsers;
        
        for (let i = 0; i < usersToCreate; i++) {
          await prisma.user.create({
            data: {
              email: `user-${existingUsers + i + 1}@${tenant.slug}.com`,
              name: `User ${existingUsers + i + 1}`,
              password: '$2b$10$dummy.hash.for.testing',
              tenantId: tenant.id,
              isActive: Math.random() > 0.1, // 90% active users
              lastLogin: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null, // 70% have logged in recently
              createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000) // Random date in last 90 days
            }
          });
        }
      }
      
      // Create roles for this tenant
      const existingRoles = await prisma.role.count({ where: { tenantId: tenant.id } });
      if (existingRoles === 0) {
        const roles = [
          { name: 'Admin', description: 'Full access to all features', isDefault: false },
          { name: 'Manager', description: 'Can manage users and view reports', isDefault: false },
          { name: 'User', description: 'Standard user access', isDefault: true },
          { name: 'Viewer', description: 'Read-only access', isDefault: false },
          { name: 'Guest', description: 'Limited access', isDefault: false }
        ];
        
        for (const roleData of roles) {
          await prisma.role.create({
            data: {
              ...roleData,
              tenantId: tenant.id,
              isActive: true
            }
          });
        }
      }
      
      // Create additional audit logs for activity tracking
      const existingAuditLogs = await prisma.auditLog.count({ where: { tenantId: tenant.id } });
      const targetAuditLogs = 100 + Math.floor(Math.random() * 200); // 100-300 audit logs
      
      if (existingAuditLogs < targetAuditLogs) {
        const logsToCreate = targetAuditLogs - existingAuditLogs;
        const actions = [
          'user.login', 'user.logout', 'user.create', 'user.update', 'user.delete',
          'role.create', 'role.update', 'role.delete', 'permission.assign',
          'data.view', 'data.create', 'data.update', 'data.delete',
          'report.generate', 'report.export', 'settings.update',
          'audit.view', 'notification.send', 'backup.create', 'backup.restore'
        ];
        
        for (let i = 0; i < logsToCreate; i++) {
          const action = actions[Math.floor(Math.random() * actions.length)];
          const date = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Random date in last 30 days
          
          await prisma.auditLog.create({
            data: {
              action,
              details: JSON.stringify({
                description: `Sample audit log for ${action}`,
                userId: `user-${Math.floor(Math.random() * 10) + 1}`,
                timestamp: date.toISOString(),
                resource: `resource-${Math.floor(Math.random() * 5) + 1}`
              }),
              ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
              userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              tenantId: tenant.id,
              createdAt: date
            }
          });
        }
      }
      
      // Create notifications for this tenant
      const existingNotifications = await prisma.notification.count({ where: { targetTenantId: tenant.id } });
      const targetNotifications = 20 + Math.floor(Math.random() * 30); // 20-50 notifications
      
      if (existingNotifications < targetNotifications) {
        const notificationsToCreate = targetNotifications - existingNotifications;
        const notificationTypes = ['info', 'success', 'warning', 'error'];
        const notificationTitles = [
          'System Maintenance Scheduled',
          'New Feature Available',
          'Security Update Required',
          'Backup Completed',
          'User Account Created',
          'Report Generated',
          'Data Export Ready',
          'Permission Updated'
        ];
        
        for (let i = 0; i < notificationsToCreate; i++) {
          const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
          const title = notificationTitles[Math.floor(Math.random() * notificationTitles.length)];
          const date = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Random date in last 7 days
          
          const notification = await prisma.notification.create({
            data: {
              title,
              message: `This is a sample notification for ${title.toLowerCase()}`,
              type,
              targetTenantId: tenant.id,
              targetType: 'tenant',
              status: 'sent',
              sentAt: date,
              createdAt: date
            }
          });
          
          // Create user notifications for some users
          const users = await prisma.user.findMany({ where: { tenantId: tenant.id }, take: 5 });
          for (const user of users) {
            if (Math.random() > 0.5) { // 50% chance to create user notification
              await prisma.userNotification.create({
                data: {
                  notificationId: notification.id,
                  userId: user.id,
                  tenantId: tenant.id,
                  isRead: Math.random() > 0.3, // 70% read
                  readAt: Math.random() > 0.3 ? new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000) : null
                }
              });
            }
          }
        }
      }
      
      console.log(`✅ Generated stats for tenant: ${tenant.name}`);
    }
    
    // Print summary statistics
    const totalUsers = await prisma.user.count();
    const totalRoles = await prisma.role.count();
    const totalAuditLogs = await prisma.auditLog.count();
    const totalNotifications = await prisma.notification.count();
    const totalSupportTickets = await prisma.supportTicket.count();
    
    console.log('\n📊 Dashboard Statistics Summary:');
    console.log(`  - Total Users: ${totalUsers}`);
    console.log(`  - Total Roles: ${totalRoles}`);
    console.log(`  - Total Audit Logs: ${totalAuditLogs}`);
    console.log(`  - Total Notifications: ${totalNotifications}`);
    console.log(`  - Total Support Tickets: ${totalSupportTickets}`);
    
    console.log('\n✅ Dashboard statistics generated successfully!');
    
  } catch (error) {
    console.error('❌ Error generating dashboard statistics:', error);
  } finally {
    await prisma.$disconnect();
  }
};

// Run the function
generateDashboardStats();
