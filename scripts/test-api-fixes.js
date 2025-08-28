// Test script to verify the API fixes work
// Run this in your browser console while on a tenant users page

console.log('🧪 Testing API Fixes for Tenant User Invite...');

const TENANT_SLUG = window.location.pathname.split('/')[1]; // Get tenant slug from URL

// Test 1: Check if fix-permissions API works
async function testFixPermissionsAPI() {
  console.log('\n📋 Test 1: Fix Permissions API');
  try {
    const response = await fetch(`/api/tenant/${TENANT_SLUG}/fix-permissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('tenant_auth_token') || localStorage.getItem('auth_token')}`
      }
    });
    
    const data = await response.json();
    console.log('Fix Permissions API Response:', data);
    
    if (response.ok) {
      console.log('✅ Fix permissions API successful');
      console.log('Results:', data.data?.results);
      return data.data?.results;
    } else {
      console.log('❌ Fix permissions API failed:', data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Fix permissions API error:', error);
    return null;
  }
}

// Test 2: Check user permissions after fix
async function testUserPermissionsAfterFix() {
  console.log('\n📋 Test 2: User Permissions After Fix');
  try {
    const response = await fetch(`/api/tenant/${TENANT_SLUG}/users`);
    const data = await response.json();
    
    console.log('Users API Response:', data);
    
    if (data.success) {
      const permissions = data.data?.permissions;
      console.log('📊 Updated Permissions:');
      console.log('- canView:', permissions?.canView);
      console.log('- canViewAll:', permissions?.canViewAll);
      console.log('- canCreate:', permissions?.canCreate);
      console.log('- canUpdate:', permissions?.canUpdate);
      console.log('- canDelete:', permissions?.canDelete);
      
      if (permissions?.canCreate) {
        console.log('✅ User now has CREATE permission!');
        return true;
      } else {
        console.log('❌ User still does NOT have CREATE permission');
        return false;
      }
    } else {
      console.log('❌ Users API call failed:', data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Users API call error:', error);
    return false;
  }
}

// Test 3: Test invite API with real data
async function testInviteAPIWithRealData() {
  console.log('\n📋 Test 3: Invite API with Real Data');
  try {
    // First get available roles
    const rolesResponse = await fetch(`/api/tenant/${TENANT_SLUG}/roles?page=1&limit=10`);
    const rolesData = await rolesResponse.json();
    
    if (!rolesData.success || !rolesData.data?.roles?.length) {
      console.log('❌ No roles available for testing');
      return false;
    }
    
    const firstRole = rolesData.data.roles[0];
    console.log('Using role for test:', firstRole.name);
    
    const testInviteData = {
      email: `test-${Date.now()}@example.com`,
      name: 'Test User for API Fix',
      roleId: firstRole.id,
      message: 'Testing API fixes'
    };
    
    const response = await fetch(`/api/tenant/${TENANT_SLUG}/users/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('tenant_auth_token') || localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(testInviteData)
    });
    
    const data = await response.json();
    console.log('Invite API Response:', data);
    
    if (response.ok) {
      console.log('✅ Invite API call successful!');
      console.log('Invitation created:', data.data?.invitation?.id);
      return true;
    } else if (response.status === 403) {
      console.log('❌ Permission denied - user still does not have invite permission');
      return false;
    } else {
      console.log('⚠️ Invite API call failed:', data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Invite API call error:', error);
    return false;
  }
}

// Test 4: Check if invite button is now visible
function testInviteButtonVisibility() {
  console.log('\n📋 Test 4: Invite Button Visibility');
  
  // Look for invite button
  const inviteButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
    btn.textContent?.includes('Invite') || btn.textContent?.includes('Invite User')
  );
  
  console.log('Invite buttons found:', inviteButtons.length);
  
  if (inviteButtons.length > 0) {
    const isVisible = inviteButtons[0].offsetParent !== null;
    console.log('Invite button visible:', isVisible);
    console.log('Invite button text:', inviteButtons[0].textContent?.trim());
    
    if (isVisible) {
      console.log('✅ Invite button is now visible!');
      return true;
    } else {
      console.log('❌ Invite button found but not visible');
      return false;
    }
  } else {
    console.log('❌ No invite buttons found');
    return false;
  }
}

// Test 5: Test invite modal functionality
function testInviteModalFunctionality() {
  console.log('\n📋 Test 5: Invite Modal Functionality');
  
  const inviteButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
    btn.textContent?.includes('Invite') || btn.textContent?.includes('Invite User')
  );
  
  if (inviteButtons.length > 0) {
    console.log('Attempting to click invite button...');
    
    try {
      inviteButtons[0].click();
      console.log('✅ Invite button clicked');
      
      // Check if modal appeared
      setTimeout(() => {
        const modal = document.querySelector('[role="dialog"], .modal, [class*="modal"]');
        console.log('Modal appeared after click:', !!modal);
        
        if (modal) {
          console.log('✅ Invite modal is working!');
          
          // Try to close the modal
          const closeButtons = modal.querySelectorAll('button, [aria-label="Close"], .close');
          if (closeButtons.length > 0) {
            closeButtons[0].click();
            console.log('✅ Modal closed successfully');
          }
        } else {
          console.log('❌ Invite modal did not appear');
        }
      }, 1000);
      
      return true;
    } catch (error) {
      console.error('❌ Error clicking invite button:', error);
      return false;
    }
  } else {
    console.log('❌ No invite buttons found to test');
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log(`Testing API fixes for tenant: ${TENANT_SLUG}`);
  
  // Test 1: Fix permissions
  const fixResults = await testFixPermissionsAPI();
  
  // Test 2: Check permissions after fix
  const hasCreatePermission = await testUserPermissionsAfterFix();
  
  // Test 3: Test invite API
  const inviteAPISuccess = await testInviteAPIWithRealData();
  
  // Test 4: Check button visibility
  const buttonVisible = testInviteButtonVisibility();
  
  // Test 5: Test modal functionality
  const modalWorking = testInviteModalFunctionality();
  
  // Summary
  console.log('\n📋 Test Summary:');
  console.log('- Fix Permissions API:', fixResults ? '✅ Success' : '❌ Failed');
  console.log('- Has Create Permission:', hasCreatePermission ? '✅ Yes' : '❌ No');
  console.log('- Invite API Works:', inviteAPISuccess ? '✅ Yes' : '❌ No');
  console.log('- Invite Button Visible:', buttonVisible ? '✅ Yes' : '❌ No');
  console.log('- Modal Functionality:', modalWorking ? '✅ Yes' : '❌ No');
  
  if (hasCreatePermission && inviteAPISuccess && buttonVisible) {
    console.log('\n🎉 All API fixes are working! Tenant user invite functionality is now operational.');
  } else {
    console.log('\n❌ Some API fixes are not working. Check the individual test results above.');
  }
}

// Run tests
runAllTests();
