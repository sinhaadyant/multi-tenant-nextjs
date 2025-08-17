const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugAudit() {
  try {
    console.log('🔍 Debugging audit logging...\n');

    // Get a user to test with
    const user = await prisma.user.findFirst({
      where: { email: 'superadmin@example.com' },
    });

    console.log('User found:', {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      isSuperadmin: user.isSuperadmin,
    });

    // Test audit logging with null tenantId
    console.log('\nTesting audit logging with null tenantId...');
    try {
      const auditLog = await prisma.auditLog.create({
        data: {
          userId: user.id,
          tenantId: null, // This should work
          action: 'TEST_LOGIN',
          ipAddress: '127.0.0.1',
          details: { test: true },
        },
      });
      console.log(
        '✅ Audit log created successfully with null tenantId:',
        auditLog.id
      );
    } catch (error) {
      console.log(
        '❌ Failed to create audit log with null tenantId:',
        error.message
      );
    }

    // Test audit logging with user.id as tenantId (the old bug)
    console.log('\nTesting audit logging with user.id as tenantId...');
    try {
      const auditLog = await prisma.auditLog.create({
        data: {
          userId: user.id,
          tenantId: user.id, // This should fail
          action: 'TEST_LOGIN_BUG',
          ipAddress: '127.0.0.1',
          details: { test: true },
        },
      });
      console.log(
        '❌ Unexpected success with user.id as tenantId:',
        auditLog.id
      );
    } catch (error) {
      console.log(
        '✅ Correctly failed with user.id as tenantId:',
        error.message
      );
    }

    // Test audit logging with user.tenantId
    console.log('\nTesting audit logging with user.tenantId...');
    try {
      const auditLog = await prisma.auditLog.create({
        data: {
          userId: user.id,
          tenantId: user.tenantId, // This should work
          action: 'TEST_LOGIN_CORRECT',
          ipAddress: '127.0.0.1',
          details: { test: true },
        },
      });
      console.log(
        '✅ Audit log created successfully with user.tenantId:',
        auditLog.id
      );
    } catch (error) {
      console.log(
        '❌ Failed to create audit log with user.tenantId:',
        error.message
      );
    }

    // Get a tenant user to test with
    const tenantUser = await prisma.user.findFirst({
      where: { email: 'admin@tenant-a.com' },
    });

    console.log('\nTenant user found:', {
      id: tenantUser.id,
      email: tenantUser.email,
      tenantId: tenantUser.tenantId,
      isSuperadmin: tenantUser.isSuperadmin,
    });

    // Test audit logging with tenant user
    console.log('\nTesting audit logging with tenant user...');
    try {
      const auditLog = await prisma.auditLog.create({
        data: {
          userId: tenantUser.id,
          tenantId: tenantUser.tenantId,
          action: 'TEST_LOGIN_TENANT',
          ipAddress: '127.0.0.1',
          details: { test: true },
        },
      });
      console.log(
        '✅ Audit log created successfully with tenant user:',
        auditLog.id
      );
    } catch (error) {
      console.log(
        '❌ Failed to create audit log with tenant user:',
        error.message
      );
    }
  } catch (error) {
    console.error('Error debugging audit:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAudit();
