const { PrismaClient } = require('@prisma/client');

async function checkConsTenantUser() {
  const prisma = new PrismaClient();
  
  try {
    // Find the cons tenant and its users
    const tenant = await prisma.tenant.findFirst({
      where: { slug: 'cons' },
      include: {
        users: {
          include: {
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
        }
      }
    });
    
    if (tenant) {
      console.log(`🏢 Tenant: ${tenant.name} (${tenant.slug})`);
      console.log(`  Active: ${tenant.isActive}`);
      console.log(`  Users: ${tenant.users.length}`);
      
      tenant.users.forEach(user => {
        console.log(`\n👤 User: ${user.name} (${user.email})`);
        console.log(`  Active: ${user.isActive}`);
        console.log(`  Roles: ${user.userRoles.length}`);
        
        user.userRoles.forEach(ur => {
          console.log(`    🛡️ Role: ${ur.role.name}`);
          console.log(`      Permissions: ${ur.role.permissions.length}`);
          ur.role.permissions.forEach(p => {
            console.log(`        - ${p.moduleKey}: read=${p.canRead}, create=${p.canCreate}, update=${p.canUpdate}, delete=${p.canDelete}`);
          });
        });
      });
      
      // Check if we have a user we can test with
      const testableUser = tenant.users.find(u => u.isActive && u.userRoles.length > 0);
      if (testableUser) {
        console.log(`\n✅ Found testable user: ${testableUser.email}`);
        console.log('📝 To test with this user, you might need to reset their password to a known value.');
      }
    } else {
      console.log('❌ Tenant with slug "cons" not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkConsTenantUser();
