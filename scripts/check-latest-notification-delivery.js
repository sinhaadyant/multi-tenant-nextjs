const { PrismaClient } = require('@prisma/client');

async function checkLatestNotificationDelivery() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Checking latest notification delivery...');

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

    // Check the latest notification
    const latestNotification = await prisma.notification.findFirst({
      where: {
        title: 'Real-time Test Notification'
      },
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        priority: true,
        status: true,
        createdAt: true,
        targetType: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (latestNotification) {
      console.log('\n📋 Latest notification found:');
      console.log('ID:', latestNotification.id);
      console.log('Title:', latestNotification.title);
      console.log('Message:', latestNotification.message);
      console.log('Type:', latestNotification.type);
      console.log('Priority:', latestNotification.priority);
      console.log('Status:', latestNotification.status);
      console.log('Target Type:', latestNotification.targetType);
      console.log('Created:', latestNotification.createdAt);

      // Check if it was delivered to anil@cc.com
      const userNotification = await prisma.userNotification.findFirst({
        where: {
          userId: anilUser.id,
          notificationId: latestNotification.id
        },
        select: {
          id: true,
          isRead: true,
          isActive: true,
          createdAt: true
        }
      });

      if (userNotification) {
        console.log('\n✅ Notification delivered to anil@cc.com!');
        console.log('User Notification ID:', userNotification.id);
        console.log('Is Read:', userNotification.isRead);
        console.log('Is Active:', userNotification.isActive);
        console.log('Delivered At:', userNotification.createdAt);
      } else {
        console.log('\n❌ Notification NOT delivered to anil@cc.com');
      }
    } else {
      console.log('\n❌ Latest notification not found');
    }

    // Check total notifications for anil@cc.com
    const totalUserNotifications = await prisma.userNotification.count({
      where: { userId: anilUser.id }
    });

    const unreadUserNotifications = await prisma.userNotification.count({
      where: { 
        userId: anilUser.id,
        isRead: false
      }
    });

    console.log(`\n📊 anil@cc.com notification summary:`);
    console.log(`Total notifications: ${totalUserNotifications}`);
    console.log(`Unread notifications: ${unreadUserNotifications}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestNotificationDelivery();
