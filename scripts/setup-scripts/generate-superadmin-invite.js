const axios = require('axios');

async function generateSuperAdminInvite() {
  try {
    console.log('🎫 Generating SuperAdmin invite link...');
    
    // First, login to get a token
    console.log('🔐 Logging in as existing SuperAdmin...');
    const loginResponse = await axios.post('http://localhost:3000/api/superadmin/auth/login', {
      email: 'admin@superadmin.com',
      password: 'Admin123!'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.message);
    }
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');
    
    // Generate invite for a new SuperAdmin
    const inviteEmail = 'newadmin@superadmin.com'; // You can change this email
    
    console.log(`📧 Creating invite for: ${inviteEmail}`);
    const inviteResponse = await axios.post('http://localhost:3000/api/superadmin/auth/create-invite', {
      email: inviteEmail,
      expiresInDays: 7
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!inviteResponse.data.success) {
      throw new Error('Invite creation failed: ' + inviteResponse.data.message);
    }
    
    const inviteData = inviteResponse.data.data.inviteToken;
    
    console.log('\n🎉 SuperAdmin Invite Link Generated Successfully!');
    console.log('=' .repeat(60));
    console.log(`📧 Email: ${inviteData.email}`);
    console.log(`🔗 Invite Link: ${inviteData.inviteLink}`);
    console.log(`⏰ Expires: ${new Date(inviteData.expiresAt).toLocaleString()}`);
    console.log(`🆔 Token ID: ${inviteData.id}`);
    console.log('=' .repeat(60));
    
    console.log('\n📋 Instructions:');
    console.log('1. Share the invite link with the new SuperAdmin');
    console.log('2. They can use this link to create their account');
    console.log('3. The link will expire in 7 days');
    console.log('4. Only the specified email can use this invite');
    
    return inviteData;
    
  } catch (error) {
    console.error('❌ Error generating invite:', error.response?.data || error.message);
    throw error;
  }
}

// Run the script
generateSuperAdminInvite()
  .then(() => {
    console.log('\n✅ Invite generation completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Invite generation failed:', error.message);
    process.exit(1);
  }); 