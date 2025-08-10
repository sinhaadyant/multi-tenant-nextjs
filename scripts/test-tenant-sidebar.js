const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testTenantSidebar() {
  try {
    console.log('🔍 Testing tenant sidebar access...');
    
    // Check if we have any tenants
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true },
      include: {
        users: {
          include: {
            userRoles: {
              include: {
                role: {
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
                }
              }
            }
          }
        }
      }
    });
    
    console.log(`Found ${tenants.length} active tenants`);
    
    if (tenants.length === 0) {
      console.log('❌ No active tenants found. Please create a tenant first.');
      return;
    }
    
    // Check each tenant
    for (const tenant of tenants) {
      console.log(`\n📋 Tenant: ${tenant.name} (${tenant.slug})`);
      console.log(`   Users: ${tenant.users.length}`);
      
      if (tenant.users.length === 0) {
        console.log('   ❌ No users found for this tenant');
        continue;
      }
      
      // Check each user
      for (const user of tenant.users) {
        console.log(`   👤 User: ${user.name} (${user.email})`);
        console.log(`      Roles: ${user.userRoles.length}`);
        
        if (user.userRoles.length === 0) {
          console.log('      ❌ No roles assigned');
          continue;
        }
        
        // Check permissions
        const permissions = new Set();
        const modules = new Set();
        
        user.userRoles.forEach(userRole => {
          userRole.role.permissions.forEach(rp => {
            const permission = rp.permission;
            const moduleKey = permission.module.moduleKey;
            permissions.add(`${moduleKey}:${permission.action}`);
            modules.add(moduleKey);
          });
        });
        
        console.log(`      📋 Permissions: ${permissions.size}`);
        console.log(`      🗂️  Modules: ${modules.size}`);
        console.log(`      ✅ Has access: ${permissions.size > 0 ? 'Yes' : 'No'}`);
      }
    }
    
    // Check available modules
    const modules = await prisma.module.findMany({
      where: { isActive: true, isVisible: true },
      orderBy: { orderIndex: 'asc' }
    });
    
    console.log(`\n📦 Available modules: ${modules.length}`);
    modules.forEach(module => {
      console.log(`   - ${module.moduleName} (${module.moduleKey})`);
    });
    
    console.log('\n✅ Tenant sidebar test completed!');
    
  } catch (error) {
    console.error('❌ Error testing tenant sidebar:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTenantSidebar(); 