const { PrismaClient } = require('@prisma/client');

async function debugUserPermissions() {
  const prisma = new PrismaClient();
  
  try {
    const email = 'test11@gmail.com';
    
    // Find the user
    const user = await prisma.user.findFirst({
      where: { email },
      include: {
        tenant: true,
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    module: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`👤 User: ${user.name} (${user.email})`);
    console.log(`🏢 Tenant: ${user.tenant?.name} (${user.tenant?.slug})`);
    console.log(`✅ Active: ${user.isActive}`);
    console.log(`🛡️ Roles: ${user.userRoles.length}`);
    
    // Check user roles and permissions
    user.userRoles.forEach(ur => {
      console.log(`\n📋 Role: ${ur.role.name}`);
      console.log(`  Active: ${ur.role.isActive}`);
      console.log(`  System: ${ur.role.isSystem}`);
      console.log(`  Permissions: ${ur.role.permissions.length}`);
      
      ur.role.permissions.forEach(p => {
        console.log(`    - ${p.moduleKey}: read=${p.canRead}, create=${p.canCreate}, update=${p.canUpdate}, delete=${p.canDelete}`);
      });
    });
    
    // Get all modules from the database
    const allModules = await prisma.module.findMany({
      where: { isVisible: true },
      orderBy: { orderIndex: 'asc' }
    });
    
    console.log(`\n📦 All Available Modules (${allModules.length}):`);
    allModules.forEach(module => {
      console.log(`  - ${module.moduleName} (${module.moduleKey})`);
      console.log(`    Visible: ${module.isVisible}, Order: ${module.orderIndex}`);
    });
    
    // Get tenant modules
    const tenantModules = await prisma.tenantModule.findMany({
      where: { tenantId: user.tenantId },
      include: { module: true }
    });
    
    console.log(`\n🏢 Tenant Modules (${tenantModules.length}):`);
    tenantModules.forEach(tm => {
      console.log(`  - ${tm.module.moduleName} (${tm.module.moduleKey})`);
      console.log(`    Enabled: ${tm.isEnabled}, Visible: ${tm.isVisibleInTenant}`);
    });
    
    // Check what modules user should have access to
    const userModuleKeys = new Set();
    user.userRoles.forEach(ur => {
      ur.role.permissions.forEach(p => {
        userModuleKeys.add(p.moduleKey);
      });
    });
    
    console.log(`\n🔐 User Module Access (${userModuleKeys.size}):`);
    Array.from(userModuleKeys).forEach(moduleKey => {
      console.log(`  - ${moduleKey}`);
    });
    
    // Check which modules should be visible in sidebar
    const visibleModules = allModules.filter(module => {
      // Check if user has permission for this module
      const hasPermission = userModuleKeys.has(module.moduleKey);
      
      // Check if module is enabled in tenant
      const tenantModule = tenantModules.find(tm => tm.moduleId === module.id);
      const isEnabledInTenant = tenantModule?.isEnabled ?? true;
      const isVisibleInTenant = tenantModule?.isVisibleInTenant ?? true;
      
      // Exclude module-management
      const isExcluded = ['module-management', 'modules'].includes(module.moduleKey);
      
      console.log(`\n🔍 Module: ${module.moduleName} (${module.moduleKey})`);
      console.log(`  Has Permission: ${hasPermission}`);
      console.log(`  Enabled in Tenant: ${isEnabledInTenant}`);
      console.log(`  Visible in Tenant: ${isVisibleInTenant}`);
      console.log(`  Is Excluded: ${isExcluded}`);
      console.log(`  Should Show: ${hasPermission && isEnabledInTenant && isVisibleInTenant && !isExcluded}`);
      
      return hasPermission && isEnabledInTenant && isVisibleInTenant && !isExcluded;
    });
    
    console.log(`\n✅ Modules that should appear in sidebar (${visibleModules.length}):`);
    visibleModules.forEach(module => {
      console.log(`  - ${module.moduleName} (${module.moduleKey})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUserPermissions();
