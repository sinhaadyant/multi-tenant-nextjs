import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedNotifications() {
  console.log('🌱 Seeding notifications...');

  try {
    // Get existing superadmins and tenants
    const superAdmins = await prisma.superAdmin.findMany({
      where: { isActive: true }
    });

    const tenants = await prisma.tenant.findMany({
      where: { isActive: true }
    });

    if (superAdmins.length === 0) {
      console.log('❌ No superadmins found. Please run the user seed script first.');
      return;
    }

    if (tenants.length === 0) {
      console.log('❌ No tenants found. Please run the tenant seed script first.');
      return;
    }

    const sampleNotifications = [
      // Superadmin notifications
      {
        title: 'System Maintenance Scheduled',
        message: 'Scheduled maintenance will occur on Saturday at 2 AM UTC. Expected downtime: 30 minutes.',
        targetType: 'superadmin',
        targetTenantId: null,
        createdBy: superAdmins[0].id,
        priority: 'medium',
        isRead: false,
        isActive: true
      },
      {
        title: 'New Feature Available',
        message: 'Advanced analytics dashboard is now available for all superadmins. Check out the new insights!',
        targetType: 'superadmin',
        targetTenantId: null,
        createdBy: superAdmins[0].id,
        priority: 'low',
        isRead: true,
        isActive: true
      },
      {
        title: 'Security Update Required',
        message: 'Please update your password and enable 2FA for enhanced security.',
        targetType: 'superadmin',
        targetTenantId: null,
        createdBy: superAdmins[0].id,
        priority: 'high',
        isRead: false,
        isActive: true
      },

      // All tenants notifications
      {
        title: 'Platform Update v2.1.0',
        message: 'New features including improved user management and enhanced reporting are now live!',
        targetType: 'all_tenants',
        targetTenantId: tenants[0].id,
        createdBy: superAdmins[0].id,
        priority: 'medium',
        isRead: false,
        isActive: true
      },
      {
        title: 'API Rate Limits Updated',
        message: 'API rate limits have been increased to 1000 requests per minute for all tenants.',
        targetType: 'all_tenants',
        targetTenantId: tenants[0].id,
        createdBy: superAdmins[0].id,
        priority: 'low',
        isRead: true,
        isActive: true
      },
      {
        title: 'Scheduled Maintenance Notice',
        message: 'Platform maintenance scheduled for Sunday 3 AM UTC. Minimal impact expected.',
        targetType: 'all_tenants',
        targetTenantId: tenants[0].id,
        createdBy: superAdmins[0].id,
        priority: 'medium',
        isRead: false,
        isActive: true
      },

      // Specific tenant notifications
      {
        title: 'Custom Integration Available',
        message: 'Your requested Slack integration is now ready for setup. Contact support for assistance.',
        targetType: 'specific_tenants',
        targetTenantId: tenants[0].id,
        createdBy: superAdmins[0].id,
        priority: 'medium',
        isRead: false,
        isActive: true
      },
      {
        title: 'Usage Limit Approaching',
        message: 'You are approaching your monthly user limit. Consider upgrading your plan.',
        targetType: 'specific_tenants',
        targetTenantId: tenants[1]?.id || tenants[0].id,
        createdBy: superAdmins[0].id,
        priority: 'high',
        isRead: false,
        isActive: true
      },
      {
        title: 'Welcome to the Platform!',
        message: 'Thank you for joining us. Here are some tips to get started with your new account.',
        targetType: 'specific_tenants',
        targetTenantId: tenants[2]?.id || tenants[0].id,
        createdBy: superAdmins[0].id,
        priority: 'low',
        isRead: true,
        isActive: true
      },
      {
        title: 'Payment Method Updated',
        message: 'Your payment method has been successfully updated. Your next billing cycle will use the new method.',
        targetType: 'specific_tenants',
        targetTenantId: tenants[3]?.id || tenants[0].id,
        createdBy: superAdmins[0].id,
        priority: 'medium',
        isRead: false,
        isActive: true
      }
    ];

    // Create notifications
    const createdNotifications = [];
    for (const notificationData of sampleNotifications) {
      try {
        const notification = await prisma.notification.create({
          data: notificationData
        });
        createdNotifications.push(notification);
        console.log(`✅ Created notification: ${notification.title}`);
      } catch (error) {
        console.error(`❌ Failed to create notification: ${notificationData.title}`, error);
      }
    }

    console.log(`🎉 Successfully created ${createdNotifications.length} notifications`);
    console.log(`📊 Summary:`);
    console.log(`   - Superadmin notifications: ${createdNotifications.filter(n => n.targetType === 'superadmin').length}`);
    console.log(`   - All tenants notifications: ${createdNotifications.filter(n => n.targetType === 'all_tenants').length}`);
    console.log(`   - Specific tenant notifications: ${createdNotifications.filter(n => n.targetType === 'specific_tenants').length}`);
    console.log(`   - Unread notifications: ${createdNotifications.filter(n => !n.isRead).length}`);

  } catch (error) {
    console.error('❌ Error seeding notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedNotifications(); 