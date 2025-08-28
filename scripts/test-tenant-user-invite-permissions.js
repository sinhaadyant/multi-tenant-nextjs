// Test script to check tenant user invite permissions
// Run this in your browser console while on a tenant users page

console.log('🧪 Testing Tenant User Invite Permissions...');

const TENANT_SLUG = window.location.pathname.split('/')[1]; // Get tenant slug from URL

// Test 1: Check current page and user context
function testCurrentContext() {
  console.log('\n📋 Test 1: Current Context');
  console.log('Current URL:', window.location.href);
  console.log('Tenant Slug:', TENANT_SLUG);
  console.log('Is Users Page:', window.location.pathname.includes('/users'));
  
  if (!TENANT_SLUG || TENANT_SLUG === 'superadmin') {
    console.log('❌ Not on a tenant users page');
    return false;
  }
  
  console.log('✅ On tenant users page');
  return true;
}

// Test 2: Check user permissions from the users API
async function testUserPermissions() {
  console.log('\n📋 Test 2: User Permissions Check');
  try {
    const response = await fetch(`/api/tenant/${TENANT_SLUG}/users`);
    const data = await response.json();
    
    console.log('Users API Response:', data);
    
    if (data.success) {
      console.log('✅ Users API call successful');
      console.log('Permissions returned:', data.data?.permissions);
      
      const permissions = data.data?.permissions;
      if (permissions) {
        console.log('📊 Permission Details:');
        console.log('- canView:', permissions.canView);
        console.log('- canViewAll:', permissions.canViewAll);
        console.log('- canCreate:', permissions.canCreate);
        console.log('- canUpdate:', permissions.canUpdate);
        console.log('- canDelete:', permissions.canDelete);
        
        if (permissions.canCreate) {
          console.log('✅ User has CREATE permission - invite should work!');
        } else {
          console.log('❌ User does NOT have CREATE permission - invite will not work');
        }
      } else {
        console.log('❌ No permissions data returned');
      }
      
      return permissions;
    } else {
      console.log('❌ Users API call failed:', data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Users API call error:', error);
    return null;
  }
}

// Test 3: Check if invite button is visible
function testInviteButtonVisibility() {
  console.log('\n📋 Test 3: Invite Button Visibility');
  
  // Look for invite button
  const inviteButton = document.querySelector('button[onclick*="setShowInviteModal"], button:contains("Invite User")');
  const createButton = document.querySelector('button:contains("Create User")');
  
  console.log('Invite button found:', !!inviteButton);
  console.log('Create button found:', !!createButton);
  
  // Check if buttons are visible
  if (inviteButton) {
    const isVisible = inviteButton.offsetParent !== null;
    console.log('Invite button visible:', isVisible);
    console.log('Invite button text:', inviteButton.textContent?.trim());
  }
  
  if (createButton) {
    const isVisible = createButton.offsetParent !== null;
    console.log('Create button visible:', isVisible);
    console.log('Create button text:', createButton.textContent?.trim());
  }
  
  return {
    inviteButtonFound: !!inviteButton,
    createButtonFound: !!createButton
  };
}

// Test 4: Test invite API directly
async function testInviteAPI() {
  console.log('\n📋 Test 4: Invite API Test');
  try {
    const testInviteData = {
      email: 'test@example.com',
      name: 'Test User',
      roleId: 'test-role-id', // This will fail, but we want to see the permission check
      message: 'Test invitation'
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
    
    if (response.status === 403) {
      console.log('❌ Permission denied - user does not have invite permission');
      console.log('Error message:', data.message);
    } else if (response.status === 400) {
      console.log('⚠️ Bad request (expected for test data) - but permission check passed');
      console.log('Error message:', data.message);
    } else if (response.status === 200) {
      console.log('✅ Invite API call successful (unexpected for test data)');
    } else {
      console.log('❌ Unexpected response:', response.status, data);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Invite API call error:', error);
    return null;
  }
}

// Test 5: Check user roles and permissions
async function testUserRoles() {
  console.log('\n📋 Test 5: User Roles and Permissions');
  try {
    const response = await fetch(`/api/tenant/${TENANT_SLUG}/profile`);
    const data = await response.json();
    
    console.log('Profile API Response:', data);
    
    if (data.success) {
      console.log('✅ Profile API call successful');
      const user = data.data?.user;
      
      if (user) {
        console.log('User roles:', user.userRoles?.length || 0);
        
        if (user.userRoles && user.userRoles.length > 0) {
          user.userRoles.forEach((userRole: any, index: number) => {
            console.log(`Role ${index + 1}:`, userRole.role?.name);
            console.log(`Permissions count:`, userRole.role?.permissions?.length || 0);
            
            if (userRole.role?.permissions) {
              const userPermissions = userRole.role.permissions.filter((p: any) => 
                p.moduleKey === 'users' || p.moduleKey === 'user-management'
              );
              
              console.log(`User-related permissions:`, userPermissions.length);
              userPermissions.forEach((perm: any) => {
                console.log(`- ${perm.moduleKey}: create=${perm.canCreate}, read=${perm.canRead}, update=${perm.canUpdate}, delete=${perm.canDelete}`);
              });
            }
          });
        } else {
          console.log('❌ User has no roles assigned');
        }
      }
    } else {
      console.log('❌ Profile API call failed:', data.message);
    }
  } catch (error) {
    console.error('❌ Profile API call error:', error);
  }
}

// Test 6: Check if invite modal can be opened
function testInviteModal() {
  console.log('\n📋 Test 6: Invite Modal Test');
  
  // Look for invite modal trigger
  const inviteButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
    btn.textContent?.includes('Invite') || btn.textContent?.includes('Invite User')
  );
  
  console.log('Invite buttons found:', inviteButtons.length);
  
  if (inviteButtons.length > 0) {
    console.log('✅ Invite button found - attempting to click');
    
    // Try to click the first invite button
    try {
      inviteButtons[0].click();
      console.log('✅ Invite button clicked');
      
      // Check if modal appeared
      setTimeout(() => {
        const modal = document.querySelector('[role="dialog"], .modal, [class*="modal"]');
        console.log('Modal appeared after click:', !!modal);
        
        if (modal) {
          console.log('✅ Invite modal is working!');
        } else {
          console.log('❌ Invite modal did not appear');
        }
      }, 500);
      
    } catch (error) {
      console.error('❌ Error clicking invite button:', error);
    }
  } else {
    console.log('❌ No invite buttons found');
  }
}

// Run all tests
async function runAllTests() {
  console.log(`Testing tenant user invite for: ${TENANT_SLUG}`);
  
  // Test 1: Check current context
  const isOnUsersPage = testCurrentContext();
  if (!isOnUsersPage) {
    console.log('❌ Stopping tests - not on tenant users page');
    return;
  }
  
  // Test 2: Check user permissions
  const permissions = await testUserPermissions();
  
  // Test 3: Check button visibility
  const buttonVisibility = testInviteButtonVisibility();
  
  // Test 4: Test invite API
  await testInviteAPI();
  
  // Test 5: Check user roles
  await testUserRoles();
  
  // Test 6: Test invite modal
  testInviteModal();
  
  // Summary
  console.log('\n📋 Test Summary:');
  console.log('- Has Create Permission:', permissions?.canCreate);
  console.log('- Invite Button Found:', buttonVisibility.inviteButtonFound);
  console.log('- Create Button Found:', buttonVisibility.createButtonFound);
  
  if (permissions?.canCreate) {
    console.log('\n✅ User has CREATE permission - invite functionality should work!');
    console.log('If invite is not working, check:');
    console.log('1. Button visibility in the UI');
    console.log('2. Modal component loading');
    console.log('3. API endpoint configuration');
  } else {
    console.log('\n❌ User does NOT have CREATE permission - invite will not work');
    console.log('To fix this:');
    console.log('1. Assign a role with "users.create" permission to the user');
    console.log('2. Check the role permissions in the database');
    console.log('3. Verify the permission checking logic');
  }
}

// Run tests
runAllTests();
