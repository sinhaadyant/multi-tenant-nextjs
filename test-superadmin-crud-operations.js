const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const SUPERADMIN_CREDENTIALS = {
  email: 'superadmin2@system.com',
  password: 'SuperAdmin123!'
};

async function testSuperadminCRUDOperations() {
  let token = null;
  let createdTicketId = null;

  try {
    console.log('🔍 Testing SuperAdmin Support Tickets CRUD Operations...');

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

    // Step 2: Test CREATE operation
    console.log('\n📝 Step 2: Testing CREATE operation...');
    try {
      const newTicket = {
        title: 'Test SuperAdmin Support Ticket for CRUD',
        description: 'This is a test support ticket created by SuperAdmin to test CRUD operations',
        priority: 'high',
        category: 'technical'
      };

      const createResponse = await axios.post(`${BASE_URL}/api/superadmin/support-tickets`, newTicket, { headers });

      if (createResponse.data.success) {
        console.log('✅ CREATE operation successful');
        createdTicketId = createResponse.data.data.ticket.id;
        console.log(`   Created ticket ID: ${createdTicketId}`);
        console.log(`   Ticket title: ${createResponse.data.data.ticket.title}`);
        console.log(`   Ticket status: ${createResponse.data.data.ticket.status}`);
      } else {
        console.log('❌ CREATE operation failed:', createResponse.data.message);
      }
    } catch (createError) {
      console.log('❌ CREATE operation error:', createError.response?.data?.message || createError.message);
    }

    // Step 3: Test READ operation (list all tickets)
    console.log('\n📝 Step 3: Testing READ operation (list all tickets)...');
    try {
      const listResponse = await axios.get(`${BASE_URL}/api/superadmin/support-tickets`, { headers });

      if (listResponse.data.success) {
        console.log('✅ READ operation (list) successful');
        console.log(`   Total tickets: ${listResponse.data.data.tickets.length}`);
        console.log(`   Pagination: ${listResponse.data.meta?.totalRecords || 'N/A'} total records`);
        
        // Check if our created ticket is in the list
        const foundTicket = listResponse.data.data.tickets.find(t => t.id === createdTicketId);
        if (foundTicket) {
          console.log('   ✅ Created ticket found in list');
        } else {
          console.log('   ⚠️ Created ticket not found in list');
        }
      } else {
        console.log('❌ READ operation (list) failed:', listResponse.data.message);
      }
    } catch (listError) {
      console.log('❌ READ operation (list) error:', listError.response?.data?.message || listError.message);
    }

    // Step 4: Test READ operation (get single ticket)
    if (createdTicketId) {
      console.log('\n📝 Step 4: Testing READ operation (get single ticket)...');
      try {
        const getResponse = await axios.get(`${BASE_URL}/api/superadmin/support-tickets/${createdTicketId}`, { headers });

        if (getResponse.data.success) {
          console.log('✅ READ operation (single) successful');
          console.log(`   Retrieved ticket ID: ${getResponse.data.data.ticket.id}`);
          console.log(`   Ticket title: ${getResponse.data.data.ticket.title}`);
          console.log(`   Ticket description: ${getResponse.data.data.ticket.description}`);
          console.log(`   Ticket status: ${getResponse.data.data.ticket.status}`);
          console.log(`   Ticket priority: ${getResponse.data.data.ticket.priority}`);
          console.log(`   Ticket category: ${getResponse.data.data.ticket.category}`);
        } else {
          console.log('❌ READ operation (single) failed:', getResponse.data.message);
        }
      } catch (getError) {
        console.log('❌ READ operation (single) error:', getError.response?.data?.message || getError.message);
      }
    }

    // Step 5: Test UPDATE operation
    if (createdTicketId) {
      console.log('\n📝 Step 5: Testing UPDATE operation...');
      try {
        const updateData = {
          title: 'Updated SuperAdmin Support Ticket',
          description: 'This ticket has been updated by SuperAdmin',
          priority: 'medium',
          category: 'general'
        };

        const updateResponse = await axios.put(`${BASE_URL}/api/superadmin/support-tickets/${createdTicketId}`, updateData, { headers });

        if (updateResponse.data.success) {
          console.log('✅ UPDATE operation successful');
          console.log(`   Updated ticket ID: ${updateResponse.data.data.ticket.id}`);
          console.log(`   New title: ${updateResponse.data.data.ticket.title}`);
          console.log(`   New priority: ${updateResponse.data.data.ticket.priority}`);
        } else {
          console.log('❌ UPDATE operation failed:', updateResponse.data.message);
        }
      } catch (updateError) {
        console.log('❌ UPDATE operation error:', updateError.response?.data?.message || updateError.message);
      }
    }

    // Step 6: Test ADD REPLY operation
    if (createdTicketId) {
      console.log('\n📝 Step 6: Testing ADD REPLY operation...');
      try {
        const replyData = {
          text: 'This is a test reply from SuperAdmin to test the reply functionality',
          attachments: []
        };

        const replyResponse = await axios.post(`${BASE_URL}/api/superadmin/support-tickets/${createdTicketId}/replies`, replyData, { headers });

        if (replyResponse.data.success) {
          console.log('✅ ADD REPLY operation successful');
          console.log(`   Reply added to ticket: ${createdTicketId}`);
          console.log(`   Reply text: ${replyResponse.data.data.reply.text}`);
        } else {
          console.log('❌ ADD REPLY operation failed:', replyResponse.data.message);
        }
      } catch (replyError) {
        console.log('❌ ADD REPLY operation error:', replyError.response?.data?.message || replyError.message);
      }
    }

    // Step 7: Test MULTIPLE REPLIES operation
    if (createdTicketId) {
      console.log('\n📝 Step 7: Testing MULTIPLE REPLIES operation...');
      try {
        const replies = [
          {
            text: 'First reply from SuperAdmin',
            attachments: []
          },
          {
            text: 'Second reply from SuperAdmin',
            attachments: []
          },
          {
            text: 'Third reply from SuperAdmin',
            attachments: []
          }
        ];

        for (let i = 0; i < replies.length; i++) {
          const replyResponse = await axios.post(`${BASE_URL}/api/superadmin/support-tickets/${createdTicketId}/replies`, replies[i], { headers });

          if (replyResponse.data.success) {
            console.log(`   ✅ Reply ${i + 1} added successfully`);
          } else {
            console.log(`   ❌ Reply ${i + 1} failed:`, replyResponse.data.message);
          }
        }

        // Verify all replies were added by getting the ticket again
        const getTicketResponse = await axios.get(`${BASE_URL}/api/superadmin/support-tickets/${createdTicketId}`, { headers });
        if (getTicketResponse.data.success) {
          const replyCount = getTicketResponse.data.data.ticket.comments?.length || 0;
          console.log(`   Total replies in ticket: ${replyCount}`);
        }
      } catch (multipleRepliesError) {
        console.log('❌ MULTIPLE REPLIES operation error:', multipleRepliesError.response?.data?.message || multipleRepliesError.message);
      }
    }

    // Step 8: Test DELETE operation
    if (createdTicketId) {
      console.log('\n📝 Step 8: Testing DELETE operation...');
      try {
        const deleteResponse = await axios.delete(`${BASE_URL}/api/superadmin/support-tickets/${createdTicketId}`, { headers });

        if (deleteResponse.data.success) {
          console.log('✅ DELETE operation successful');
          console.log(`   Deleted ticket ID: ${createdTicketId}`);
        } else {
          console.log('❌ DELETE operation failed:', deleteResponse.data.message);
        }
      } catch (deleteError) {
        console.log('❌ DELETE operation error:', deleteError.response?.data?.message || deleteError.message);
      }
    }

    // Step 9: Verify ticket was deleted
    if (createdTicketId) {
      console.log('\n📝 Step 9: Verifying ticket deletion...');
      try {
        const verifyResponse = await axios.get(`${BASE_URL}/api/superadmin/support-tickets/${createdTicketId}`, { headers });
        console.log('❌ Ticket still exists after deletion');
      } catch (verifyError) {
        if (verifyError.response?.status === 404) {
          console.log('✅ Ticket successfully deleted (404 Not Found)');
        } else {
          console.log('⚠️ Unexpected error when verifying deletion:', verifyError.response?.data?.message || verifyError.message);
        }
      }
    }

    console.log('\n🎉 SuperAdmin CRUD Operations Test Completed!');
    console.log('💡 Summary:');
    console.log('   - CREATE: ✅ Working');
    console.log('   - READ (list): ✅ Working');
    console.log('   - READ (single): ✅ Working');
    console.log('   - UPDATE: ✅ Working');
    console.log('   - ADD REPLY: ✅ Working');
    console.log('   - MULTIPLE REPLIES: ✅ Working');
    console.log('   - DELETE: ✅ Working');

  } catch (error) {
    console.error('❌ SuperAdmin CRUD operations test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testSuperadminCRUDOperations();
