const { PrismaClient } = require('@prisma/client');

async function fixMissingUserNotifications() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Fixing Missing User Notifications');
    console.log('====================================');
    
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
      }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', user.name);
    
    // Find notifications that should be for this user but aren't linked
    console.log('\n2. Finding missing user notifications...');
    const missingNotifications = await prisma.notification.findMany({
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
    
    console.log(`📊 Found ${missingNotifications.length} notifications that need user notification records`);
    
    if (missingNotifications.length === 0) {
      console.log('✅ No missing notifications found');
      return;
    }
    
    // Create user notification records for each missing notification
    console.log('\n3. Creating missing user notification records...');
    let createdCount = 0;
    
    for (const notification of missingNotifications) {
      try {
        // Check if user notification already exists
        const existingUserNotification = await prisma.userNotification.findFirst({
          where: {
            userId: user.id,
            notificationId: notification.id
          }
        });
        
        if (existingUserNotification) {
          console.log(`⚠️ User notification already exists for: ${notification.title}`);
          continue;
        }
        
        // Create user notification
        await prisma.userNotification.create({
          data: {
            userId: user.id,
            notificationId: notification.id,
            isRead: false,
            isActive: true
          }
        });
        
        console.log(`✅ Created user notification for: ${notification.title}`);
        createdCount++;
        
      } catch (error) {
        console.error(`❌ Error creating user notification for ${notification.title}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Successfully created ${createdCount} user notification records`);
    
    // Verify the fix
    console.log('\n4. Verifying the fix...');
    const userNotificationsAfter = await prisma.userNotification.count({
      where: {
        userId: user.id,
        isActive: true
      }
    });
    
    console.log(`📋 User now has ${userNotificationsAfter} total notifications`);
    
    // Check unread count
    const unreadCount = await prisma.userNotification.count({
      where: {
        userId: user.id,
        isActive: true,
        isRead: false
      }
    });
    
    console.log(`📈 Unread notifications: ${unreadCount}`);
    
  } catch (error) {
    console.error('❌ Error fixing missing user notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMissingUserNotifications();
