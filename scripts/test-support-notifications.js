const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TENANT_SLUG = 'riyo';
const TEST_USER_EMAIL = 'anil@cc.com';

// Test data
const testTicket = {
  title: 'Test Support Ticket for Real-time Notifications',
  description: 'This is a test ticket to verify real-time notifications work when other users update it.',
  category: 'technical',
  priority: 'medium',
  attachments: []
};

const testComment = {
  text: 'This is a test reply from another user to trigger notifications.',
  attachments: []
};

async function getAuthToken(email) {
  try {
    const response = await axios.post(`${BASE_URL}/api/tenant/${TENANT_SLUG}/auth/login`, {
      email,
      password: 'password123' // Assuming this is the test password
    });
    
    if (response.data.success) {
      return response.data.data.token;
    }
    throw new Error('Login failed');
  } catch (error) {
    console.error('❌ Failed to get auth token:', error.response?.data || error.message);
    throw error;
  }
}

async function createSupportTicket(token) {
  try {
    console.log('📝 Creating support ticket...');
    
    const response = await axios.post(`${BASE_URL}/api/tenant/${TENANT_SLUG}/support`, testTicket, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      console.log('✅ Support ticket created successfully');
      console.log('📋 Ticket ID:', response.data.data.ticket.id);
      console.log('📋 Ticket Title:', response.data.data.ticket.title);
      return response.data.data.ticket.id;
    }
    throw new Error('Failed to create support ticket');
  } catch (error) {
    console.error('❌ Failed to create support ticket:', error.response?.data || error.message);
    throw error;
  }
}

async function addCommentToTicket(token, ticketId) {
  try {
    console.log('💬 Adding comment to ticket...');
    
    const response = await axios.post(`${BASE_URL}/api/tenant/${TENANT_SLUG}/support/${ticketId}/comments`, testComment, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      console.log('✅ Comment added successfully');
      console.log('💬 Comment ID:', response.data.data.comment.id);
      return response.data.data.comment.id;
    }
    throw new Error('Failed to add comment');
  } catch (error) {
    console.error('❌ Failed to add comment:', error.response?.data || error.message);
    throw error;
  }
}

async function updateTicket(token, ticketId) {
  try {
    console.log('🔄 Updating support ticket...');
    
    const updateData = {
      status: 'pending',
      priority: 'high'
    };
    
    const response = await axios.put(`${BASE_URL}/api/tenant/${TENANT_SLUG}/support/${ticketId}`, updateData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      console.log('✅ Ticket updated successfully');
      console.log('🔄 New Status:', response.data.data.ticket.status);
      console.log('🔄 New Priority:', response.data.data.ticket.priority);
      return response.data.data.ticket;
    }
    throw new Error('Failed to update ticket');
  } catch (error) {
    console.error('❌ Failed to update ticket:', error.response?.data || error.message);
    throw error;
  }
}

async function closeTicket(token, ticketId) {
  try {
    console.log('🔒 Closing support ticket...');
    
    const updateData = {
      status: 'closed'
    };
    
    const response = await axios.put(`${BASE_URL}/api/tenant/${TENANT_SLUG}/support/${ticketId}`, updateData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      console.log('✅ Ticket closed successfully');
      return response.data.data.ticket;
    }
    throw new Error('Failed to close ticket');
  } catch (error) {
    console.error('❌ Failed to close ticket:', error.response?.data || error.message);
    throw error;
  }
}

async function checkNotifications(token) {
  try {
    console.log('🔔 Checking notifications...');
    
    const response = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/notifications/header?limit=10`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-User-Email': TEST_USER_EMAIL
      }
    });
    
    if (response.data.success) {
      console.log('✅ Notifications retrieved successfully');
      console.log('📊 Total notifications:', response.data.data.notifications.length);
      console.log('📊 Unread count:', response.data.data.unreadCount);
      
      // Show recent notifications
      const recentNotifications = response.data.data.notifications.slice(0, 3);
      recentNotifications.forEach((notification, index) => {
        console.log(`📢 Notification ${index + 1}:`, {
          title: notification.title,
          message: notification.message,
          type: notification.type,
          createdAt: notification.createdAt
        });
      });
      
      return response.data.data;
    }
    throw new Error('Failed to get notifications');
  } catch (error) {
    console.error('❌ Failed to get notifications:', error.response?.data || error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting Support Ticket Notification Test');
  console.log('=' .repeat(50));
  
  try {
    // Step 1: Get auth token
    console.log('\n🔐 Step 1: Getting authentication token...');
    const token = await getAuthToken(TEST_USER_EMAIL);
    console.log('✅ Authentication successful');
    
    // Step 2: Create a support ticket
    console.log('\n📝 Step 2: Creating support ticket...');
    const ticketId = await createSupportTicket(token);
    
    // Step 3: Check initial notifications
    console.log('\n🔔 Step 3: Checking initial notifications...');
    await checkNotifications(token);
    
    // Step 4: Add a comment (simulating another user)
    console.log('\n💬 Step 4: Adding comment to ticket...');
    await addCommentToTicket(token, ticketId);
    
    // Step 5: Check notifications after comment
    console.log('\n🔔 Step 5: Checking notifications after comment...');
    await checkNotifications(token);
    
    // Step 6: Update ticket status
    console.log('\n🔄 Step 6: Updating ticket status...');
    await updateTicket(token, ticketId);
    
    // Step 7: Check notifications after update
    console.log('\n🔔 Step 7: Checking notifications after update...');
    await checkNotifications(token);
    
    // Step 8: Close ticket
    console.log('\n🔒 Step 8: Closing ticket...');
    await closeTicket(token, ticketId);
    
    // Step 9: Final notification check
    console.log('\n🔔 Step 9: Final notification check...');
    await checkNotifications(token);
    
    console.log('\n✅ Test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Support ticket created and managed');
    console.log('- Comments added to trigger notifications');
    console.log('- Ticket status updated to trigger notifications');
    console.log('- Ticket closed to trigger notifications');
    console.log('- Real-time notifications should appear for the ticket creator');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  main();
}

module.exports = {
  createSupportTicket,
  addCommentToTicket,
  updateTicket,
  closeTicket,
  checkNotifications
};
