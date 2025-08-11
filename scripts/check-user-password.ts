#!/usr/bin/env tsx

import { prisma } from '../src/lib/prisma';

async function checkUserPassword() {
  console.log('🔍 Checking user password...');

  try {
    // Find the techcorp admin user
    const user = await prisma.user.findFirst({
      where: {
        email: 'admin@techcorp.com',
        tenant: {
          slug: 'techcorp'
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        isActive: true,
        tenant: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Active: ${user.isActive}`);
    console.log(`   Tenant: ${user.tenant.name} (${user.tenant.slug})`);
    console.log(`   Password hash: ${user.password.substring(0, 20)}...`);
    console.log(`   Password hash length: ${user.password.length}`);

    // Check if password is hashed (should start with $2b$ or similar)
    if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
      console.log('✅ Password is properly hashed');
    } else {
      console.log('❌ Password is not hashed - this is a problem!');
    }

  } catch (error) {
    console.error('❌ Error checking user password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserPassword(); 