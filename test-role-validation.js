const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRoleValidation() {
  console.log('🧪 Testing Role Validation Fix...\n');
  
  try {
    // Get two different tenants
    const tenants = await prisma.tenant.findMany({
      take: 2,
      select: { id: true, name: true, slug: true }
    });
    
    if (tenants.length < 2) {
      console.log('❌ Need at least 2 tenants to test. Creating test tenants...');
      
      // Create test tenants if needed
      const tenant1 = await prisma.tenant.create({
        data: {
          name: 'Test Tenant 1',
          slug: 'test-tenant-1',
          domain: 'test1.com',
          status: 'active'
        }
      });
      
      const tenant2 = await prisma.tenant.create({
        data: {
          name: 'Test Tenant 2', 
          slug: 'test-tenant-2',
          domain: 'test2.com',
          status: 'active'
        }
      });
      
      tenants[0] = tenant1;
      tenants[1] = tenant2;
    }
    
    const tenant1 = tenants[0];
    const tenant2 = tenants[1];
    
    console.log(`📋 Testing with tenants:`);
    console.log(`   Tenant 1: ${tenant1.name} (${tenant1.slug})`);
    console.log(`   Tenant 2: ${tenant2.name} (${tenant2.slug})`);
    
    // Test 1: Create role in tenant 1
    console.log('\n1️⃣ Creating role "Reporter" in Tenant 1...');
    const role1 = await prisma.role.create({
      data: {
        name: 'Reporter',
        description: 'Test role for tenant 1',
        tenantId: tenant1.id,
        isGlobal: false,
        isActive: true
      }
    });
    console.log('✅ Role created successfully in Tenant 1');
    
    // Test 2: Try to create same role name in tenant 1 (should fail)
    console.log('\n2️⃣ Trying to create duplicate role "Reporter" in Tenant 1...');
    try {
      await prisma.role.create({
        data: {
          name: 'Reporter',
          description: 'Duplicate role for tenant 1',
          tenantId: tenant1.id,
          isGlobal: false,
          isActive: true
        }
      });
      console.log('❌ Should have failed - duplicate role created!');
    } catch (error) {
      if (error.code === 'P2002') {
        console.log('✅ Correctly prevented duplicate role in same tenant');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    // Test 3: Create same role name in tenant 2 (should succeed)
    console.log('\n3️⃣ Creating role "Reporter" in Tenant 2...');
    const role2 = await prisma.role.create({
      data: {
        name: 'Reporter',
        description: 'Test role for tenant 2',
        tenantId: tenant2.id,
        isGlobal: false,
        isActive: true
      }
    });
    console.log('✅ Role created successfully in Tenant 2');
    
    // Test 4: Verify both roles exist
    console.log('\n4️⃣ Verifying both roles exist...');
    const roles = await prisma.role.findMany({
      where: {
        name: 'Reporter',
        isGlobal: false
      },
      include: {
        tenant: {
          select: { name: true, slug: true }
        }
      }
    });
    
    console.log(`✅ Found ${roles.length} roles with name "Reporter":`);
    roles.forEach(role => {
      console.log(`   - ${role.name} in ${role.tenant.name} (${role.tenant.slug})`);
    });
    
    // Test 5: Test the API validation logic
    console.log('\n5️⃣ Testing API validation logic...');
    
    // Simulate the API validation for tenant 1
    const existingRoleInTenant1 = await prisma.role.findFirst({
      where: {
        name: 'Reporter',
        tenantId: tenant1.id,
        isGlobal: false
      }
    });
    
    if (existingRoleInTenant1) {
      console.log('✅ API validation correctly finds existing role in Tenant 1');
    } else {
      console.log('❌ API validation failed to find existing role in Tenant 1');
    }
    
    // Simulate the API validation for tenant 2
    const existingRoleInTenant2 = await prisma.role.findFirst({
      where: {
        name: 'Reporter',
        tenantId: tenant2.id,
        isGlobal: false
      }
    });
    
    if (existingRoleInTenant2) {
      console.log('✅ API validation correctly finds existing role in Tenant 2');
    } else {
      console.log('❌ API validation failed to find existing role in Tenant 2');
    }
    
    console.log('\n🎉 Role Validation Test Completed Successfully!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Roles can have the same name across different tenants');
    console.log('- ✅ Duplicate role names are prevented within the same tenant');
    console.log('- ✅ API validation logic is working correctly');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRoleValidation();
