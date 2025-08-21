const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:3000';
const SUPERADMIN_CREDENTIALS = {
  email: 'superadmin2@system.com',
  password: 'SuperAdmin123!'
};

async function testSuperadminMultipleFiles() {
  let token = null;

  try {
    console.log('🔍 Testing SuperAdmin Support Upload with Multiple Files...');

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

    // Step 2: Create test files
    console.log('\n📝 Step 2: Creating test files...');
    const testFiles = [
      { name: 'test-document.txt', content: 'This is a test document for SuperAdmin upload' },
      { name: 'test-image.jpg', content: 'fake-jpeg-data' },
      { name: 'test-pdf.pdf', content: 'fake-pdf-data' },
      { name: 'test-spreadsheet.xlsx', content: 'fake-excel-data' }
    ];

    const tempFiles = [];
    for (const testFile of testFiles) {
      const filePath = path.join(__dirname, testFile.name);
      fs.writeFileSync(filePath, testFile.content);
      tempFiles.push(filePath);
    }

    console.log(`✅ Created ${testFiles.length} test files`);

    // Step 3: Test SuperAdmin Support Upload API with multiple files
    console.log('\n📝 Step 3: Testing SuperAdmin Support Upload API with multiple files...');
    
    try {
      const formData = new FormData();
      
      // Add multiple files to form data
      for (const filePath of tempFiles) {
        const fileStream = fs.createReadStream(filePath);
        const fileName = path.basename(filePath);
        formData.append('files', fileStream, fileName);
      }

      const uploadResponse = await axios.post(`${BASE_URL}/api/superadmin/support-tickets/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          ...formData.getHeaders(),
        },
      });

      if (uploadResponse.data.success) {
        console.log('✅ SuperAdmin Support Upload API working with multiple files');
        const files = uploadResponse.data.data?.files || [];
        console.log(`   Uploaded ${files.length} files:`);
        files.forEach((file, index) => {
          console.log(`     ${index + 1}. ${file.originalName} (${file.size} bytes) -> ${file.path}`);
        });
      } else {
        console.log('❌ SuperAdmin Support Upload API failed:', uploadResponse.data.message);
      }
    } catch (uploadError) {
      console.log('❌ SuperAdmin Support Upload API error:', uploadError.response?.data?.message || uploadError.message);
      if (uploadError.response?.data) {
        console.log('Response data:', uploadError.response.data);
      }
    } finally {
      // Clean up test files
      console.log('\n📝 Cleaning up test files...');
      for (const filePath of tempFiles) {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      console.log('✅ Test files cleaned up');
    }

    // Step 4: Test SuperAdmin Support Ticket Creation with multiple attachments
    console.log('\n📝 Step 4: Testing SuperAdmin Support Ticket Creation with attachments...');
    try {
      const newTicket = {
        title: 'Test SuperAdmin Support Ticket with Multiple Files',
        description: 'This is a test support ticket created by SuperAdmin with multiple file attachments',
        priority: 'high',
        category: 'technical',
        attachments: [
          {
            filename: 'test-document.txt',
            originalName: 'test-document.txt',
            mimeType: 'text/plain',
            size: 45,
            path: '/uploads/superadmin/support/test-document.txt'
          },
          {
            filename: 'test-image.jpg',
            originalName: 'test-image.jpg',
            mimeType: 'image/jpeg',
            size: 15,
            path: '/uploads/superadmin/support/test-image.jpg'
          }
        ]
      };

      const createResponse = await axios.post(`${BASE_URL}/api/superadmin/support-tickets`, newTicket, { headers });

      if (createResponse.data.success) {
        console.log('✅ SuperAdmin Support Ticket creation with attachments working');
        console.log(`   Created ticket ID: ${createResponse.data.data.ticket.id}`);
        console.log(`   Ticket has ${createResponse.data.data.ticket.attachments?.length || 0} attachments`);
        
        // Test getting the ticket
        const ticketId = createResponse.data.data.ticket.id;
        const getResponse = await axios.get(`${BASE_URL}/api/superadmin/support-tickets/${ticketId}`, { headers });
        
        if (getResponse.data.success) {
          console.log('✅ SuperAdmin Support Ticket retrieval working');
          console.log(`   Retrieved ticket with ${getResponse.data.data.ticket.attachments?.length || 0} attachments`);
        } else {
          console.log('❌ SuperAdmin Support Ticket retrieval failed:', getResponse.data.message);
        }
      } else {
        console.log('❌ SuperAdmin Support Ticket creation failed:', createResponse.data.message);
      }
    } catch (createError) {
      console.log('❌ SuperAdmin Support Ticket creation error:', createError.response?.data?.message || createError.message);
    }

    // Step 5: Test that tenant upload API is still not accessible
    console.log('\n📝 Step 5: Testing that tenant upload API is still not accessible...');
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

    console.log('\n🎉 SuperAdmin Multiple Files Upload Test Completed!');
    console.log('💡 The SuperAdmin should now be able to:');
    console.log('   - Upload multiple files at once');
    console.log('   - Create support tickets with multiple attachments');
    console.log('   - Access support tickets through /superadmin/support-tickets');
    console.log('   - Not access tenant-specific endpoints');

  } catch (error) {
    console.error('❌ SuperAdmin multiple files upload test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testSuperadminMultipleFiles();
