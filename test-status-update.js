const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const SUPERADMIN_CREDENTIALS = {
  email: 'superadmin2@system.com',
  password: 'SuperAdmin123!'
};

async function testStatusUpdate() {
  let token = null;
  let createdTicketId = null;

  try {
    console.log('🔍 Testing Status Update Functionality...');

    // Step 1: Login as SuperAdmin
    console.log('\n📝 Step 1: Logging in as SuperAdmin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/superadmin/auth/login`, SUPERADMIN_CREDENTIALS);

    if (!loginResponse.data.success) {
      throw new Error('SuperAdmin login failed: ' + loginResponse.data.message);
    }

    token = loginResponse.data.data.token;
    console.log('✅ SuperAdmin login successful');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Create a test ticket
    console.log('\n📝 Step 2: Creating test ticket...');
    const newTicket = {
      title: 'Status Update Test Ticket',
      description: 'This ticket is to test status update functionality',
      priority: 'medium',
      category: 'general'
    };

    const createResponse = await axios.post(`${BASE_URL}/api/superadmin/support-tickets`, newTicket, { headers });

    if (createResponse.data.success) {
      createdTicketId = createResponse.data.data.ticket.id;
      console.log('✅ Test ticket created:', createdTicketId);
      console.log('   Initial status:', createResponse.data.data.ticket.status);
    }

    // Step 3: Test status updates
    if (createdTicketId) {
      console.log('\n📝 Step 3: Testing status updates...');
      
      const statuses = ['pending', 'closed', 'open'];
      
      for (const newStatus of statuses) {
        console.log(`\n   Updating status to: ${newStatus}`);
        
        const updateData = {
          status: newStatus
        };

        const updateResponse = await axios.put(`${BASE_URL}/api/superadmin/support-tickets/${createdTicketId}`, updateData, { headers });

        if (updateResponse.data.success) {
          console.log(`   ✅ Status updated to ${newStatus}`);
          
          // Verify the update by fetching the ticket
          const getResponse = await axios.get(`${BASE_URL}/api/superadmin/support-tickets/${createdTicketId}`, { headers });
          
          if (getResponse.data.success) {
            const ticket = getResponse.data.data.ticket;
            console.log(`   Verified status: ${ticket.status}`);
            console.log(`   Last updated: ${ticket.updatedAt}`);
          }
        } else {
          console.log(`   ❌ Failed to update status to ${newStatus}:`, updateResponse.data.message);
        }
        
        // Small delay between updates
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Step 4: Test partial updates (status only)
    if (createdTicketId) {
      console.log('\n📝 Step 4: Testing partial status update...');
      
      const partialUpdateData = {
        status: 'pending'
      };

      const partialUpdateResponse = await axios.put(`${BASE_URL}/api/superadmin/support-tickets/${createdTicketId}`, partialUpdateData, { headers });

      if (partialUpdateResponse.data.success) {
        console.log('✅ Partial status update successful');
        
        // Verify other fields weren't changed
        const verifyResponse = await axios.get(`${BASE_URL}/api/superadmin/support-tickets/${createdTicketId}`, { headers });
        
        if (verifyResponse.data.success) {
          const ticket = verifyResponse.data.data.ticket;
          console.log('   Verification:');
          console.log(`     Status: ${ticket.status}`);
          console.log(`     Title: ${ticket.title}`);
          console.log(`     Priority: ${ticket.priority}`);
          console.log(`     Category: ${ticket.category}`);
        }
      }
    }

    // Step 5: Test invalid status
    if (createdTicketId) {
      console.log('\n📝 Step 5: Testing invalid status...');
      
      const invalidUpdateData = {
        status: 'invalid_status'
      };

      try {
        const invalidUpdateResponse = await axios.put(`${BASE_URL}/api/superadmin/support-tickets/${createdTicketId}`, invalidUpdateData, { headers });
        console.log('❌ Invalid status was accepted (should have failed)');
      } catch (error) {
        if (error.response && error.response.status === 400) {
          console.log('✅ Invalid status correctly rejected');
          console.log('   Error message:', error.response.data.message);
        } else {
          console.log('❌ Unexpected error:', error.message);
        }
      }
    }

    // Step 6: Test list endpoint shows updated status
    console.log('\n📝 Step 6: Testing list endpoint shows updated status...');
    const listResponse = await axios.get(`${BASE_URL}/api/superadmin/support-tickets`, { headers });
    
    if (listResponse.data.success) {
      const tickets = listResponse.data.data.tickets;
      const ourTicket = tickets.find(t => t.id === createdTicketId);
      
      if (ourTicket) {
        console.log('✅ Ticket found in list with updated status:');
        console.log(`   Status: ${ourTicket.status}`);
        console.log(`   Title: ${ourTicket.title}`);
      } else {
        console.log('❌ Ticket not found in list');
      }
    }

    // Step 7: Clean up
    if (createdTicketId) {
      console.log('\n📝 Step 7: Cleaning up test ticket...');
      try {
        await axios.delete(`${BASE_URL}/api/superadmin/support-tickets/${createdTicketId}`, { headers });
        console.log('✅ Test ticket cleaned up');
      } catch (error) {
        console.log('⚠️ Error cleaning up:', error.message);
      }
    }

    console.log('\n🎉 Status update test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testStatusUpdate();
