#!/usr/bin/env tsx

import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/lib/jwt';
import bcrypt from 'bcrypt';

async function updateAdminPassword() {
  console.log('🔧 Updating admin password...');

  try {
    // Find the techcorp admin user
    const user = await prisma.user.findFirst({
      where: {
        email: 'admin@techcorp.com',
        tenant: {
          slug: 'techcorp'
        }
      }
    });

    if (!user) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('👤 Found admin user:', user.email);

    // Update password to 'password123'
    const newPasswordHash = await hashPassword('password123');
    
    await prisma.user.update({
      where: { id: user.id },
      data: { password: newPasswordHash }
    });

    console.log('✅ Admin password updated to: password123');

    // Test the new password
    const testUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true }
    });

    if (testUser) {
      const isValid = await bcrypt.compare('password123', testUser.password);
      console.log('Password test result:', isValid ? '✅' : '❌');
    }

  } catch (error) {
    console.error('❌ Error updating admin password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPassword(); 