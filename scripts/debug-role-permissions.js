const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugRolePermissions() {
  try {
    const roleId = 'cme63jpc1002eukmo8xpzrfzs';
    
    console.log('🔍 Checking role with ID:', roleId);
    
    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: {
              include: {
                module: true
              }
            }
          }
        }
      }
    });
    
    if (!role) {
      console.log('❌ Role not found');
      return;
    }
    
    console.log('✅ Role found:', {
      id: role.id,
      name: role.name,
      description: role.description,
      isActive: role.isActive,
      tenantId: role.tenantId
    });
    
    console.log('📋 Role permissions:', role.permissions.length);
    role.permissions.forEach(rp => {
      console.log('  -', rp.permission.name, '(', rp.permission.moduleKey, ')');
    });
    
    // Check available permissions
    console.log('\n🔍 Available permissions:');
    const permissions = await prisma.permission.findMany({
      take: 10,
      include: {
        module: true
      }
    });
    
    permissions.forEach(p => {
      console.log('  -', p.id, ':', p.name, '(', p.moduleKey, ')');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugRolePermissions();
