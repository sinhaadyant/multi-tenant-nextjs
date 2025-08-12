import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkModulesAndPermissions() {
  console.log('🔍 Checking Modules and Permissions...\n');

  try {
    // Check modules
    const modules = await prisma.module.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' },
      select: {
        moduleKey: true,
        moduleName: true,
        description: true,
        isActive: true,
        isVisible: true,
        orderIndex: true
      }
    });

    console.log('📦 Available Modules:');
    console.log(`Total modules found: ${modules.length}\n`);

    if (modules.length > 0) {
      modules.forEach((module, index) => {
        console.log(`Module ${index + 1}:`);
        console.log(`  Key: ${module.moduleKey}`);
        console.log(`  Name: ${module.moduleName}`);
        console.log(`  Description: ${module.description || 'N/A'}`);
        console.log(`  Active: ${module.isActive}`);
        console.log(`  Visible: ${module.isVisible}`);
        console.log(`  Order: ${module.orderIndex}`);
        console.log('');
      });
    }

    // Check permissions
    const permissions = await prisma.permission.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        action: true,
        moduleKey: true,
        resource: true,
        category: true
      },
      take: 20 // Limit to first 20 for display
    });

    console.log('🔐 Available Permissions:');
    console.log(`Total permissions found: ${permissions.length}\n`);

    if (permissions.length > 0) {
      permissions.forEach((permission, index) => {
        console.log(`Permission ${index + 1}:`);
        console.log(`  ID: ${permission.id}`);
        console.log(`  Name: ${permission.name}`);
        console.log(`  Action: ${permission.action}`);
        console.log(`  Module: ${permission.moduleKey}`);
        console.log(`  Resource: ${permission.resource || 'N/A'}`);
        console.log(`  Category: ${permission.category || 'N/A'}`);
        console.log(`  Description: ${permission.description || 'N/A'}`);
        console.log('');
      });
    }

    // Check if there are any existing tenant modules
    const tenantModules = await prisma.tenantModule.findMany({
      take: 5,
      include: {
        module: {
          select: {
            moduleKey: true,
            moduleName: true
          }
        },
        tenant: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    });

    console.log('🏢 Existing Tenant Modules:');
    console.log(`Total tenant modules found: ${tenantModules.length}\n`);

    if (tenantModules.length > 0) {
      tenantModules.forEach((tm, index) => {
        console.log(`Tenant Module ${index + 1}:`);
        console.log(`  Tenant: ${tm.tenant.name} (${tm.tenant.slug})`);
        console.log(`  Module: ${tm.module.moduleName} (${tm.module.moduleKey})`);
        console.log(`  Enabled: ${tm.isEnabled}`);
        console.log(`  Visible: ${tm.isVisible}`);
        console.log('');
      });
    }

    console.log('✅ Modules and Permissions check completed!');

  } catch (error) {
    console.error('❌ Error checking modules and permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkModulesAndPermissions();
