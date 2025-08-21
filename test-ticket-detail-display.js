const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const SUPERADMIN_CREDENTIALS = {
  email: 'superadmin2@system.com',
  password: 'SuperAdmin123!'
};

async function testTicketDetailDisplay() {
  let token = null;
  let createdTicketId = null;

  try {
    console.log('🔍 Testing Ticket Detail Display Issue...');

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

    // Step 2: Create a test ticket with attachments
    console.log('\n📝 Step 2: Creating test ticket with attachments...');
    const newTicket = {
      title: 'Test Ticket for Detail Display',
      description: 'This ticket is to test detail page display',
      priority: 'high',
      category: 'technical',
      attachments: [
        {
          filename: 'test-attachment.txt',
          originalName: 'test-attachment.txt',
          mimeType: 'text/plain',
          size: 45,
          path: '/uploads/superadmin/support/test-attachment.txt'
        }
      ]
    };

    const createResponse = await axios.post(`${BASE_URL}/api/superadmin/support-tickets`, newTicket, { headers });

    if (createResponse.data.success) {
      createdTicketId = createResponse.data.data.ticket.id;
      console.log('✅ Test ticket created:', createdTicketId);
      console.log('   Ticket attachments:', createResponse.data.data.ticket.attachments?.length || 0);
    }

    // Step 3: Add a reply with attachments
    if (createdTicketId) {
      console.log('\n📝 Step 3: Adding reply with attachments...');
      const replyData = {
        text: 'This is a test reply with attachments',
        attachments: [
          {
            filename: 'reply-attachment.txt',
            originalName: 'reply-attachment.txt',
            mimeType: 'text/plain',
            size: 50,
            path: '/uploads/superadmin/support/reply-attachment.txt'
          }
        ]
      };

      const replyResponse = await axios.post(`${BASE_URL}/api/superadmin/support-tickets/${createdTicketId}/replies`, replyData, { headers });

      if (replyResponse.data.success) {
        console.log('✅ Reply added successfully');
        console.log('   Reply attachments:', replyResponse.data.data.reply.attachments?.length || 0);
      }
    }

    // Step 4: Get ticket detail and analyze the response
    if (createdTicketId) {
      console.log('\n📝 Step 4: Getting ticket detail data...');
      const getResponse = await axios.get(`${BASE_URL}/api/superadmin/support-tickets/${createdTicketId}`, { headers });

      if (getResponse.data.success) {
        const ticket = getResponse.data.data.ticket;
        
        console.log('✅ Ticket detail fetched successfully');
        console.log('\n🔍 TICKET DATA ANALYSIS:');
        console.log('   Title:', ticket.title);
        console.log('   Description:', ticket.description);
        console.log('   Status:', ticket.status);
        console.log('   Priority:', ticket.priority);
        console.log('   Category:', ticket.category);
        
        console.log('\n📎 ATTACHMENTS:');
        if (ticket.attachments && Array.isArray(ticket.attachments)) {
          console.log('   Count:', ticket.attachments.length);
          ticket.attachments.forEach((att, index) => {
            console.log(`   ${index + 1}. ${att.originalName} (${att.size} bytes)`);
          });
        } else {
          console.log('   ❌ No attachments or invalid structure');
          console.log('   Attachments value:', ticket.attachments);
        }

        console.log('\n💬 COMMENTS/REPLIES:');
        if (ticket.comments && Array.isArray(ticket.comments)) {
          console.log('   Count:', ticket.comments.length);
          ticket.comments.forEach((comment, index) => {
            console.log(`   ${index + 1}. "${comment.text}"`);
            console.log(`      Created: ${comment.createdAt}`);
            console.log(`      By: ${comment.commentedBy} (${comment.commenterType})`);
            if (comment.attachments && Array.isArray(comment.attachments)) {
              console.log(`      Attachments: ${comment.attachments.length}`);
              comment.attachments.forEach((att, attIndex) => {
                console.log(`        ${attIndex + 1}. ${att.originalName} (${att.size} bytes)`);
              });
            } else {
              console.log(`      ❌ No attachments in this comment`);
            }
          });
        } else {
          console.log('   ❌ No comments or invalid structure');
          console.log('   Comments value:', ticket.comments);
        }

        console.log('\n🏢 RELATED DATA:');
        console.log('   Tenant:', ticket.tenant ? `${ticket.tenant.name} (${ticket.tenant.slug})` : 'None');
        console.log('   User:', ticket.user ? `${ticket.user.name} (${ticket.user.email})` : 'None');

        console.log('\n📊 COUNTS:');
        console.log('   _count object:', ticket._count);

        // Check if the data structure matches what the frontend expects
        console.log('\n🔍 FRONTEND COMPATIBILITY CHECK:');
        console.log('   ✅ ticket.attachments exists:', !!ticket.attachments);
        console.log('   ✅ ticket.attachments is array:', Array.isArray(ticket.attachments));
        console.log('   ✅ ticket.comments exists:', !!ticket.comments);
        console.log('   ✅ ticket.comments is array:', Array.isArray(ticket.comments));
        
        if (ticket.comments && Array.isArray(ticket.comments) && ticket.comments.length > 0) {
          const firstComment = ticket.comments[0];
          console.log('   ✅ comment.attachments exists:', !!firstComment.attachments);
          console.log('   ✅ comment.attachments is array:', Array.isArray(firstComment.attachments));
        }
      } else {
        console.log('❌ Failed to get ticket details:', getResponse.data.message);
      }
    }

    // Step 5: Clean up
    if (createdTicketId) {
      console.log('\n📝 Step 5: Cleaning up test ticket...');
      try {
        await axios.delete(`${BASE_URL}/api/superadmin/support-tickets/${createdTicketId}`, { headers });
        console.log('✅ Test ticket cleaned up');
      } catch (error) {
        console.log('⚠️ Error cleaning up:', error.message);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testTicketDetailDisplay();
