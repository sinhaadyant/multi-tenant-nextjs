#!/usr/bin/env tsx

import axios from 'axios';

async function testTenantsAPI() {
  console.log('🔍 Testing Tenants API...');

  try {
    // Test the tenants API endpoint
    const response = await axios.get('http://localhost:3000/api/superadmin/tenants?page=1&limit=10');
    
    console.log('📋 Full API Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    console.log('\n🔍 Response Structure Analysis:');
    console.log('response.data.success:', response.data.success);
    console.log('response.data.status:', response.data.status);
    console.log('response.data.message:', response.data.message);
    console.log('response.data.data:', response.data.data);
    console.log('response.data.data.tenants:', response.data.data?.tenants);
    console.log('response.data.data.stats:', response.data.data?.stats);
    console.log('response.data.data.pagination:', response.data.data?.pagination);
    
    if (response.data.data?.tenants) {
      console.log('\n📊 Tenants Data:');
      console.log('Number of tenants:', response.data.data.tenants.length);
      response.data.data.tenants.forEach((tenant: any, index: number) => {
        console.log(`${index + 1}. ${tenant.name} (${tenant.slug}) - ${tenant.isActive ? 'Active' : 'Inactive'}`);
      });
    }
    
    if (response.data.data?.stats) {
      console.log('\n📈 Stats Data:');
      console.log('Total:', response.data.data.stats.total);
      console.log('Active:', response.data.data.stats.active);
      console.log('Inactive:', response.data.data.stats.inactive);
    }
    
    if (response.data.data?.pagination) {
      console.log('\n📄 Pagination Data:');
      console.log('Page:', response.data.data.pagination.page);
      console.log('Limit:', response.data.data.pagination.limit);
      console.log('Total Pages:', response.data.data.pagination.totalPages);
      console.log('Total Records:', response.data.data.pagination.totalRecords);
    }
    
  } catch (error: any) {
    console.error('❌ Error testing tenants API:', error.response?.data || error.message);
  }
}

testTenantsAPI(); 