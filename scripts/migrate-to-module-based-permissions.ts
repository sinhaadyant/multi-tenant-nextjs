import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateToModuleBasedPermissions() {
  console.log('Starting migration to module-based permissions...');

  try {
    // Step 1: Update existing roles to set isGlobal based on tenantId
    console.log('Step 1: Updating roles with isGlobal field...');
    
    const roles = await prisma.role.findMany();
    let updatedRoles = 0;

    for (const role of roles) {
      const isGlobal = role.tenantId === null;
      await prisma.role.update({
        where: { id: role.id },
        data: { isGlobal }
      });
      updatedRoles++;
    }

    console.log(`Updated ${updatedRoles} roles with isGlobal field`);

    // Step 2: Migrate role permissions from permission-based to module-based
    console.log('Step 2: Migrating role permissions to module-based...');
    
    const rolePermissions = await prisma.rolePermission.findMany({
      include: {
        permission: true
      }
    });

    console.log(`Found ${rolePermissions.length} role permissions to migrate`);

    // Create new module-based role permissions
    const newRolePermissions = [];
    const processedModules = new Set<string>();

    for (const rolePermission of rolePermissions) {
      const moduleKey = rolePermission.permission.moduleKey;
      const key = `${rolePermission.roleId}-${moduleKey}`;
      
      if (processedModules.has(key)) {
        // If we already have permissions for this role-module combination,
        // merge the permissions instead of creating duplicates
        const existingIndex = newRolePermissions.findIndex(rp => 
          rp.roleId === rolePermission.roleId && rp.moduleKey === moduleKey
        );
        
        if (existingIndex !== -1) {
          const existing = newRolePermissions[existingIndex];
          // Merge permissions (if any permission is true, keep it true)
          existing.canCreate = existing.canCreate || rolePermission.canCreate;
          existing.canRead = existing.canRead || rolePermission.canRead;
          existing.canUpdate = existing.canUpdate || rolePermission.canUpdate;
          existing.canDelete = existing.canDelete || rolePermission.canDelete;
          existing.canViewAll = existing.canViewAll || rolePermission.canViewAll;
        }
      } else {
        processedModules.add(key);
        newRolePermissions.push({
          roleId: rolePermission.roleId,
          moduleKey: moduleKey,
          canCreate: rolePermission.canCreate,
          canRead: rolePermission.canRead,
          canUpdate: rolePermission.canUpdate,
          canDelete: rolePermission.canDelete,
          canViewAll: rolePermission.canViewAll,
        });
      }
    }

    console.log(`Created ${newRolePermissions.length} new module-based role permissions`);

    // Step 3: Delete old role permissions and permissions table
    console.log('Step 3: Cleaning up old data...');
    
    // Delete all existing role permissions
    await prisma.rolePermission.deleteMany({});
    
    // Delete all permissions
    await prisma.permission.deleteMany({});

    // Step 4: Insert new module-based role permissions
    console.log('Step 4: Inserting new module-based role permissions...');
    
    if (newRolePermissions.length > 0) {
      await prisma.rolePermission.createMany({
        data: newRolePermissions
      });
    }

    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  migrateToModuleBasedPermissions()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migrateToModuleBasedPermissions };
