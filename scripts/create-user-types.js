const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// User types with different roles and permissions
const userTypes = [
  {
    name: 'Super Admin',
    email: 'superadmin@example.com',
    password: 'SuperAdmin123!',
    role: 'Super Admin',
    description: 'Full system access with all permissions'
  },
  {
    name: 'Tenant Admin',
    email: 'admin@acme-corp.com',
    password: 'AcmeAdmin123!',
    role: 'Tenant Admin',
    tenantSlug: 'acme-corp',
    description: 'Full tenant access with limited system permissions'
  },
  {
    name: 'Tenant Manager',
    email: 'manager@acme-corp.com',
    password: 'AcmeManager123!',
    role: 'Tenant Manager',
    tenantSlug: 'acme-corp',
    description: 'Can manage specific modules and users'
  },
  {
    name: 'Tenant User',
    email: 'user@acme-corp.com',
    password: 'AcmeUser123!',
    role: 'Tenant User',
    tenantSlug: 'acme-corp',
    description: 'Standard user with limited access'
  },
  {
    name: 'Read-only User',
    email: 'viewer@acme-corp.com',
    password: 'AcmeViewer123!',
    role: 'Read-only User',
    tenantSlug: 'acme-corp',
    description: 'Can only view data without modification'
  },
  {
    name: 'Content Manager',
    email: 'content@acme-corp.com',
    password: 'AcmeContent123!',
    role: 'Content Manager',
    tenantSlug: 'acme-corp',
    description: 'Specialized role for content management'
  },
  {
    name: 'Reports Analyst',
    email: 'analyst@acme-corp.com',
    password: 'AcmeAnalyst123!',
    role: 'Reports Analyst',
    tenantSlug: 'acme-corp',
    description: 'Specialized role for reports and analytics'
  }
];

// Custom role definitions
const customRoles = [
  {
    name: 'Content Manager',
    description: 'Specialized role for content management',
    permissions: {
      'dashboard': { canCreate: false, canRead: true, canUpdate: false, canDelete: false, canViewAll: false },
      'profile': { canCreate: false, canRead: true, canUpdate: true, canDelete: false, canViewAll: false },
      'support': { canCreate: true, canRead: true, canUpdate: false, canDelete: false, canViewAll: false },
      'content': { canCreate: true, canRead: true, canUpdate: true, canDelete: true, canViewAll: true },
      'reports': { canCreate: false, canRead: true, canUpdate: false, canDelete: false, canViewAll: false }
    }
  },
  {
    name: 'Reports Analyst',
    description: 'Specialized role for reports and analytics',
    permissions: {
      'dashboard': { canCreate: false, canRead: true, canUpdate: false, canDelete: false, canViewAll: false },
      'profile': { canCreate: false, canRead: true, canUpdate: true, canDelete: false, canViewAll: false },
      'support': { canCreate: true, canRead: true, canUpdate: false, canDelete: false, canViewAll: false },
      'reports': { canCreate: true, canRead: true, canUpdate: true, canDelete: false, canViewAll: true },
      'analytics': { canCreate: true, canRead: true, canUpdate: true, canDelete: false, canViewAll: true }
    }
  }
];

async function createUserTypes() {
  try {
    console.log('🌱 Creating user types with custom roles...');

    // Get or create tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: 'acme-corp' }
    });

    if (!tenant) {
      console.log('❌ Tenant acme-corp not found. Please create the tenant first.');
      return;
    }

    // Create custom roles first
    for (const roleData of customRoles) {
      const existingRole = await prisma.role.findFirst({
        where: { 
          name: roleData.name,
          tenantId: tenant.id
        }
      });

      if (!existingRole) {
        console.log(`Creating custom role: ${roleData.name}`);
        const newRole = await prisma.role.create({
          data: {
            name: roleData.name,
            description: roleData.description,
            isDefault: false,
            isTemplate: false,
            isActive: true,
            tenantId: tenant.id
          }
        });

        // Assign permissions to the custom role
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

    // Create users with their respective roles
    for (const userData of userTypes) {
      // Skip super admin as it's handled separately
      if (userData.role === 'Super Admin') {
        console.log('⏭️ Skipping Super Admin (handled separately)');
        continue;
      }

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: { 
          email: userData.email,
          tenantId: tenant.id
        }
      });

      if (existingUser) {
        console.log(`✅ User already exists: ${userData.email}`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Get role
      const role = await prisma.role.findFirst({
        where: { 
          name: userData.role,
          tenantId: tenant.id
        }
      });

      if (!role) {
        console.log(`❌ Role not found: ${userData.role}`);
        continue;
      }

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
    }

    console.log('🎉 User types creation completed!');
    console.log('\n📋 Created Users:');
    console.log('================');
    
    for (const userData of userTypes) {
      if (userData.role !== 'Super Admin') {
        console.log(`👤 ${userData.name}`);
        console.log(`   Email: ${userData.email}`);
        console.log(`   Password: ${userData.password}`);
        console.log(`   Role: ${userData.role}`);
        console.log(`   Description: ${userData.description}`);
        console.log('');
      }
    }

  } catch (error) {
    console.error('❌ Error creating user types:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createUserTypes();
