#!/usr/bin/env tsx

/**
 * Test Tenant Scenarios Script
 * 
 * This script creates test scenarios for different tenant and user statuses
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testTenantScenarios() {
  console.log('🧪 Creating test tenant scenarios...\n');

  try {
    // Create a disabled tenant
    const disabledTenant = await prisma.tenant.upsert({
      where: { slug: 'disabled-tenant' },
      update: { isActive: false },
      create: {
        name: 'Disabled Test Tenant',
        slug: 'disabled-tenant',
        domain: 'disabled.example.com',
        description: 'A test tenant that is disabled',
        plan: 'starter',
        region: 'US East',
        features: JSON.stringify(['basic_analytics']),
        isActive: false
      }
    });

    // Create a disabled user in active tenant
    const activeTenant = await prisma.tenant.findFirst({
      where: { slug: 'acme' }
    });

    if (activeTenant) {
      const disabledUser = await prisma.user.upsert({
        where: { 
          email_tenantId: {
            email: 'disabled@acme.com',
            tenantId: activeTenant.id
          }
        },
        update: { isActive: false },
        create: {
          name: 'Disabled User',
          email: 'disabled@acme.com',
          password: await bcrypt.hash('user123', 10),
          tenantId: activeTenant.id,
          isActive: false
        }
      });

      // Assign role to disabled user
      const userRole = await prisma.role.findFirst({
        where: {
          name: 'User',
          tenantId: activeTenant.id
        }
      });

      if (userRole) {
        await prisma.userRole.upsert({
          where: {
            userId_roleId: {
              userId: disabledUser.id,
              roleId: userRole.id
            }
          },
          update: {},
          create: {
            userId: disabledUser.id,
            roleId: userRole.id,
            assignedBy: 'system'
          }
        });
      }
    }

    console.log('✅ Test scenarios created successfully!');
    console.log('\n📋 Test Scenarios:');
    console.log('\n1. Invalid Tenant URL:');
    console.log('   URL: http://localhost:3000/invalid-tenant/login');
    console.log('   Expected: "Invalid Login URL" error');
    
    console.log('\n2. Disabled Tenant:');
    console.log('   URL: http://localhost:3000/disabled-tenant/login');
    console.log('   Expected: "Tenant Disabled" error with tenant info');
    
    console.log('\n3. Disabled User:');
    console.log('   URL: http://localhost:3000/acme/login');
    console.log('   Credentials: disabled@acme.com / user123');
    console.log('   Expected: "Your account has been disabled" error');
    
    console.log('\n4. Valid Login:');
    console.log('   URL: http://localhost:3000/acme/login');
    console.log('   Credentials: admin@acme.com / admin123');
    console.log('   Expected: Successful login with tenant info displayed');

  } catch (error) {
    console.error('❌ Error creating test scenarios:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test scenarios
testTenantScenarios(); 