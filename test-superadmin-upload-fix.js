const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const SUPERADMIN_CREDENTIALS = {
  email: 'superadmin@example.com',
  password: 'SuperAdmin123!'
};

async function testSuperadminUploadFix() {
  let token = null;

  try {
    console.log('🔍 Testing SuperAdmin Support Upload Fix...');

    // Step 1: Login as SuperAdmin
    console.log('\n📝 Step 1: Logging in as SuperAdmin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/superadmin/auth/login`, SUPERADMIN_CREDENTIALS);

    if (!loginResponse.data.success) {
      throw new Error('SuperAdmin login failed: ' + loginResponse.data.message);
    }

    token = loginResponse.data.data.token;
    console.log('✅ SuperAdmin login successful, token received');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Test SuperAdmin Support Tickets API
    console.log('\n📝 Step 2: Testing SuperAdmin Support Tickets API...');
    const ticketsResponse = await axios.get(`${BASE_URL}/api/superadmin/support-tickets`, { headers });

    if (ticketsResponse.data.success) {
      console.log('✅ SuperAdmin Support Tickets API working');
      console.log(`   Found ${ticketsResponse.data.data.tickets.length} tickets`);
    } else {
      throw new Error('SuperAdmin Support Tickets API failed: ' + ticketsResponse.data.message);
    }

    // Step 3: Test SuperAdmin Support Upload API
    console.log('\n📝 Step 3: Testing SuperAdmin Support Upload API...');
    
    // Create a test file
    const testFileName = 'test-upload.txt';
    const testFilePath = path.join(__dirname, testFileName);
    const testContent = 'This is a test file for SuperAdmin upload';
    
    fs.writeFileSync(testFilePath, testContent);
    
    try {
      const formData = new FormData();
      const fileBuffer = fs.readFileSync(testFilePath);
      const fileBlob = new Blob([fileBuffer], { type: 'text/plain' });
      formData.append('files', fileBlob, testFileName);

      const uploadResponse = await axios.post(`${BASE_URL}/api/superadmin/support-tickets/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (uploadResponse.data.success) {
        console.log('✅ SuperAdmin Support Upload API working');
        console.log(`   Uploaded file: ${uploadResponse.data.data.files[0].originalName}`);
        console.log(`   File path: ${uploadResponse.data.data.files[0].path}`);
      } else {
        console.log('❌ SuperAdmin Support Upload API failed:', uploadResponse.data.message);
      }
    } catch (uploadError) {
      console.log('❌ SuperAdmin Support Upload API error:', uploadError.response?.data?.message || uploadError.message);
    } finally {
      // Clean up test file
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    }

    // Step 4: Test that tenant upload API is not accessible
    console.log('\n📝 Step 4: Testing that tenant upload API is not accessible...');
    try {
      const tenantUploadResponse = await axios.post(`${BASE_URL}/api/tenant/undefined/support/upload`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      console.log('❌ Tenant upload API should not be accessible for SuperAdmin');
    } catch (tenantError) {
      if (tenantError.response?.status === 403) {
        console.log('✅ Tenant upload API correctly blocked for SuperAdmin (403 Forbidden)');
      } else {
        console.log('⚠️ Tenant upload API error (expected):', tenantError.response?.data?.message || tenantError.message);
      }
    }

    // Step 5: Test SuperAdmin Support Ticket Creation with Upload
    console.log('\n📝 Step 5: Testing SuperAdmin Support Ticket Creation...');
    try {
      const newTicket = {
        title: 'Test SuperAdmin Support Ticket',
        description: 'This is a test support ticket created by SuperAdmin',
        priority: 'medium',
        category: 'general'
      };

      const createResponse = await axios.post(`${BASE_URL}/api/superadmin/support-tickets`, newTicket, { headers });

      if (createResponse.data.success) {
        console.log('✅ SuperAdmin Support Ticket creation working');
        console.log(`   Created ticket ID: ${createResponse.data.data.ticket.id}`);
        
        // Test getting the ticket
        const ticketId = createResponse.data.data.ticket.id;
        const getResponse = await axios.get(`${BASE_URL}/api/superadmin/support-tickets/${ticketId}`, { headers });
        
        if (getResponse.data.success) {
          console.log('✅ SuperAdmin Support Ticket retrieval working');
        } else {
          console.log('❌ SuperAdmin Support Ticket retrieval failed:', getResponse.data.message);
        }
      } else {
        console.log('❌ SuperAdmin Support Ticket creation failed:', createResponse.data.message);
      }
    } catch (createError) {
      console.log('❌ SuperAdmin Support Ticket creation error:', createError.response?.data?.message || createError.message);
    }

    console.log('\n🎉 SuperAdmin Support Upload Fix Test Completed!');
    console.log('💡 The SuperAdmin should now be able to:');
    console.log('   - Access support tickets through /superadmin/support-tickets');
    console.log('   - Upload files using the SuperAdmin upload API');
    console.log('   - Create and manage support tickets');
    console.log('   - Not access tenant-specific endpoints');

  } catch (error) {
    console.error('❌ SuperAdmin upload fix test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testSuperadminUploadFix();
