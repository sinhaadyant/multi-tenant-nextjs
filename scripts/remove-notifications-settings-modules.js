const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function removeNotificationsAndSettingsModules() {
  try {
    console.log('🗑️ Removing notifications and settings modules...');
    
    // First, remove all role permissions for notifications and settings
    console.log('Removing role permissions...');
    
    // Get all permissions for notifications and settings modules
    const permissionsToRemove = await prisma.permission.findMany({
      where: {
        OR: [
          { moduleKey: 'notifications' },
          { moduleKey: 'settings' }
        ]
      }
    });
    
    console.log(`Found ${permissionsToRemove.length} permissions to remove`);
    
    // Remove role permissions
    for (const permission of permissionsToRemove) {
      await prisma.rolePermission.deleteMany({
        where: {
          permissionId: permission.id
        }
      });
    }
    
    // Remove the permissions
    await prisma.permission.deleteMany({
      where: {
        OR: [
          { moduleKey: 'notifications' },
          { moduleKey: 'settings' }
        ]
      }
    });
    
    console.log('✅ Permissions removed successfully');
    
    // Remove the modules
    await prisma.module.deleteMany({
      where: {
        OR: [
          { moduleKey: 'notifications' },
          { moduleKey: 'settings' }
        ]
      }
    });
    
    console.log('✅ Modules removed successfully');
    
    console.log('🎉 Notifications and settings modules removed from database!');
    
  } catch (error) {
    console.error('❌ Error removing modules:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

removeNotificationsAndSettingsModules(); 