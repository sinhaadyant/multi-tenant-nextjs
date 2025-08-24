const { PrismaClient } = require('@prisma/client');

async function checkLatestNotifications() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Checking latest notifications...');

    // Get anil@cc.com user ID
    const anilUser = await prisma.user.findFirst({
      where: { email: 'anil@cc.com' },
      select: { id: true, email: true, name: true }
    });

    if (!anilUser) {
      console.log('❌ anil@cc.com user not found');
      return;
    }

    console.log(`✅ Found user: ${anilUser.name} (${anilUser.email}) - ID: ${anilUser.id}`);

    // Get the latest notifications (last 10)
    const latestNotifications = await prisma.notification.findMany({
      where: {
        targetType: 'specific_users',
        status: 'sent',
        isActive: true
      },
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        priority: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log(`\n📋 Latest notifications targeting specific users: ${latestNotifications.length}`);
    latestNotifications.forEach((notification, index) => {
      console.log(`\n${index + 1}. ${notification.title}`);
      console.log(`   Message: ${notification.message}`);
      console.log(`   Type: ${notification.type}`);
      console.log(`   Priority: ${notification.priority}`);
      console.log(`   Status: ${notification.status}`);
      console.log(`   Created: ${notification.createdAt}`);
      console.log(`   ID: ${notification.id}`);
    });

    // Check which notifications anil@cc.com already has
    const existingUserNotifications = await prisma.userNotification.findMany({
      where: { userId: anilUser.id },
      select: { notificationId: true }
    });

    const existingNotificationIds = existingUserNotifications.map(un => un.notificationId);
    console.log(`\n📋 anil@cc.com already has ${existingNotificationIds.length} notifications`);

    // Find notifications that need to be delivered
    const notificationsToDeliver = latestNotifications.filter(
      notification => !existingNotificationIds.includes(notification.id)
    );

    console.log(`\n📨 Notifications to deliver: ${notificationsToDeliver.length}`);
    if (notificationsToDeliver.length > 0) {
      console.log('Missing notifications:');
      notificationsToDeliver.forEach((notification, index) => {
        console.log(`${index + 1}. ${notification.title} (${notification.id})`);
      });
    }

    // Check current user notifications
    const currentUserNotifications = await prisma.userNotification.findMany({
      where: { userId: anilUser.id },
      include: {
        notification: {
          select: {
            title: true,
            type: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`\n📋 Current user notifications for anil@cc.com: ${currentUserNotifications.length}`);
    currentUserNotifications.forEach((userNotif, index) => {
      console.log(`${index + 1}. ${userNotif.notification.title} - ${userNotif.isRead ? 'Read' : 'Unread'} (${userNotif.createdAt})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestNotifications();
