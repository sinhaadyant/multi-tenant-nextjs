const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const SUPERADMIN_CREDENTIALS = {
  email: 'superadmin2@system.com',
  password: 'SuperAdmin123!'
};

async function testCacheInvalidation() {
  let token = null;
  let createdTicketId = null;

  try {
    console.log('🔍 Testing Cache Invalidation...');

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
      title: 'Cache Invalidation Test Ticket',
      description: 'This ticket is to test cache invalidation',
      priority: 'medium',
      category: 'general'
    };

    const createResponse = await axios.post(`${BASE_URL}/api/superadmin/support-tickets`, newTicket, { headers });

    if (createResponse.data.success) {
      createdTicketId = createResponse.data.data.ticket.id;
      console.log('✅ Test ticket created:', createdTicketId);
    }

    // Step 3: Get initial ticket state
    if (createdTicketId) {
      console.log('\n📝 Step 3: Getting initial ticket state...');
      const initialState = await axios.get(`${BASE_URL}/api/superadmin/support-tickets/${createdTicketId}`, { headers });
      
      if (initialState.data.success) {
        const ticket = initialState.data.data.ticket;
        console.log('✅ Initial state:');
        console.log('   Comments count:', ticket._count.comments);
        console.log('   Attachments count:', ticket._count.attachments);
        console.log('   Comments array length:', ticket.comments.length);
      }
    }

    // Step 4: Add multiple replies
    if (createdTicketId) {
      console.log('\n📝 Step 4: Adding multiple replies...');
      
      for (let i = 1; i <= 3; i++) {
        const replyData = {
          text: `Test reply number ${i}`,
          attachments: []
        };

        const replyResponse = await axios.post(`${BASE_URL}/api/superadmin/support-tickets/${createdTicketId}/replies`, replyData, { headers });

        if (replyResponse.data.success) {
          console.log(`   ✅ Reply ${i} added`);
          
          // Get ticket state after each reply
          const stateAfterReply = await axios.get(`${BASE_URL}/api/superadmin/support-tickets/${createdTicketId}`, { headers });
          
          if (stateAfterReply.data.success) {
            const ticket = stateAfterReply.data.data.ticket;
            console.log(`   State after reply ${i}:`);
            console.log(`     Comments count: ${ticket._count.comments}`);
            console.log(`     Comments array length: ${ticket.comments.length}`);
            console.log(`     Latest reply: "${ticket.comments[ticket.comments.length - 1]?.text}"`);
          }
        }
        
        // Small delay between replies
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Step 5: Add reply with attachments
    if (createdTicketId) {
      console.log('\n📝 Step 5: Adding reply with attachments...');
      const replyWithAttachments = {
        text: 'Reply with test attachment',
        attachments: [
          {
            filename: 'test-reply-att.txt',
            originalName: 'test-reply-att.txt',
            mimeType: 'text/plain',
            size: 25,
            path: '/uploads/superadmin/support/test-reply-att.txt'
          }
        ]
      };

      const replyResponse = await axios.post(`${BASE_URL}/api/superadmin/support-tickets/${createdTicketId}/replies`, replyWithAttachments, { headers });

      if (replyResponse.data.success) {
        console.log('   ✅ Reply with attachments added');
        
        // Get final state
        const finalState = await axios.get(`${BASE_URL}/api/superadmin/support-tickets/${createdTicketId}`, { headers });
        
        if (finalState.data.success) {
          const ticket = finalState.data.data.ticket;
          console.log('   Final state:');
          console.log(`     Comments count: ${ticket._count.comments}`);
          console.log(`     Comments array length: ${ticket.comments.length}`);
          console.log(`     Latest reply: "${ticket.comments[ticket.comments.length - 1]?.text}"`);
          console.log(`     Latest reply attachments: ${ticket.comments[ticket.comments.length - 1]?.attachments?.length || 0}`);
        }
      }
    }

    // Step 6: Test the list endpoint to make sure it also shows updated counts
    console.log('\n📝 Step 6: Testing list endpoint for updated counts...');
    const listResponse = await axios.get(`${BASE_URL}/api/superadmin/support-tickets`, { headers });
    
    if (listResponse.data.success) {
      const tickets = listResponse.data.data.tickets;
      const ourTicket = tickets.find(t => t.id === createdTicketId);
      
      if (ourTicket) {
        console.log('✅ Ticket found in list:');
        console.log(`   Comments count in list: ${ourTicket._count.comments}`);
        console.log(`   Attachments count in list: ${ourTicket._count.attachments}`);
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

    console.log('\n🎉 Cache invalidation test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testCacheInvalidation();
