import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSampleReports() {
  console.log('📊 Creating sample reports...\n');

  try {
    // Get the first SuperAdmin
    const superAdmin = await prisma.superAdmin.findFirst();
    
    if (!superAdmin) {
      console.log('❌ No SuperAdmin found. Please create a SuperAdmin first.');
      return;
    }

    console.log(`👤 Using SuperAdmin: ${superAdmin.name} (${superAdmin.email})\n`);

    // Sample report data
    const sampleReports = [
      {
        name: 'User Activity Report - January 2024',
        type: 'user_activity',
        status: 'completed',
        data: JSON.stringify({
          dateFrom: '2024-01-01T00:00:00.000Z',
          dateTo: '2024-01-31T23:59:59.999Z',
          format: 'csv',
          filters: { includeInactive: false }
        }),
        superAdminId: superAdmin.id
      },
      {
        name: 'Tenant Summary Report - Q1 2024',
        type: 'tenant_summary',
        status: 'completed',
        data: JSON.stringify({
          dateFrom: '2024-01-01T00:00:00.000Z',
          dateTo: '2024-03-31T23:59:59.999Z',
          format: 'excel',
          filters: { includeMetrics: true }
        }),
        superAdminId: superAdmin.id
      },
      {
        name: 'Login History Report - February 2024',
        type: 'login_history',
        status: 'completed',
        data: JSON.stringify({
          dateFrom: '2024-02-01T00:00:00.000Z',
          dateTo: '2024-02-29T23:59:59.999Z',
          format: 'csv',
          filters: { includeFailedLogins: true }
        }),
        superAdminId: superAdmin.id
      },
      {
        name: 'Audit Logs Report - March 2024',
        type: 'audit_logs',
        status: 'generating',
        data: JSON.stringify({
          dateFrom: '2024-03-01T00:00:00.000Z',
          dateTo: '2024-03-31T23:59:59.999Z',
          format: 'pdf',
          filters: { includeSystemLogs: true }
        }),
        superAdminId: superAdmin.id
      },
      {
        name: 'System Health Report - Current',
        type: 'system_health',
        status: 'completed',
        data: JSON.stringify({
          dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          dateTo: new Date().toISOString(),
          format: 'csv',
          filters: { includePerformanceMetrics: true }
        }),
        superAdminId: superAdmin.id
      }
    ];

    // Create reports
    const createdReports = [];
    for (const reportData of sampleReports) {
      const report = await prisma.report.create({
        data: reportData,
        include: {
          superAdmin: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });
      
      createdReports.push(report);
      console.log(`✅ Created report: ${report.name} (${report.type}) - Status: ${(report as any).status}`);
    }

    console.log(`\n🎉 Successfully created ${createdReports.length} sample reports!`);
    
    // Show summary
    const totalReports = await prisma.report.count({
      where: { superAdminId: superAdmin.id }
    });
    
    console.log(`📊 Total reports for SuperAdmin: ${totalReports}`);

  } catch (error) {
    console.error('❌ Error creating sample reports:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createSampleReports();
