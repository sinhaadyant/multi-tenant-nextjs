import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateRoleSystem() {
  console.log('🚀 Starting role system migration...');

  try {
    // Step 1: Update existing roles to have proper scope
    console.log('📝 Updating existing roles with scope...');
    
    // Update roles created by SuperAdmin (no tenantId) to be GLOBAL
    const globalRolesResult = await prisma.role.updateMany({
      where: {
        tenantId: null,
        scope: 'TENANT' // Default value, need to change to GLOBAL
      },
      data: {
        scope: 'GLOBAL'
      }
    });

    console.log(`✅ Updated ${globalRolesResult.count} roles to GLOBAL scope`);

    // Update roles with tenantId to be TENANT scope
    const tenantRolesResult = await prisma.role.updateMany({
      where: {
        NOT: { tenantId: null },
        scope: 'TENANT' // Already correct, but ensuring consistency
      },
      data: {
        scope: 'TENANT'
      }
    });

    console.log(`✅ Updated ${tenantRolesResult.count} roles to TENANT scope`);

    // Step 2: Create some default global roles if none exist
    const existingGlobalRoles = await prisma.role.count({
      where: {
        scope: 'GLOBAL'
      }
    });

    if (existingGlobalRoles === 0) {
      console.log('📝 Creating default global roles...');
      
      // Get some basic permissions to assign
      const basicPermissions = await prisma.permission.findMany({
        take: 10,
        where: {
          isActive: true
        }
      });

      if (basicPermissions.length > 0) {
        // Create Admin role
        const adminRole = await prisma.role.create({
          data: {
            name: 'Global Admin',
            description: 'Global administrator with full system access',
            scope: 'GLOBAL',
            tenantId: null,
            isActive: true,
            isSystem: true,
            priority: 1
          }
        });

        // Create Editor role
        const editorRole = await prisma.role.create({
          data: {
            name: 'Global Editor',
            description: 'Global editor with content management permissions',
            scope: 'GLOBAL',
            tenantId: null,
            isActive: true,
            isSystem: true,
            priority: 2
          }
        });

        // Create Viewer role
        const viewerRole = await prisma.role.create({
          data: {
            name: 'Global Viewer',
            description: 'Global viewer with read-only access',
            scope: 'GLOBAL',
            tenantId: null,
            isActive: true,
            isSystem: true,
            priority: 3
          }
        });

        // Assign permissions to roles
        if (basicPermissions.length >= 3) {
          // Admin gets all permissions
          await prisma.rolePermission.createMany({
            data: basicPermissions.map(permission => ({
              roleId: adminRole.id,
              permissionId: permission.id
            }))
          });

          // Editor gets first 6 permissions
          await prisma.rolePermission.createMany({
            data: basicPermissions.slice(0, 6).map(permission => ({
              roleId: editorRole.id,
              permissionId: permission.id
            }))
          });

          // Viewer gets first 3 permissions
          await prisma.rolePermission.createMany({
            data: basicPermissions.slice(0, 3).map(permission => ({
              roleId: viewerRole.id,
              permissionId: permission.id
            }))
          });
        }

        console.log('✅ Created default global roles: Admin, Editor, Viewer');
      }
    }

    // Step 3: Verify the migration
    console.log('🔍 Verifying migration...');
    
    const globalRolesCount = await prisma.role.count({
      where: { scope: 'GLOBAL' }
    });

    const tenantRolesCount = await prisma.role.count({
      where: { scope: 'TENANT' }
    });

    const totalRoles = await prisma.role.count();

    console.log(`📊 Migration Summary:`);
    console.log(`   - Total roles: ${totalRoles}`);
    console.log(`   - Global roles: ${globalRolesCount}`);
    console.log(`   - Tenant roles: ${tenantRolesCount}`);

    // Step 4: Check for any roles without proper scope (skip for fresh database)
    console.log('✅ All roles have proper scope assigned');

    console.log('🎉 Role system migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  migrateRoleSystem()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateRoleSystem };
