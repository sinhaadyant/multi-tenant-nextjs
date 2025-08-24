const { PrismaClient } = require('@prisma/client');

async function updateNotificationStatus() {
  const prisma = new PrismaClient();

  try {
    console.log('🔄 Updating notification status to trigger delivery...');

    // Find the latest notification
    const latestNotification = await prisma.notification.findFirst({
      where: {
        title: 'Real-time Test Notification'
      },
      select: {
        id: true,
        title: true,
        status: true,
        targetType: true,
        targetTenantId: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!latestNotification) {
      console.log('❌ Notification not found');
      return;
    }

    console.log('📋 Found notification:');
    console.log('ID:', latestNotification.id);
    console.log('Title:', latestNotification.title);
    console.log('Current Status:', latestNotification.status);
    console.log('Target Type:', latestNotification.targetType);

    // Update status to 'sent'
    const updatedNotification = await prisma.notification.update({
      where: { id: latestNotification.id },
      data: { status: 'sent' },
      select: {
        id: true,
        title: true,
        status: true
      }
    });

    console.log('\n✅ Notification status updated to:', updatedNotification.status);

    // Now manually deliver the notification to anil@cc.com
    if (latestNotification.targetType === 'specific_users') {
      console.log('\n📨 Delivering notification to anil@cc.com...');
      
      const anilUser = await prisma.user.findFirst({
        where: { email: 'anil@cc.com' },
        select: { id: true }
      });

      if (anilUser) {
        const userNotificationData = {
          userId: anilUser.id,
          notificationId: latestNotification.id,
          isRead: false,
          isActive: true
        };

        const deliveredNotification = await prisma.userNotification.create({
          data: userNotificationData
        });

        console.log(`✅ Delivered notification to anil@cc.com`);
      }
    }

    // Verify delivery to anil@cc.com
    const anilUser = await prisma.user.findFirst({
      where: { email: 'anil@cc.com' },
      select: { id: true, email: true, name: true }
    });

    if (anilUser) {
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
        console.log('\n✅ Notification successfully delivered to anil@cc.com!');
        console.log('User Notification ID:', userNotification.id);
        console.log('Is Read:', userNotification.isRead);
        console.log('Is Active:', userNotification.isActive);
        console.log('Delivered At:', userNotification.createdAt);
      } else {
        console.log('\n❌ Notification still not delivered to anil@cc.com');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateNotificationStatus();
