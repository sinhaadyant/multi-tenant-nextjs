import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function testAuth() {
  try {
    console.log('🔍 Testing authentication...');
    
    // Check if there are any superadmin users
    const superAdmins = await prisma.superAdmin.findMany({
      where: { isActive: true },
      select: { id: true, email: true, name: true }
    });
    
    console.log('👥 Found superadmins:', superAdmins);
    
    if (superAdmins.length === 0) {
      console.log('❌ No active superadmin users found');
      return;
    }
    
    // Create a test token for the first superadmin
    const superAdmin = superAdmins[0];
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    
    const token = jwt.sign(
      {
        id: superAdmin.id,
        email: superAdmin.email,
        role: 'superadmin'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('🔐 Test token created for:', superAdmin.email);
    console.log('📋 Token:', token);
    
    // Test the token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token verified:', decoded);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth(); 