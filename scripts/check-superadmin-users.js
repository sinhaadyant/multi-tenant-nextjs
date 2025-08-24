const { PrismaClient } = require('@prisma/client');

async function checkSuperadminUsers() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Checking superadmin users...');

    const superadmins = await prisma.superAdmin.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        createdAt: true
      }
    });

    console.log('✅ Superadmin users found:', superadmins.length);
    superadmins.forEach(admin => {
      console.log(`- ${admin.name} (${admin.email}) - Active: ${admin.isActive}`);
    });

    // Also check if there are any notifications in the database
    console.log('\n📋 Checking all notifications...');
    const allNotifications = await prisma.notification.findMany({
      select: {
        id: true,
        title: true,
        targetType: true,
        status: true,
        createdAt: true,
        targetTenantId: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('✅ Total notifications found:', allNotifications.length);
    allNotifications.forEach(notification => {
      console.log(`- ${notification.title} (${notification.targetType}) - Status: ${notification.status}`);
      if (notification.targetTenantId) {
        console.log(`  Target Tenant: ${notification.targetTenantId}`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSuperadminUsers();
