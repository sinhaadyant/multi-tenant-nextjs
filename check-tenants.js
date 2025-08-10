const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTenants() {
  try {
    const tenants = await prisma.tenant.findMany();
    console.log('Tenants in database:');
    tenants.forEach(tenant => {
      console.log(`- ${tenant.name} (${tenant.slug}) - Active: ${tenant.isActive}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTenants(); 