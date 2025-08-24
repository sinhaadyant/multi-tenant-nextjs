const { PrismaClient } = require('@prisma/client');

async function checkUserNotifications() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Checking user notifications for anil@cc.com...');

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

    // Check user notifications
    const userNotifications = await prisma.userNotification.findMany({
      where: { userId: anilUser.id },
      include: {
        notification: {
          select: {
            id: true,
            title: true,
            message: true,
            type: true,
            targetType: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`\n📋 User notifications found: ${userNotifications.length}`);
    userNotifications.forEach((userNotif, index) => {
      console.log(`\nUser Notification ${index + 1}:`);
      console.log(`- User Notification ID: ${userNotif.id}`);
      console.log(`- Notification ID: ${userNotif.notificationId}`);
      console.log(`- Is Read: ${userNotif.isRead}`);
      console.log(`- Read At: ${userNotif.readAt}`);
      console.log(`- Created At: ${userNotif.createdAt}`);
      console.log(`- Notification Title: ${userNotif.notification.title}`);
      console.log(`- Notification Message: ${userNotif.notification.message}`);
      console.log(`- Notification Type: ${userNotif.notification.type}`);
      console.log(`- Target Type: ${userNotif.notification.targetType}`);
      console.log(`- Status: ${userNotif.notification.status}`);
    });

    // Check if there are any notifications that should be delivered to anil@cc.com
    console.log('\n🔍 Checking notifications that should target anil@cc.com...');
    
    // Get all notifications that target specific users
    const specificUserNotifications = await prisma.notification.findMany({
      where: {
        targetType: 'specific_users',
        status: 'sent'
      },
      select: {
        id: true,
        title: true,
        message: true,
        targetType: true,
        status: true,
        createdAt: true
      }
    });

    console.log(`\n📋 Notifications with targetType 'specific_users': ${specificUserNotifications.length}`);
    specificUserNotifications.forEach((notification, index) => {
      console.log(`\nNotification ${index + 1}:`);
      console.log(`- ID: ${notification.id}`);
      console.log(`- Title: ${notification.title}`);
      console.log(`- Message: ${notification.message}`);
      console.log(`- Status: ${notification.status}`);
      console.log(`- Created At: ${notification.createdAt}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserNotifications();
