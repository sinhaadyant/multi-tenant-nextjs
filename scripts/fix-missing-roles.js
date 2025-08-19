const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fixMissingRoles() {
  try {
    console.log('🔧 Fixing missing roles...');

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: 'acme-corp' }
    });

    if (!tenant) {
      console.log('❌ Tenant acme-corp not found.');
      return;
    }

    // Create missing roles (using different names to avoid conflicts with global templates)
    const missingRoles = [
      {
        name: 'Acme Manager',
        description: 'Can manage specific modules and users',
        permissions: {
          'dashboard': { canCreate: false, canRead: true, canUpdate: false, canDelete: false, canViewAll: false },
          'profile': { canCreate: false, canRead: true, canUpdate: true, canDelete: false, canViewAll: false },
          'support': { canCreate: true, canRead: true, canUpdate: false, canDelete: false, canViewAll: false },
          'users': { canCreate: true, canRead: true, canUpdate: true, canDelete: false, canViewAll: false },
          'content': { canCreate: true, canRead: true, canUpdate: true, canDelete: false, canViewAll: false },
          'reports': { canCreate: false, canRead: true, canUpdate: false, canDelete: false, canViewAll: false }
        }
      },
      {
        name: 'Acme Viewer',
        description: 'Can only view data without modification',
        permissions: {
          'dashboard': { canCreate: false, canRead: true, canUpdate: false, canDelete: false, canViewAll: false },
          'profile': { canCreate: false, canRead: true, canUpdate: true, canDelete: false, canViewAll: false },
          'support': { canCreate: true, canRead: true, canUpdate: false, canDelete: false, canViewAll: false },
          'content': { canCreate: false, canRead: true, canUpdate: false, canDelete: false, canViewAll: false },
          'reports': { canCreate: false, canRead: true, canUpdate: false, canDelete: false, canViewAll: false }
        }
      }
    ];

    for (const roleData of missingRoles) {
      const existingRole = await prisma.role.findFirst({
        where: { 
          name: roleData.name,
          tenantId: tenant.id
        }
      });

      if (!existingRole) {
        console.log(`Creating missing role: ${roleData.name}`);
        const newRole = await prisma.role.create({
          data: {
            name: roleData.name,
            description: roleData.description,
            isDefault: false,
            isTemplate: false,
            isActive: true,
            isGlobal: false,
            tenantId: tenant.id
          }
        });

        // Assign permissions to the role
        for (const [moduleKey, permissions] of Object.entries(roleData.permissions)) {
          await prisma.rolePermission.create({
            data: {
              roleId: newRole.id,
              moduleKey: moduleKey,
              ...permissions
            }
          });
        }

        console.log(`✅ Created role: ${roleData.name}`);
      } else {
        console.log(`✅ Role already exists: ${roleData.name}`);
      }
    }

    // Create missing users
    const missingUsers = [
      {
        name: 'Acme Manager',
        email: 'manager@acme-corp.com',
        password: 'AcmeManager123!',
        role: 'Acme Manager'
      },
      {
        name: 'Acme Viewer',
        email: 'viewer@acme-corp.com',
        password: 'AcmeViewer123!',
        role: 'Acme Viewer'
      }
    ];

    for (const userData of missingUsers) {
      const existingUser = await prisma.user.findFirst({
        where: { 
          email: userData.email,
          tenantId: tenant.id
        }
      });

      if (!existingUser) {
        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 12);

        // Get role
        const role = await prisma.role.findFirst({
          where: { 
            name: userData.role,
            tenantId: tenant.id
          }
        });

        if (role) {
          // Create user
          const newUser = await prisma.user.create({
            data: {
              email: userData.email,
              name: userData.name,
              password: hashedPassword,
              isActive: true,
              tenantId: tenant.id
            }
          });

          // Assign role to user
          await prisma.userRole.create({
            data: {
              userId: newUser.id,
              roleId: role.id,
              assignedBy: null
            }
          });

          console.log(`✅ Created user: ${userData.name} (${userData.email}) with role: ${userData.role}`);
        } else {
          console.log(`❌ Role not found for user: ${userData.role}`);
        }
      } else {
        console.log(`✅ User already exists: ${userData.email}`);
      }
    }

    console.log('🎉 Missing roles and users fixed!');

  } catch (error) {
    console.error('❌ Error fixing missing roles:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixMissingRoles();
