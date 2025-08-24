const { PrismaClient } = require('@prisma/client');

async function debugUserNotifications() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Debugging User Notifications');
    console.log('================================');
    
    const userEmail = 'anil@cc.com';
    const tenantSlug = 'riyo';
    
    // Find the user
    console.log('\n1. Finding user...');
    const user = await prisma.user.findFirst({
      where: {
        email: userEmail,
        tenant: {
          slug: tenantSlug
        }
      },
      include: {
        tenant: true
      }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', {
      id: user.id,
      name: user.name,
      email: user.email,
      tenant: user.tenant.name
    });
    
    // Check all notifications in the system
    console.log('\n2. Checking all notifications in system...');
    const allNotifications = await prisma.notification.findMany({
      where: {
        targetType: 'specific_users',
        status: 'sent'
      },
      include: {
        superAdmin: true,
        userNotifications: {
          where: {
            userId: user.id
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });
    
    console.log(`📊 Found ${allNotifications.length} recent notifications:`);
    allNotifications.forEach((notification, index) => {
      console.log(`${index + 1}. ${notification.title}`);
      console.log(`   ID: ${notification.id}`);
      console.log(`   Status: ${notification.status}`);
      console.log(`   Target Type: ${notification.targetType}`);
      console.log(`   Created: ${notification.createdAt}`);
      console.log(`   User Notifications: ${notification.userNotifications.length}`);
      console.log('');
    });
    
    // Check user notifications specifically
    console.log('\n3. Checking user notifications...');
    const userNotifications = await prisma.userNotification.findMany({
      where: {
        userId: user.id,
        isActive: true
      },
      include: {
        notification: {
          include: {
            superAdmin: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`📋 User has ${userNotifications.length} notifications:`);
    userNotifications.forEach((userNotif, index) => {
      console.log(`${index + 1}. ${userNotif.notification.title}`);
      console.log(`   User Notification ID: ${userNotif.id}`);
      console.log(`   Notification ID: ${userNotif.notificationId}`);
      console.log(`   Status: ${userNotif.isRead ? 'read' : 'unread'}`);
      console.log(`   Created: ${userNotif.createdAt}`);
      console.log(`   From: ${userNotif.notification.superAdmin?.name || 'System'}`);
      console.log('');
    });
    
    // Check if there are any notifications that should be for this user but aren't
    console.log('\n4. Checking for missing user notifications...');
    const notificationsForUser = await prisma.notification.findMany({
      where: {
        targetType: 'specific_users',
        status: 'sent',
        userNotifications: {
          none: {
            userId: user.id
          }
        }
      },
      include: {
        superAdmin: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (notificationsForUser.length > 0) {
      console.log(`⚠️ Found ${notificationsForUser.length} notifications that should be for this user but aren't:`);
      notificationsForUser.forEach((notification, index) => {
        console.log(`${index + 1}. ${notification.title}`);
        console.log(`   ID: ${notification.id}`);
        console.log(`   Created: ${notification.createdAt}`);
        console.log(`   From: ${notification.superAdmin?.name || 'System'}`);
        console.log('');
      });
    } else {
      console.log('✅ All notifications are properly linked to user');
    }
    
  } catch (error) {
    console.error('❌ Error debugging user notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUserNotifications();
