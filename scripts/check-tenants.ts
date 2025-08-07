#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTenants() {
  console.log('🔍 Checking tenant data in database...');

  try {
    // Check total tenant count
    const totalTenants = await prisma.tenant.count();
    console.log(`📊 Total tenants in database: ${totalTenants}`);

    // Get all tenants with basic info
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { users: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('\n📋 Tenant Details:');
    tenants.forEach((tenant, index) => {
      console.log(`${index + 1}. ${tenant.name} (${tenant.slug})`);
      console.log(`   Status: ${tenant.isActive ? 'Active' : 'Inactive'}`);
      console.log(`   Users: ${tenant._count.users}`);
      console.log(`   Created: ${tenant.createdAt.toLocaleDateString()}`);
      console.log('');
    });

    // Check SuperAdmin
    const superAdmin = await prisma.superAdmin.findFirst({
      where: { email: 'admin@superadmin.com' }
    });

    if (superAdmin) {
      console.log('✅ SuperAdmin exists:', superAdmin.email);
    } else {
      console.log('❌ SuperAdmin not found');
    }

    // Check roles
    const roles = await prisma.role.findMany();
    console.log(`\n👥 Roles found: ${roles.length}`);
    roles.forEach(role => {
      console.log(`   - ${role.name} (${role.isGlobal ? 'Global' : 'Tenant'})`);
    });

  } catch (error) {
    console.error('❌ Error checking tenants:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTenants()
  .then(() => {
    console.log('✅ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  }); 