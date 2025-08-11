const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTenantAdminPermissions() {
  try {
    console.log('🔍 Checking Tenant Admin permissions...\n');

    // Get all available permissions in the system
    const allAvailablePermissions = await prisma.permission.findMany({
      where: { isActive: true },
      orderBy: [
        { moduleKey: 'asc' },
        { action: 'asc' }
      ]
    });

    // Remove duplicates based on moduleKey:action combination
    const uniquePermissions = [];
    const seen = new Set();
    for (const permission of allAvailablePermissions) {
      const key = `${permission.moduleKey}:${permission.action}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniquePermissions.push(permission);
      }
    }

    console.log(`📋 Total available permissions in system: ${uniquePermissions.length} (${allAvailablePermissions.length} total including duplicates)\n`);

    // Get all tenants
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        users: {
          where: {
            isActive: true,
            userRoles: {
              some: {
                role: {
                  name: {
                    contains: 'Admin'
                  }
                }
              }
            }
          },
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            userRoles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: true
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

    console.log(`Found ${tenants.length} active tenants\n`);

    let totalIssues = 0;
    const detailedReport = [];

    for (const tenant of tenants) {
      console.log(`📋 Tenant: ${tenant.name} (${tenant.slug})`);
      
      const adminUsers = tenant.users.filter(user => 
        user.userRoles.some(userRole => 
          userRole.role.name.toLowerCase().includes('admin')
        )
      );

      console.log(`   Admin Users: ${adminUsers.length}\n`);

      if (adminUsers.length === 0) {
        console.log(`   ⚠️  WARNING: No admin users found for this tenant!`);
        totalIssues++;
        detailedReport.push({
          tenant: tenant.name,
          issue: 'No admin users found',
          severity: 'HIGH'
        });
        continue;
      }

      for (const user of adminUsers) {
        console.log(`   👤 Admin User: ${user.name} (${user.email})`);
        
        // Get all permissions for this user
        const userPermissions = new Set();
        const userRoles = [];

        for (const userRole of user.userRoles) {
          const role = userRole.role;
          userRoles.push(role.name);
          
          for (const rp of role.permissions) {
            const permission = rp.permission;
            const permissionKey = `${permission.moduleKey}:${permission.action}`;
            userPermissions.add(permissionKey);
          }
        }

        console.log(`      Roles: ${userRoles.join(', ')}`);
        console.log(`      Total Permissions: ${userPermissions.size}`);

        // Check for missing permissions
        const missingPermissions = [];
        const userPermissionArray = Array.from(userPermissions);

        for (const permission of uniquePermissions) {
          const permissionKey = `${permission.moduleKey}:${permission.action}`;
          if (!userPermissions.has(permissionKey)) {
            missingPermissions.push(permissionKey);
          }
        }

        if (missingPermissions.length > 0) {
          console.log(`      ❌ Missing ${missingPermissions.length} permissions:`);
          missingPermissions.forEach(perm => {
            console.log(`         - ${perm}`);
          });
          totalIssues++;
          detailedReport.push({
            tenant: tenant.name,
            user: user.email,
            issue: `Missing ${missingPermissions.length} permissions`,
            missingPermissions: missingPermissions,
            severity: 'MEDIUM'
          });
        } else {
          console.log(`      ✅ Has all available permissions!`);
          detailedReport.push({
            tenant: tenant.name,
            user: user.email,
            issue: 'All permissions present',
            severity: 'NONE'
          });
        }

        // Check for critical permissions
        const criticalPermissions = [
          'dashboard:view',
          'users:view',
          'users:create',
          'users:edit',
          'users:delete',
          'roles:view',
          'roles:create',
          'roles:edit',
          'roles:delete',
          'audit:view',
          'settings:view',
          'settings:edit'
        ];

        const missingCritical = criticalPermissions.filter(perm => 
          !userPermissionArray.includes(perm)
        );

        if (missingCritical.length > 0) {
          console.log(`      ⚠️  Missing critical permissions:`);
          missingCritical.forEach(perm => {
            console.log(`         - ${perm}`);
          });
          totalIssues++;
          detailedReport.push({
            tenant: tenant.name,
            user: user.email,
            issue: `Missing ${missingCritical.length} critical permissions`,
            missingPermissions: missingCritical,
            severity: 'HIGH'
          });
        } else {
          console.log(`      ✅ Has all critical permissions`);
        }

        console.log('');
      }
    }

    // Summary
    console.log('📊 SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tenants: ${tenants.length}`);
    console.log(`Total Available Permissions: ${uniquePermissions.length} (${allAvailablePermissions.length} total including duplicates)`);
    console.log(`Total Issues Found: ${totalIssues}`);

    const issuesBySeverity = detailedReport.reduce((acc, report) => {
      if (report.severity !== 'NONE') {
        acc[report.severity] = (acc[report.severity] || 0) + 1;
      }
      return acc;
    }, {});

    console.log('\nIssues by Severity:');
    Object.entries(issuesBySeverity).forEach(([severity, count]) => {
      console.log(`   ${severity}: ${count}`);
    });

    // Show detailed issues
    if (totalIssues > 0) {
      console.log('\n🔍 DETAILED ISSUES:');
      console.log('='.repeat(50));
      
      detailedReport
        .filter(report => report.severity !== 'NONE')
        .forEach((report, index) => {
          console.log(`${index + 1}. ${report.tenant} - ${report.user}`);
          console.log(`   Issue: ${report.issue}`);
          console.log(`   Severity: ${report.severity}`);
          if (report.missingPermissions) {
            console.log(`   Missing: ${report.missingPermissions.join(', ')}`);
          }
          console.log('');
        });
    } else {
      console.log('\n✅ All Tenant Admins have complete permissions!');
    }

    // Save detailed report to file
    const fs = require('fs');
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTenants: tenants.length,
        totalPermissions: allAvailablePermissions.length,
        totalIssues: totalIssues,
        issuesBySeverity
      },
      detailedReport,
      allAvailablePermissions: uniquePermissions.map(p => `${p.moduleKey}:${p.action}`)
    };

    fs.writeFileSync(
      'tenant-admin-permissions-report.json',
      JSON.stringify(reportData, null, 2)
    );

    console.log('\n📄 Detailed report saved to: tenant-admin-permissions-report.json');

  } catch (error) {
    console.error('Error checking tenant admin permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function fixTenantAdminPermissions() {
  try {
    console.log('🔧 Fixing Tenant Admin permissions...\n');

    // Get all available permissions
    const allPermissions = await prisma.permission.findMany({
      where: { isActive: true }
    });

    // Get all tenants with admin users
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true },
      include: {
        users: {
          where: {
            isActive: true,
            userRoles: {
              some: {
                role: {
                  name: {
                    contains: 'Admin'
                  }
                }
              }
            }
          },
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: true
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

    let fixedCount = 0;

    for (const tenant of tenants) {
      console.log(`Processing tenant: ${tenant.name}`);

      for (const user of tenant.users) {
        console.log(`  Checking admin user: ${user.name} (${user.email})`);

        // Get current permissions
        const currentPermissions = new Set();
        for (const userRole of user.userRoles) {
          for (const rp of userRole.role.permissions) {
            currentPermissions.add(rp.permissionId);
          }
        }

        // Find missing permissions
        const missingPermissions = allPermissions.filter(
          permission => !currentPermissions.has(permission.id)
        );

        if (missingPermissions.length > 0) {
          console.log(`    Adding ${missingPermissions.length} missing permissions...`);

          // Find or create an admin role for this user
          let adminRole = user.userRoles.find(ur => 
            ur.role.name.toLowerCase().includes('admin')
          )?.role;

          if (!adminRole) {
            // Create a new admin role
            adminRole = await prisma.role.create({
              data: {
                name: 'Tenant Admin',
                description: 'Full administrative access for tenant',
                tenantId: tenant.id,
                isDefault: false,
                isSystem: false
              }
            });

            // Assign the role to the user
            await prisma.userRole.create({
              data: {
                userId: user.id,
                roleId: adminRole.id
              }
            });
          }

          // Add missing permissions to the admin role
          const permissionAssignments = missingPermissions.map(permission => ({
            roleId: adminRole.id,
            permissionId: permission.id
          }));

          await prisma.rolePermission.createMany({
            data: permissionAssignments,
            skipDuplicates: true
          });

          console.log(`    ✅ Added ${missingPermissions.length} permissions to role: ${adminRole.name}`);
          fixedCount++;
        } else {
          console.log(`    ✅ User already has all permissions`);
        }
      }
    }

    console.log(`\n✅ Fixed permissions for ${fixedCount} admin users`);

  } catch (error) {
    console.error('Error fixing tenant admin permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
const command = process.argv[2];

if (command === 'fix') {
  fixTenantAdminPermissions();
} else {
  checkTenantAdminPermissions();
} 