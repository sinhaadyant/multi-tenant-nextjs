import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDashboardData() {
  try {
    console.log('🧪 Testing dashboard data structure...');

    // Test tenant statistics
    const tenantStats = await prisma.tenant.groupBy({
      by: ['isActive'],
      _count: {
        id: true,
      },
    });
    console.log('✅ Tenant stats:', tenantStats);

    // Test user statistics
    const userStats = await prisma.user.groupBy({
      by: ['isActive'],
      _count: {
        id: true,
      },
    });
    console.log('✅ User stats:', userStats);

    // Test SuperAdmin count
    const superAdminCount = await prisma.superAdmin.count({
      where: {
        isActive: true,
      },
    });
    console.log('✅ SuperAdmin count:', superAdminCount);

    // Test recent activity
    const recentActivity = await prisma.auditLog.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        tenant: {
          select: {
            name: true,
            slug: true,
          },
        },
        superAdmin: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
    console.log('✅ Recent activity count:', recentActivity.length);
    console.log('✅ Sample activity:', recentActivity[0]);

    // Test top tenants
    const topTenants = await prisma.tenant.findMany({
      take: 3,
      orderBy: {
        users: {
          _count: 'desc',
        },
      },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });
    console.log('✅ Top tenants:', topTenants.map(t => ({ name: t.name, userCount: t._count.users })));

    // Test role distribution
    const roleDistribution = await prisma.role.groupBy({
      by: ['name'],
      _count: {
        id: true,
      },
    });
    console.log('✅ Role distribution:', roleDistribution);

    // Test plan distribution
    const planDistribution = await prisma.tenant.groupBy({
      by: ['plan'],
      _count: {
        id: true,
      },
    });
    console.log('✅ Plan distribution:', planDistribution);

    // Test user signups over time
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    const userSignups = await prisma.user.groupBy({
      by: ['createdAt'],
      _count: {
        id: true,
      },
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    console.log('✅ User signups over time:', userSignups.length, 'data points');

    // Test tenant activity over time
    const tenantActivity = await prisma.auditLog.groupBy({
      by: ['createdAt'],
      _count: {
        id: true,
      },
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    console.log('✅ Tenant activity over time:', tenantActivity.length, 'data points');

    console.log('\n🎉 Dashboard data test completed successfully!');
    console.log('📊 Summary:');
    console.log(`- Total tenants: ${tenantStats.reduce((sum, stat) => sum + (stat._count?.id || 0), 0)}`);
    console.log(`- Total users: ${userStats.reduce((sum, stat) => sum + (stat._count?.id || 0), 0)}`);
    console.log(`- SuperAdmins: ${superAdminCount}`);
    console.log(`- Recent activities: ${recentActivity.length}`);
    console.log(`- Roles: ${roleDistribution.length} different types`);
    console.log(`- Plans: ${planDistribution.length} different plans`);

  } catch (error) {
    console.error('❌ Error testing dashboard data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDashboardData(); 