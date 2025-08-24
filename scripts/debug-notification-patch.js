const axios = require('axios');

async function debugNotificationPatch() {
  const BASE_URL = 'http://localhost:3000';
  const SUPERADMIN_EMAIL = 'sinhaadyant74@gmail.com';
  const SUPERADMIN_PASSWORD = 'password123';
  const NOTIFICATION_ID = 'cmeq18bv30014ukgp2y9dmypx';

  try {
    console.log('🔍 Debugging Notification PATCH Request');
    console.log('=======================================');

    // Step 1: Login as superadmin
    console.log('\n1. Logging in as superadmin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/superadmin/auth/login`, {
      email: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASSWORD
    });

    if (!loginResponse.data.success) {
      throw new Error('Superadmin login failed: ' + loginResponse.data.message);
    }

    const superadminToken = loginResponse.data.data.token;
    console.log('✅ Superadmin login successful');

    // Step 2: Get the notification details first
    console.log('\n2. Getting notification details...');
    const getResponse = await axios.get(`${BASE_URL}/api/superadmin/notifications/${NOTIFICATION_ID}`, {
      headers: {
        'Authorization': `Bearer ${superadminToken}`
      }
    });

    console.log('📋 Notification details:');
    console.log('   - ID:', getResponse.data.data.notification.id);
    console.log('   - Title:', getResponse.data.data.notification.title);
    console.log('   - Status:', getResponse.data.data.notification.status);
    console.log('   - Target Type:', getResponse.data.data.notification.targetType);
    console.log('   - Metadata:', getResponse.data.data.notification.metadata);

    // Step 3: Try to send the notification
    console.log('\n3. Attempting to send notification...');
    try {
      const patchResponse = await axios.patch(`${BASE_URL}/api/superadmin/notifications/${NOTIFICATION_ID}`, {
        action: 'send'
      }, {
        headers: {
          'Authorization': `Bearer ${superadminToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ PATCH request successful!');
      console.log('📊 Response:', patchResponse.data);
    } catch (patchError) {
      console.error('❌ PATCH request failed:');
      console.error('   - Status:', patchError.response?.status);
      console.error('   - Message:', patchError.response?.data?.message);
      console.error('   - Data:', patchError.response?.data);
      
      if (patchError.response?.status === 500) {
        console.error('   - This is a server error. Check server logs for details.');
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

debugNotificationPatch();
