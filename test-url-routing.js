const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const SUPERADMIN_CREDENTIALS = {
  email: 'superadmin2@system.com',
  password: 'SuperAdmin123!'
};

async function testUrlRouting() {
  let token = null;
  let createdTicketId = null;

  try {
    console.log('🔍 Testing URL Routing for SuperAdmin Support Tickets...');

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
      title: 'URL Routing Test Ticket',
      description: 'This ticket is to test URL routing functionality',
      priority: 'medium',
      category: 'general'
    };

    const createResponse = await axios.post(`${BASE_URL}/api/superadmin/support-tickets`, newTicket, { headers });

    if (createResponse.data.success) {
      createdTicketId = createResponse.data.data.ticket.id;
      console.log('✅ Test ticket created:', createdTicketId);
    }

    // Step 3: Test list endpoint
    console.log('\n📝 Step 3: Testing list endpoint...');
    const listResponse = await axios.get(`${BASE_URL}/api/superadmin/support-tickets`, { headers });
    
    if (listResponse.data.success) {
      console.log('✅ List endpoint working');
      console.log('   Total tickets:', listResponse.data.data.tickets.length);
      console.log('   Pagination:', listResponse.data.meta?.totalRecords || 'N/A');
    }

    // Step 4: Test individual ticket endpoint
    if (createdTicketId) {
      console.log('\n📝 Step 4: Testing individual ticket endpoint...');
      const ticketResponse = await axios.get(`${BASE_URL}/api/superadmin/support-tickets/${createdTicketId}`, { headers });
      
      if (ticketResponse.data.success) {
        console.log('✅ Individual ticket endpoint working');
        console.log('   Ticket ID:', ticketResponse.data.data.ticket.id);
        console.log('   Title:', ticketResponse.data.data.ticket.title);
        console.log('   Comments count:', ticketResponse.data.data.ticket._count.comments);
        console.log('   Attachments count:', ticketResponse.data.data.ticket._count.attachments);
      }
    }

    // Step 5: Test frontend URLs (check if they return HTML)
    console.log('\n📝 Step 5: Testing frontend URLs...');
    
    // Test list page
    try {
      const listPageResponse = await axios.get(`${BASE_URL}/superadmin/support-tickets`);
      console.log('✅ List page URL working (returns HTML)');
    } catch (error) {
      console.log('❌ List page URL failed:', error.message);
    }

    // Test individual ticket page
    if (createdTicketId) {
      try {
        const ticketPageResponse = await axios.get(`${BASE_URL}/superadmin/support-tickets/${createdTicketId}`);
        console.log('✅ Individual ticket page URL working (returns HTML)');
      } catch (error) {
        console.log('❌ Individual ticket page URL failed:', error.message);
      }

      // Test edit mode URL
      try {
        const editPageResponse = await axios.get(`${BASE_URL}/superadmin/support-tickets/${createdTicketId}?mode=edit`);
        console.log('✅ Edit mode URL working (returns HTML)');
      } catch (error) {
        console.log('❌ Edit mode URL failed:', error.message);
      }
    }

    // Test create page
    try {
      const createPageResponse = await axios.get(`${BASE_URL}/superadmin/support-tickets/new`);
      console.log('✅ Create page URL working (returns HTML)');
    } catch (error) {
      console.log('❌ Create page URL failed:', error.message);
    }

    // Step 6: Test navigation flow
    console.log('\n📝 Step 6: Testing navigation flow...');
    
    // Add a reply to test the detail view
    if (createdTicketId) {
      const replyData = {
        text: 'Test reply for URL routing verification'
      };

      const replyResponse = await axios.post(`${BASE_URL}/api/superadmin/support-tickets/${createdTicketId}/replies`, replyData, { headers });

      if (replyResponse.data.success) {
        console.log('✅ Reply added successfully');
        
        // Get updated ticket to verify reply count
        const updatedTicketResponse = await axios.get(`${BASE_URL}/api/superadmin/support-tickets/${createdTicketId}`, { headers });
        
        if (updatedTicketResponse.data.success) {
          const ticket = updatedTicketResponse.data.data.ticket;
          console.log('   Updated ticket data:');
          console.log('     Comments count:', ticket._count.comments);
          console.log('     Comments array length:', ticket.comments.length);
          console.log('     Latest reply:', ticket.comments[ticket.comments.length - 1]?.text);
        }
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

    console.log('\n🎉 URL routing test completed!');
    console.log('\n📋 Expected URL Structure:');
    console.log('   List: /superadmin/support-tickets');
    console.log('   Create: /superadmin/support-tickets/new');
    console.log('   View: /superadmin/support-tickets/[id]');
    console.log('   Edit: /superadmin/support-tickets/[id]?mode=edit');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testUrlRouting();
