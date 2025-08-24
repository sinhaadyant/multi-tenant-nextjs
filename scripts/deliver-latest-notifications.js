const { PrismaClient } = require('@prisma/client');

async function deliverLatestNotifications() {
  const prisma = new PrismaClient();

  try {
    console.log('📨 Delivering latest missing notifications to anil@cc.com...');

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

    // Get the latest notifications that need to be delivered
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
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Check which notifications anil@cc.com already has
    const existingUserNotifications = await prisma.userNotification.findMany({
      where: { userId: anilUser.id },
      select: { notificationId: true }
    });

    const existingNotificationIds = existingUserNotifications.map(un => un.notificationId);

    // Find notifications that need to be delivered
    const notificationsToDeliver = latestNotifications.filter(
      notification => !existingNotificationIds.includes(notification.id)
    );

    console.log(`\n📨 Notifications to deliver: ${notificationsToDeliver.length}`);

    if (notificationsToDeliver.length === 0) {
      console.log('✅ All notifications are already delivered!');
      return;
    }

    // Deliver the missing notifications
    const deliveryPromises = notificationsToDeliver.map(notification => {
      return prisma.userNotification.create({
        data: {
          userId: anilUser.id,
          notificationId: notification.id,
          isRead: false,
          isActive: true
        }
      });
    });

    const deliveredNotifications = await Promise.all(deliveryPromises);

    console.log(`\n✅ Successfully delivered ${deliveredNotifications.length} notifications:`);
    notificationsToDeliver.forEach((notification, index) => {
      console.log(`${index + 1}. ${notification.title} (${notification.type})`);
      console.log(`   Message: ${notification.message}`);
      console.log(`   Priority: ${notification.priority}`);
      console.log(`   Created: ${notification.createdAt}`);
    });

    // Verify the delivery
    const updatedUserNotifications = await prisma.userNotification.findMany({
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

    console.log(`\n📋 anil@cc.com now has ${updatedUserNotifications.length} total notifications`);
    console.log('Unread count:', updatedUserNotifications.filter(un => !un.isRead).length);

    // Show the latest notifications
    console.log('\n📋 Latest notifications for anil@cc.com:');
    updatedUserNotifications.slice(0, 5).forEach((userNotif, index) => {
      console.log(`${index + 1}. ${userNotif.notification.title} - ${userNotif.isRead ? 'Read' : 'Unread'} (${userNotif.createdAt})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deliverLatestNotifications();
