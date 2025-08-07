#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSubdomainValidation() {
  console.log('🔍 Testing subdomain validation...');

  const testSubdomains = [
    'test-company',      // Should be available
    'techcorp',          // Should be taken (exists in DB)
    'dataflow',          // Should be taken (exists in DB)
    'new-company-123',   // Should be available
    'global-innovations', // Should be taken (exists in DB)
    'mycompany',         // Should be available
  ];

  for (const subdomain of testSubdomains) {
    try {
      // Check if subdomain already exists
      const existingTenant = await prisma.tenant.findUnique({
        where: { slug: subdomain }
      });

      const available = !existingTenant;
      
      console.log(`📝 Subdomain: "${subdomain}"`);
      console.log(`   Available: ${available ? '✅ Yes' : '❌ No'}`);
      if (!available) {
        console.log(`   Existing tenant: ${existingTenant?.name}`);
      }
      console.log('');
    } catch (error) {
      console.error(`❌ Error checking subdomain "${subdomain}":`, error);
    }
  }

  await prisma.$disconnect();
}

testSubdomainValidation()
  .then(() => {
    console.log('✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }); 