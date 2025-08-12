import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testGrowthCalculations() {
  console.log('🧪 Testing Growth Calculations...\n');

  try {
    // Get current date and calculate periods
    const now = new Date();
    const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 14 days ago
    const previousEndDate = new Date(startDate.getTime()); // 7 days ago

    console.log('📅 Date Ranges:');
    console.log(`Current Period: ${startDate.toISOString()} to ${now.toISOString()}`);
    console.log(`Previous Period: ${previousStartDate.toISOString()} to ${previousEndDate.toISOString()}\n`);

    // Get current period data
    const currentTenantStats = await prisma.tenant.groupBy({
      by: ['isActive'],
      _count: {
        id: true,
      },
    });

    const currentUserStats = await prisma.user.groupBy({
      by: ['isActive'],
      _count: {
        id: true,
      },
    });

    // Get previous period data
    const previousTenantStats = await prisma.tenant.groupBy({
      by: ['isActive'],
      _count: {
        id: true,
      },
      where: {
        createdAt: {
          gte: previousStartDate,
          lt: previousEndDate,
        },
      },
    });

    const previousUserStats = await prisma.user.groupBy({
      by: ['isActive'],
      _count: {
        id: true,
      },
      where: {
        createdAt: {
          gte: previousStartDate,
          lt: previousEndDate,
        },
      },
    });

    // Calculate totals
    const currentTenants = currentTenantStats.reduce((sum, stat) => sum + (stat._count?.id || 0), 0);
    const currentUsers = currentUserStats.reduce((sum, stat) => sum + (stat._count?.id || 0), 0);
    const previousTenants = previousTenantStats.reduce((sum, stat) => sum + (stat._count?.id || 0), 0);
    const previousUsers = previousUserStats.reduce((sum, stat) => sum + (stat._count?.id || 0), 0);

    // Calculate growth percentages
    const calculateGrowth = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100 * 10) / 10;
    };

    const tenantGrowth = calculateGrowth(currentTenants, previousTenants);
    const userGrowth = calculateGrowth(currentUsers, previousUsers);

    console.log('📊 Current Period Totals:');
    console.log(`Total Tenants: ${currentTenants}`);
    console.log(`Total Users: ${currentUsers}\n`);

    console.log('📊 Previous Period Totals:');
    console.log(`Total Tenants: ${previousTenants}`);
    console.log(`Total Users: ${previousUsers}\n`);

    console.log('📈 Growth Calculations:');
    console.log(`Tenant Growth: ${tenantGrowth}%`);
    console.log(`User Growth: ${userGrowth}%\n`);

    console.log('✅ Growth calculation test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing growth calculations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testGrowthCalculations();
