const axios = require('axios');

async function testNotificationAPIs() {
  const baseURL = 'http://localhost:3000/api/superadmin';

  console.log('🧪 Testing Notification APIs with Authentication...\n');

  const testCredentials = {
    email: 'superadmin_1755552943407@example.com',
    password: 'SuperAdmin1755552943407',
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

  // Step 2: Test Recipients API
  console.log('\n🔍 Step 2: Testing Recipients API...');
  try {
    const recipientsResponse = await axios.get(`${baseURL}/notifications/recipients`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (recipientsResponse.data.success) {
      console.log('✅ Recipients API successful!');
      console.log(`📊 Superadmins: ${recipientsResponse.data.data.stats.totalSuperadmins}`);
      console.log(`📊 Tenants: ${recipientsResponse.data.data.stats.totalTenants}`);
      console.log(`📊 Users: ${recipientsResponse.data.data.stats.totalUsers}`);
      
      const recipients = recipientsResponse.data.data.recipients;
      if (recipients.superadmins.length > 0) {
        console.log('📋 Superadmins:');
        recipients.superadmins.slice(0, 3).forEach((sa, index) => {
          console.log(`  ${index + 1}. ${sa.name} (${sa.email})`);
        });
      }
      
      if (recipients.tenants.length > 0) {
        console.log('📋 Tenants:');
        recipients.tenants.slice(0, 3).forEach((tenant, index) => {
          console.log(`  ${index + 1}. ${tenant.name} (${tenant.userCount} users)`);
        });
      }
      
      if (recipients.users.length > 0) {
        console.log('📋 Users:');
        recipients.users.slice(0, 3).forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.name} (${user.email})`);
        });
      }
    } else {
      console.log('❌ Recipients API failed:', recipientsResponse.data.message);
    }
  } catch (error) {
    console.log('❌ Recipients API error:', error.response?.data?.message || error.message);
  }

  // Step 3: Test Create Notification API
  console.log('\n🔍 Step 3: Testing Create Notification API...');
  try {
    const notificationData = {
      title: 'Test Notification',
      message: 'This is a test notification sent via API',
      type: 'info',
      priority: 'normal',
      sendToAllSuperadmins: true,
      sendToAllTenants: false,
      selectedTenants: [],
      selectedUsers: [],
      customEmails: ['test@example.com']
    };

    const createResponse = await axios.post(`${baseURL}/notifications/create`, notificationData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (createResponse.data.success) {
      console.log('✅ Create Notification API successful!');
      console.log(`📧 Notification ID: ${createResponse.data.data.notification.id}`);
      console.log(`📊 Total Recipients: ${createResponse.data.data.notification.totalRecipients}`);
      console.log(`📋 Recipient Emails: ${createResponse.data.data.notification.recipientEmails.length}`);
    } else {
      console.log('❌ Create Notification API failed:', createResponse.data.message);
    }
  } catch (error) {
    console.log('❌ Create Notification API error:', error.response?.data?.message || error.message);
  }

  console.log('\n✅ Notification API testing completed!');
}

testNotificationAPIs().catch(console.error);
