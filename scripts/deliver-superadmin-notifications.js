const { PrismaClient } = require('@prisma/client');

async function deliverSuperadminNotifications() {
  const prisma = new PrismaClient();

  try {
    console.log('📨 Delivering missing superadmin notifications to anil@cc.com...');

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

    // Get all notifications that target specific users and are sent
    const specificUserNotifications = await prisma.notification.findMany({
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
      }
    });

    console.log(`\n📋 Found ${specificUserNotifications.length} notifications targeting specific users`);

    // Check which notifications are already delivered to anil@cc.com
    const existingUserNotifications = await prisma.userNotification.findMany({
      where: { userId: anilUser.id },
      select: { notificationId: true }
    });

    const existingNotificationIds = existingUserNotifications.map(un => un.notificationId);
    console.log(`\n📋 anil@cc.com already has ${existingNotificationIds.length} notifications`);

    // Find notifications that need to be delivered
    const notificationsToDeliver = specificUserNotifications.filter(
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
    });

    // Verify the delivery
    const updatedUserNotifications = await prisma.userNotification.findMany({
      where: { userId: anilUser.id },
      include: {
        notification: {
          select: {
            title: true,
            type: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`\n📋 anil@cc.com now has ${updatedUserNotifications.length} total notifications`);
    console.log('Unread count:', updatedUserNotifications.filter(un => !un.isRead).length);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deliverSuperadminNotifications();
