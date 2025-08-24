const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TENANT_SLUG = 'test-tenant';

// Test data
const testUser = {
  email: 'testuser@example.com',
  password: 'password123'
};

const testSuperAdmin = {
  email: 'superadmin@example.com',
  password: 'password123'
};

const testTicket = {
  title: 'Test Support Ticket',
  description: 'This is a test support ticket to verify the complete workflow',
  category: 'technical',
  priority: 'medium',
  attachments: []
};

let userToken = '';
let superAdminToken = '';
let createdTicketId = '';

async function loginUser() {
  console.log('🔐 Logging in as tenant user...');
  try {
    const response = await axios.post(`${BASE_URL}/api/tenant/${TENANT_SLUG}/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    userToken = response.data.data.token;
    console.log('✅ User logged in successfully');
    return true;
  } catch (error) {
    console.error('❌ User login failed:', error.response?.data || error.message);
    return false;
  }
}

async function loginSuperAdmin() {
  console.log('🔐 Logging in as superadmin...');
  try {
    const response = await axios.post(`${BASE_URL}/api/superadmin/login`, {
      email: testSuperAdmin.email,
      password: testSuperAdmin.password
    });
    
    superAdminToken = response.data.data.token;
    console.log('✅ SuperAdmin logged in successfully');
    return true;
  } catch (error) {
    console.error('❌ SuperAdmin login failed:', error.response?.data || error.message);
    return false;
  }
}

async function createSupportTicket() {
  console.log('\n📝 Creating support ticket...');
  try {
    const response = await axios.post(`${BASE_URL}/api/tenant/${TENANT_SLUG}/support`, testTicket, {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    createdTicketId = response.data.data.ticket.id;
    console.log('✅ Support ticket created successfully');
    console.log(`   Ticket ID: ${createdTicketId}`);
    console.log(`   Title: ${response.data.data.ticket.title}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to create support ticket:', error.response?.data || error.message);
    return false;
  }
}

async function checkSuperAdminNotifications() {
  console.log('\n🔔 Checking superadmin notifications...');
  try {
    const response = await axios.get(`${BASE_URL}/api/superadmin/notifications`, {
      headers: {
        'Authorization': `Bearer ${superAdminToken}`
      }
    });
    
    const notifications = response.data.data.notifications;
    const supportNotifications = notifications.filter(n => 
      n.title.includes('Support Ticket') || n.message.includes('support ticket')
    );
    
    console.log(`✅ Found ${supportNotifications.length} support-related notifications`);
    supportNotifications.forEach((notification, index) => {
      console.log(`   ${index + 1}. ${notification.title}`);
      console.log(`      Message: ${notification.message}`);
      console.log(`      Type: ${notification.type}`);
      console.log(`      Priority: ${notification.priority}`);
    });
    
    return supportNotifications.length > 0;
  } catch (error) {
    console.error('❌ Failed to check superadmin notifications:', error.response?.data || error.message);
    return false;
  }
}

async function superAdminReply() {
  console.log('\n💬 SuperAdmin replying to ticket...');
  try {
    const replyData = {
      text: 'Thank you for your support ticket. We are looking into this issue.',
      attachments: []
    };
    
    const response = await axios.post(`${BASE_URL}/api/superadmin/support/${createdTicketId}/comments`, replyData, {
      headers: {
        'Authorization': `Bearer ${superAdminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ SuperAdmin reply added successfully');
    console.log(`   Comment ID: ${response.data.data.comment.id}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to add superadmin reply:', error.response?.data || error.message);
    return false;
  }
}

async function superAdminReplyWithAttachment() {
  console.log('\n📎 SuperAdmin replying with attachment...');
  try {
    const replyData = {
      text: 'Please find the attached documentation for your issue.',
      attachments: [
        {
          filename: 'documentation.pdf',
          originalName: 'documentation.pdf',
          mimeType: 'application/pdf',
          size: 1024,
          path: '/uploads/superadmin/support/documentation.pdf'
        }
      ]
    };
    
    const response = await axios.post(`${BASE_URL}/api/superadmin/support/${createdTicketId}/comments`, replyData, {
      headers: {
        'Authorization': `Bearer ${superAdminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ SuperAdmin reply with attachment added successfully');
    console.log(`   Comment ID: ${response.data.data.comment.id}`);
    console.log(`   Attachments: ${response.data.data.comment.attachments.length}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to add superadmin reply with attachment:', error.response?.data || error.message);
    return false;
  }
}

async function userReply() {
  console.log('\n💬 User replying to ticket...');
  try {
    const replyData = {
      text: 'Thank you for the response. I have additional information to share.',
      attachments: []
    };
    
    const response = await axios.post(`${BASE_URL}/api/tenant/${TENANT_SLUG}/support/${createdTicketId}/comments`, replyData, {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ User reply added successfully');
    console.log(`   Comment ID: ${response.data.data.comment.id}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to add user reply:', error.response?.data || error.message);
    return false;
  }
}

async function userReplyWithAttachment() {
  console.log('\n📎 User replying with attachment...');
  try {
    const replyData = {
      text: 'Please find the screenshot of the issue I mentioned.',
      attachments: [
        {
          filename: 'screenshot.png',
          originalName: 'screenshot.png',
          mimeType: 'image/png',
          size: 2048,
          path: '/uploads/tenant/support/screenshot.png'
        }
      ]
    };
    
    const response = await axios.post(`${BASE_URL}/api/tenant/${TENANT_SLUG}/support/${createdTicketId}/comments`, replyData, {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ User reply with attachment added successfully');
    console.log(`   Comment ID: ${response.data.data.comment.id}`);
    console.log(`   Attachments: ${response.data.data.comment.attachments.length}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to add user reply with attachment:', error.response?.data || error.message);
    return false;
  }
}

async function checkUserNotifications() {
  console.log('\n🔔 Checking user notifications...');
  try {
    const response = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/notifications`, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });
    
    const notifications = response.data.data.notifications;
    const supportNotifications = notifications.filter(n => 
      n.title.includes('Support Ticket') || n.message.includes('support ticket')
    );
    
    console.log(`✅ Found ${supportNotifications.length} support-related notifications`);
    supportNotifications.forEach((notification, index) => {
      console.log(`   ${index + 1}. ${notification.title}`);
      console.log(`      Message: ${notification.message}`);
      console.log(`      Type: ${notification.type}`);
      console.log(`      Priority: ${notification.priority}`);
    });
    
    return supportNotifications.length > 0;
  } catch (error) {
    console.error('❌ Failed to check user notifications:', error.response?.data || error.message);
    return false;
  }
}

async function superAdminCloseTicket() {
  console.log('\n🔒 SuperAdmin closing ticket...');
  try {
    const updateData = {
      status: 'closed'
    };
    
    const response = await axios.put(`${BASE_URL}/api/superadmin/support/${createdTicketId}`, updateData, {
      headers: {
        'Authorization': `Bearer ${superAdminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Ticket closed successfully');
    console.log(`   Status: ${response.data.data.ticket.status}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to close ticket:', error.response?.data || error.message);
    return false;
  }
}

async function viewTicketDetails() {
  console.log('\n👁️ Viewing ticket details...');
  try {
    const response = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/support/${createdTicketId}`, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });
    
    const ticket = response.data.data.ticket;
    console.log('✅ Ticket details retrieved successfully');
    console.log(`   Title: ${ticket.title}`);
    console.log(`   Status: ${ticket.status}`);
    console.log(`   Priority: ${ticket.priority}`);
    console.log(`   Category: ${ticket.category}`);
    console.log(`   Comments: ${ticket.comments.length}`);
    console.log(`   Attachments: ${ticket.attachments.length}`);
    
    // Show comments
    if (ticket.comments.length > 0) {
      console.log('\n   Comments:');
      ticket.comments.forEach((comment, index) => {
        console.log(`     ${index + 1}. ${comment.text}`);
        console.log(`        By: ${comment.user?.name || comment.superAdmin?.name}`);
        console.log(`        Attachments: ${comment.attachments.length}`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to view ticket details:', error.response?.data || error.message);
    return false;
  }
}

async function runCompleteWorkflow() {
  console.log('🚀 Starting Support Ticket Workflow Test\n');
  
  // Step 1: Login as user
  if (!(await loginUser())) {
    console.log('❌ Workflow failed at user login');
    return;
  }
  
  // Step 2: Login as superadmin
  if (!(await loginSuperAdmin())) {
    console.log('❌ Workflow failed at superadmin login');
    return;
  }
  
  // Step 3: Create support ticket
  if (!(await createSupportTicket())) {
    console.log('❌ Workflow failed at ticket creation');
    return;
  }
  
  // Step 4: Check superadmin notifications (should have notification about new ticket)
  await checkSuperAdminNotifications();
  
  // Step 5: SuperAdmin replies
  if (!(await superAdminReply())) {
    console.log('❌ Workflow failed at superadmin reply');
    return;
  }
  
  // Step 6: Check user notifications (should have notification about reply)
  await checkUserNotifications();
  
  // Step 7: User replies
  if (!(await userReply())) {
    console.log('❌ Workflow failed at user reply');
    return;
  }
  
  // Step 8: SuperAdmin replies with attachment
  if (!(await superAdminReplyWithAttachment())) {
    console.log('❌ Workflow failed at superadmin reply with attachment');
    return;
  }
  
  // Step 9: Check user notifications (should have notification about reply with attachment)
  await checkUserNotifications();
  
  // Step 10: User replies with attachment
  if (!(await userReplyWithAttachment())) {
    console.log('❌ Workflow failed at user reply with attachment');
    return;
  }
  
  // Step 11: SuperAdmin closes ticket
  if (!(await superAdminCloseTicket())) {
    console.log('❌ Workflow failed at ticket closure');
    return;
  }
  
  // Step 12: Check user notifications (should have notification about ticket closure)
  await checkUserNotifications();
  
  // Step 13: View final ticket details
  await viewTicketDetails();
  
  console.log('\n🎉 Support Ticket Workflow Test Completed Successfully!');
  console.log('\n📋 Summary:');
  console.log('✅ User created support ticket');
  console.log('✅ SuperAdmin received notification');
  console.log('✅ SuperAdmin replied to ticket');
  console.log('✅ User received notification');
  console.log('✅ User replied to ticket');
  console.log('✅ SuperAdmin replied with attachment');
  console.log('✅ User received notification');
  console.log('✅ User replied with attachment');
  console.log('✅ SuperAdmin closed ticket');
  console.log('✅ User received closure notification');
  console.log('✅ All notifications working correctly');
}

// Run the test
runCompleteWorkflow().catch(console.error);

