import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testReportsAPI() {
  console.log('🧪 Testing Reports API...\n');

  try {
    // Test 1: Check reports count
    const reportCount = await prisma.report.count();
    console.log(`📊 Total reports in database: ${reportCount}`);

    // Test 2: Check SuperAdmin count
    const superAdminCount = await prisma.superAdmin.count();
    console.log(`👤 Total SuperAdmins: ${superAdminCount}`);

    // Test 3: Get first SuperAdmin
    const superAdmin = await prisma.superAdmin.findFirst();
    if (superAdmin) {
      console.log(`👤 First SuperAdmin: ${superAdmin.name} (${superAdmin.email})`);
      
      // Test 4: Get reports for this SuperAdmin
      const adminReports = await prisma.report.findMany({
        where: { superAdminId: superAdmin.id },
        take: 3
      });
      
      console.log(`📋 Reports for SuperAdmin: ${adminReports.length}`);
      
      adminReports.forEach((report, index) => {
        console.log(`  ${index + 1}. ${report.name} (${report.type})`);
      });
    }

    // Test 5: Check report types
    const reportTypes = await prisma.report.groupBy({
      by: ['type'],
      _count: { type: true }
    });
    
    console.log('\n📈 Report types:');
    reportTypes.forEach(type => {
      console.log(`  ${type.type}: ${type._count.type}`);
    });

    console.log('\n✅ Reports API test completed!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testReportsAPI();
