import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function createNewSuperAdmin() {
  try {
    console.log('🔐 Creating new SuperAdmin account...\n');

    // Generate unique email and credentials
    const timestamp = Date.now();
    const email = `superadmin_${timestamp}@example.com`;
    const password = `SuperAdmin${timestamp}`;
    const name = `Super Admin ${timestamp}`;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Check if email already exists
    const existingSuperAdmin = await prisma.superAdmin.findUnique({
      where: { email }
    });

    if (existingSuperAdmin) {
      console.log('❌ SuperAdmin with this email already exists');
      return;
    }

    // Create the new SuperAdmin
    const newSuperAdmin = await prisma.superAdmin.create({
      data: {
        email,
        name,
        password: hashedPassword,
        isActive: true,
        contactNumber: null,
        avatar: null
      }
    });

    console.log('✅ New SuperAdmin created successfully!');
    console.log('\n📋 Account Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👤 Name: ${newSuperAdmin.name}`);
    console.log(`📧 Email: ${newSuperAdmin.email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🆔 ID: ${newSuperAdmin.id}`);
    console.log(`📅 Created: ${newSuperAdmin.createdAt}`);
    console.log(`✅ Status: ${newSuperAdmin.isActive ? 'Active' : 'Inactive'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n🔐 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email: ${newSuperAdmin.email}`);
    console.log(`Password: ${password}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n🌐 Login URL: http://localhost:3000/superadmin/login');
    console.log('\n⚠️  Please save these credentials securely!');
    console.log('⚠️  You can change the password after first login.');

    // Test the credentials
    console.log('\n🧪 Testing new credentials...');
    const testSuperAdmin = await prisma.superAdmin.findUnique({
      where: { email }
    });

    if (testSuperAdmin) {
      const passwordMatch = await bcrypt.compare(password, testSuperAdmin.password);
      if (passwordMatch) {
        console.log('✅ Credentials verified successfully!');
      } else {
        console.log('❌ Password verification failed');
      }
    } else {
      console.log('❌ Could not find created SuperAdmin');
    }

  } catch (error) {
    console.error('❌ Error creating SuperAdmin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createNewSuperAdmin();
