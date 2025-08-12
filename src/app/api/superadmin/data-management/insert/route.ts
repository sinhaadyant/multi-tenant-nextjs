import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';
import { hashPassword } from '@/lib/jwt';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { subDays, addDays, format } from 'date-fns';

// Helper function to get or create default roles for a tenant
async function getOrCreateDefaultRoles(tenantId: string) {
  // Check if roles already exist for this tenant
  const existingRoles = await prisma.role.findMany({
    where: { tenantId }
  });

  if (existingRoles.length > 0) {
    return existingRoles;
  }

  // Create default roles if none exist
  const defaultRoles = [
    {
      name: 'Admin',
      description: 'Full administrative access',
      color: '#dc2626',
      priority: 1
    },
    {
      name: 'Manager',
      description: 'Management level access',
      color: '#ea580c',
      priority: 2
    },
    {
      name: 'User',
      description: 'Standard user access',
      color: '#2563eb',
      priority: 3
    }
  ];

  const createdRoles = [];
  for (const roleData of defaultRoles) {
    const role = await prisma.role.create({
      data: {
        ...roleData,
        tenantId,
        isActive: true,
        isDefault: roleData.name === 'User', // User role is default
        isSystem: false
      }
    });
    createdRoles.push(role);
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`✅ Created ${createdRoles.length} default roles for tenant`);
  }

  return createdRoles;
}

// POST /api/superadmin/data-management/insert - Insert sample data
export const POST = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Inserting sample data');
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ Authentication failed for data management API');
    }
    return authResult;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ SuperAdmin authenticated for data management API');
  }

  const { 
    insertTenants = false, 
    insertUsers = false, 
    tenantsCount = 5, 
    usersPerTenant = 10,
    timeRange = 'today',
    backfillDays = 0 
  } = await req.json();

  if (!insertTenants && !insertUsers) {
    return createErrorResponse(
      'At least one data type must be selected for insertion',
      400
    );
  }

  try {
    const results = {
      tenants: { created: 0, errors: 0 },
      users: { created: 0, errors: 0 }
    };

    // Calculate date range for backfilling
    const now = new Date();
    let startDate = now;
    let endDate = now;

    switch (timeRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'last15days':
        startDate = subDays(now, 15);
        break;
      case 'last30days':
        startDate = subDays(now, 30);
        break;
      case 'last90days':
        startDate = subDays(now, 90);
        break;
      default:
        startDate = now;
        endDate = now;
    }

    // Apply backfilling
    if (backfillDays > 0) {
      startDate = subDays(startDate, backfillDays);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('📅 Date range:', { startDate, endDate, timeRange, backfillDays });
    }

    // Insert sample tenants
    if (insertTenants) {
      const tenantRegions = ['US East', 'US West', 'EU West', 'Asia Pacific', 'South America'];
      const tenantPlans = ['starter', 'professional', 'enterprise'];
      const tenantFeatures = [
        ['analytics', 'support'],
        ['analytics', 'support', 'api'],
        ['analytics', 'support', 'api', 'custom-domain']
      ];

      for (let i = 0; i < tenantsCount; i++) {
        try {
          // Generate random creation date within the specified range
          const randomDays = Math.floor(Math.random() * (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          const createdAt = addDays(startDate, randomDays);

          const tenantData = {
            name: `Sample Tenant ${i + 1}`,
            slug: `sample-tenant-${i + 1}-${Date.now()}`,
            domain: `sample-tenant-${i + 1}.example.com`,
            description: `Sample tenant for testing purposes - ${i + 1}`,
            plan: tenantPlans[Math.floor(Math.random() * tenantPlans.length)],
            region: tenantRegions[Math.floor(Math.random() * tenantRegions.length)],
            features: JSON.stringify(tenantFeatures[Math.floor(Math.random() * tenantFeatures.length)]),
            isActive: Math.random() > 0.2, // 80% active
            createdAt,
            updatedAt: createdAt
          };

          const tenant = await prisma.tenant.create({
            data: tenantData
          });

          results.tenants.created++;

          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Created tenant: ${tenant.name} (${tenant.slug})`);
          }
        } catch (error) {
          results.tenants.errors++;
          if (process.env.NODE_ENV === 'development') {
            console.error(`❌ Error creating tenant ${i + 1}:`, error);
          }
        }
      }
    }

    // Insert sample users
    if (insertUsers) {
      const existingTenants = await prisma.tenant.findMany({
        select: { id: true, name: true }
      });

      if (existingTenants.length === 0) {
        return createErrorResponse(
          'No tenants found. Please create tenants first or enable tenant insertion.',
          400
        );
      }

      const userNames = [
        'John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'David Brown',
        'Emily Davis', 'Chris Miller', 'Lisa Garcia', 'Tom Anderson', 'Amy Taylor'
      ];

      for (const tenant of existingTenants) {
        // Get or create default roles for this tenant
        const defaultRoles = await getOrCreateDefaultRoles(tenant.id);
        
        for (let i = 0; i < usersPerTenant; i++) {
          try {
            // Generate random creation date within the specified range
            const randomDays = Math.floor(Math.random() * (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            const createdAt = addDays(startDate, randomDays);

            const userName = userNames[Math.floor(Math.random() * userNames.length)];
            const userEmail = `${userName.toLowerCase().replace(' ', '.')}${i + 1}@${tenant.name.toLowerCase().replace(' ', '')}.com`;
            const hashedPassword = await hashPassword('password123');

            // Randomly select a role
            const selectedRole = defaultRoles[Math.floor(Math.random() * defaultRoles.length)];

            const userData = {
              name: userName,
              email: userEmail,
              password: hashedPassword,
              tenantId: tenant.id,
              isActive: Math.random() > 0.1, // 90% active
              createdAt,
              updatedAt: createdAt
            };

            const user = await prisma.user.create({
              data: userData
            });

            // Assign role to user
            await prisma.userRole.create({
              data: {
                userId: user.id,
                roleId: selectedRole.id,
                assignedAt: createdAt,
                assignedBy: authResult.id
              }
            });

            results.users.created++;

            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ Created user: ${user.name} (${user.email}) with role: ${selectedRole.name} for tenant: ${tenant.name}`);
            }
          } catch (error) {
            results.users.errors++;
            if (process.env.NODE_ENV === 'development') {
              console.error(`❌ Error creating user ${i + 1} for tenant ${tenant.name}:`, error);
            }
          }
        }
      }
    }

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult,
      'sample_data.inserted',
      {
        insertTenants,
        insertUsers,
        tenantsCount,
        usersPerTenant,
        timeRange,
        backfillDays,
        results
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Sample data insertion completed:', results);
    }

    return createSuccessResponse({
      results,
      summary: {
        totalTenantsCreated: results.tenants.created,
        totalUsersCreated: results.users.created,
        totalErrors: results.tenants.errors + results.users.errors,
        timeRange,
        backfillDays
      }
    }, 'Sample data inserted successfully');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error inserting sample data:', error);
    }
    throw error;
  }
});
