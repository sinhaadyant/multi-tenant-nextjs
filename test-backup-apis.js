const axios = require('axios');

async function testBackupAPIs() {
  const baseURL = 'http://localhost:3000/api/superadmin';

  console.log('🧪 Testing Backup APIs with Authentication...\n');

  const testCredentials = {
    email: 'admin@superadmin.com',
    password: 'AdminPass123',
    rememberMe: false
  };

  let authToken = null;

  // Step 1: Authenticate
  console.log('🔐 Step 1: Authenticating...');
  try {
    const loginResponse = await axios.post(`${baseURL}/auth/login`, testCredentials, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (loginResponse.data.success) {
      authToken = loginResponse.data.data.token;
      console.log('✅ Authentication successful!');
      console.log(`👤 User: ${loginResponse.data.data.user.name} (${loginResponse.data.data.user.email})`);
    } else {
      console.log('❌ Authentication failed:', loginResponse.data.message);
      return;
    }
  } catch (error) {
    console.log('❌ Authentication error:', error.response?.data?.message || error.message);
    return;
  }

  // Step 2: Test Backup History API
  console.log('\n🔍 Step 2: Testing Backup History API...');
  try {
    const historyResponse = await axios.get(`${baseURL}/backup/history`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (historyResponse.data.success) {
      console.log('✅ Backup History API successful!');
      console.log(`📊 Total backups: ${historyResponse.data.data.totalCount}`);
      console.log(`📁 Backups found: ${historyResponse.data.data.backups.length}`);
      
      if (historyResponse.data.data.backups.length > 0) {
        console.log('📋 Recent backups:');
        historyResponse.data.data.backups.slice(0, 3).forEach((backup, index) => {
          console.log(`  ${index + 1}. ${backup.filename} (${backup.status}) - ${new Date(backup.createdAt).toLocaleDateString()}`);
        });
      }
    } else {
      console.log('❌ Backup History API failed:', historyResponse.data.message);
    }
  } catch (error) {
    console.log('❌ Backup History API error:', error.response?.data?.message || error.message);
  }

  // Step 3: Test Create Backup API
  console.log('\n🔍 Step 3: Testing Create Backup API...');
  try {
    const backupOptions = {
      includeTenants: true,
      includeUsers: true,
      includeNotifications: true,
      includeAuditLogs: false,
      includeSupportTickets: true,
      includeSystemSettings: true,
      excludeSensitiveData: true
    };

    const createResponse = await axios.post(`${baseURL}/backup`, backupOptions, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      responseType: 'blob'
    });

    console.log('✅ Create Backup API successful!');
    console.log(`📄 Response type: ${createResponse.headers['content-type']}`);
    console.log(`📦 File size: ${createResponse.data.size} bytes`);
  } catch (error) {
    console.log('❌ Create Backup API error:', error.response?.data?.message || error.message);
  }

  // Step 4: Test Backup History API again to see if new backup appears
  console.log('\n🔍 Step 4: Testing Backup History API again...');
  try {
    const historyResponse2 = await axios.get(`${baseURL}/backup/history`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (historyResponse2.data.success) {
      console.log('✅ Backup History API (second call) successful!');
      console.log(`📊 Total backups: ${historyResponse2.data.data.totalCount}`);
      console.log(`📁 Backups found: ${historyResponse2.data.data.backups.length}`);
    } else {
      console.log('❌ Backup History API (second call) failed:', historyResponse2.data.message);
    }
  } catch (error) {
    console.log('❌ Backup History API (second call) error:', error.response?.data?.message || error.message);
  }

  console.log('\n✅ Backup API testing completed!');
}

testBackupAPIs().catch(console.error);
