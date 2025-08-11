#!/usr/bin/env tsx

import { prisma } from '../src/lib/prisma';

async function listTechcorpUsers() {
  console.log('🔍 Listing TechCorp users...');

  try {
    const users = await prisma.user.findMany({
      where: {
        tenant: {
          slug: 'techcorp'
        }
      },
      include: {
        tenant: {
          select: {
            name: true,
            slug: true
          }
        },
        userRoles: {
          include: {
            role: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    console.log(`Found ${users.length} users in TechCorp:`);
    
    users.forEach(user => {
      console.log(`\n👤 ${user.name} (${user.email})`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Tenant: ${user.tenant.name}`);
      console.log(`   Roles: ${user.userRoles.map(ur => ur.role.name).join(', ')}`);
      console.log(`   Password hash: ${user.password.substring(0, 20)}...`);
    });

  } catch (error) {
    console.error('❌ Error listing users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listTechcorpUsers(); 