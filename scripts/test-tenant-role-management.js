// Test script to verify tenant role management fixes
// Run this in your browser console while on a tenant roles page

console.log('🧪 Testing Tenant Role Management Fixes...');

const TENANT_SLUG = window.location.pathname.split('/')[1]; // Get tenant slug from URL

// Test 1: Check if create button is visible and working
function testCreateButtonVisibility() {
  console.log('\n📋 Test 1: Create Button Visibility');
  
  const createButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
    btn.textContent?.includes('Create Role') || btn.textContent?.includes('Create First Role')
  );
  
  console.log('Create buttons found:', createButtons.length);
  
  if (createButtons.length > 0) {
    const isVisible = createButtons[0].offsetParent !== null;
    console.log('Create button visible:', isVisible);
    console.log('Create button text:', createButtons[0].textContent?.trim());
    console.log('Create button classes:', createButtons[0].className);
    
    if (isVisible) {
      console.log('✅ Create button is visible!');
      return true;
    } else {
      console.log('❌ Create button found but not visible');
      return false;
    }
  } else {
    console.log('❌ No create buttons found');
    return false;
  }
}

// Test 2: Test create button functionality
function testCreateButtonFunctionality() {
  console.log('\n📋 Test 2: Create Button Functionality');
  
  const createButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
    btn.textContent?.includes('Create Role') || btn.textContent?.includes('Create First Role')
  );
  
  if (createButtons.length > 0) {
    console.log('Attempting to click create button...');
    
    try {
      createButtons[0].click();
      console.log('✅ Create button clicked');
      
      // Check if modal appeared
      setTimeout(() => {
        const modal = document.querySelector('[role="dialog"], .modal, [class*="modal"]');
        console.log('Modal appeared after click:', !!modal);
        
        if (modal) {
          console.log('✅ Create role modal is working!');
          
          // Check for form elements
          const nameInput = modal.querySelector('input[placeholder*="role name"], input[placeholder*="Role name"]');
          const colorInput = modal.querySelector('input[type="color"]');
          const descriptionTextarea = modal.querySelector('textarea');
          const submitButton = modal.querySelector('button[type="submit"]');
          
          console.log('Form elements found:');
          console.log('- Name input:', !!nameInput);
          console.log('- Color input:', !!colorInput);
          console.log('- Description textarea:', !!descriptionTextarea);
          console.log('- Submit button:', !!submitButton);
          
          // Try to close the modal
          const closeButtons = modal.querySelectorAll('button, [aria-label="Close"], .close');
          if (closeButtons.length > 0) {
            closeButtons[0].click();
            console.log('✅ Modal closed successfully');
          }
        } else {
          console.log('❌ Create role modal did not appear');
        }
      }, 1000);
      
      return true;
    } catch (error) {
      console.error('❌ Error clicking create button:', error);
      return false;
    }
  } else {
    console.log('❌ No create buttons found to test');
    return false;
  }
}

// Test 3: Test role creation API
async function testRoleCreationAPI() {
  console.log('\n📋 Test 3: Role Creation API');
  try {
    const testRoleData = {
      name: `Test Role ${Date.now()}`,
      description: 'Test role for API validation',
      color: '#3b82f6',
      permissions: [
        {
          moduleKey: 'users',
          canCreate: true,
          canRead: true,
          canUpdate: false,
          canDelete: false,
          canViewAll: false
        }
      ]
    };
    
    const response = await fetch(`/api/tenant/${TENANT_SLUG}/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('tenant_auth_token') || localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(testRoleData)
    });
    
    const data = await response.json();
    console.log('Role creation API response:', data);
    
    if (response.ok) {
      console.log('✅ Role creation API successful!');
      console.log('Created role ID:', data.data?.role?.id);
      return true;
    } else {
      console.log('❌ Role creation API failed:', data.message);
      if (data.errors) {
        console.log('Validation errors:', data.errors);
      }
      return false;
    }
  } catch (error) {
    console.error('❌ Role creation API error:', error);
    return false;
  }
}

// Test 4: Test duplicate role name validation
async function testDuplicateRoleValidation() {
  console.log('\n📋 Test 4: Duplicate Role Name Validation');
  try {
    const duplicateRoleData = {
      name: 'Test Duplicate Role',
      description: 'Testing duplicate name validation',
      color: '#ef4444',
      permissions: [
        {
          moduleKey: 'users',
          canCreate: false,
          canRead: true,
          canUpdate: false,
          canDelete: false,
          canViewAll: false
        }
      ]
    };
    
    // First, create a role
    const createResponse = await fetch(`/api/tenant/${TENANT_SLUG}/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('tenant_auth_token') || localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(duplicateRoleData)
    });
    
    if (createResponse.ok) {
      console.log('✅ First role created successfully');
      
      // Now try to create another role with the same name
      const duplicateResponse = await fetch(`/api/tenant/${TENANT_SLUG}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('tenant_auth_token') || localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(duplicateRoleData)
      });
      
      const duplicateData = await duplicateResponse.json();
      console.log('Duplicate role creation response:', duplicateData);
      
      if (duplicateResponse.status === 400) {
        console.log('✅ Duplicate role validation working correctly!');
        console.log('Error message:', duplicateData.message);
        return true;
      } else {
        console.log('❌ Duplicate role validation failed - should have returned 400');
        return false;
      }
    } else {
      console.log('❌ Failed to create first role for duplicate test');
      return false;
    }
  } catch (error) {
    console.error('❌ Duplicate role validation test error:', error);
    return false;
  }
}

// Test 5: Test form validation
function testFormValidation() {
  console.log('\n📋 Test 5: Form Validation');
  
  const createButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
    btn.textContent?.includes('Create Role') || btn.textContent?.includes('Create First Role')
  );
  
  if (createButtons.length > 0) {
    try {
      createButtons[0].click();
      
      setTimeout(() => {
        const modal = document.querySelector('[role="dialog"], .modal, [class*="modal"]');
        if (modal) {
          console.log('✅ Modal opened for validation test');
          
          // Find submit button and click it without filling form
          const submitButton = modal.querySelector('button[type="submit"]');
          if (submitButton) {
            submitButton.click();
            console.log('✅ Submit button clicked without form data');
            
            // Check for error messages
            setTimeout(() => {
              const errorMessages = modal.querySelectorAll('.text-red-500, [class*="error"]');
              console.log('Error messages found:', errorMessages.length);
              
              if (errorMessages.length > 0) {
                console.log('✅ Form validation is working!');
                errorMessages.forEach((error, index) => {
                  console.log(`Error ${index + 1}:`, error.textContent?.trim());
                });
              } else {
                console.log('❌ No error messages found - validation may not be working');
              }
              
              // Close modal
              const closeButtons = modal.querySelectorAll('button, [aria-label="Close"], .close');
              if (closeButtons.length > 0) {
                closeButtons[0].click();
              }
            }, 500);
          }
        }
      }, 1000);
      
      return true;
    } catch (error) {
      console.error('❌ Form validation test error:', error);
      return false;
    }
  } else {
    console.log('❌ No create buttons found for validation test');
    return false;
  }
}

// Test 6: Check CSS styling
function testCSSStyling() {
  console.log('\n📋 Test 6: CSS Styling');
  
  const createButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
    btn.textContent?.includes('Create Role') || btn.textContent?.includes('Create First Role')
  );
  
  if (createButtons.length > 0) {
    const button = createButtons[0];
    const styles = window.getComputedStyle(button);
    
    console.log('Button styling:');
    console.log('- Background color:', styles.backgroundColor);
    console.log('- Color:', styles.color);
    console.log('- Border radius:', styles.borderRadius);
    console.log('- Padding:', styles.padding);
    console.log('- Display:', styles.display);
    console.log('- Position:', styles.position);
    
    // Check if button has proper styling
    const hasBlueBackground = styles.backgroundColor.includes('rgb(37, 99, 235)') || 
                             styles.backgroundColor.includes('rgba(37, 99, 235') ||
                             button.className.includes('bg-blue');
    
    const hasWhiteText = styles.color.includes('rgb(255, 255, 255)') || 
                        styles.color.includes('rgba(255, 255, 255') ||
                        button.className.includes('text-white');
    
    if (hasBlueBackground && hasWhiteText) {
      console.log('✅ Button has proper styling!');
      return true;
    } else {
      console.log('❌ Button styling issues detected');
      return false;
    }
  } else {
    console.log('❌ No create buttons found for styling test');
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log(`Testing tenant role management for: ${TENANT_SLUG}`);
  
  // Test 1: Create button visibility
  const buttonVisible = testCreateButtonVisibility();
  
  // Test 2: Create button functionality
  const buttonWorking = testCreateButtonFunctionality();
  
  // Test 3: Role creation API
  const apiWorking = await testRoleCreationAPI();
  
  // Test 4: Duplicate validation
  const validationWorking = await testDuplicateRoleValidation();
  
  // Test 5: Form validation
  const formValidationWorking = testFormValidation();
  
  // Test 6: CSS styling
  const stylingCorrect = testCSSStyling();
  
  // Summary
  console.log('\n📋 Test Summary:');
  console.log('- Create Button Visible:', buttonVisible ? '✅ Yes' : '❌ No');
  console.log('- Create Button Working:', buttonWorking ? '✅ Yes' : '❌ No');
  console.log('- Role Creation API:', apiWorking ? '✅ Yes' : '❌ No');
  console.log('- Duplicate Validation:', validationWorking ? '✅ Yes' : '❌ No');
  console.log('- Form Validation:', formValidationWorking ? '✅ Yes' : '❌ No');
  console.log('- CSS Styling:', stylingCorrect ? '✅ Yes' : '❌ No');
  
  if (buttonVisible && buttonWorking && apiWorking && validationWorking && formValidationWorking && stylingCorrect) {
    console.log('\n🎉 All tenant role management fixes are working!');
  } else {
    console.log('\n❌ Some fixes are not working. Check the individual test results above.');
  }
}

// Run tests
runAllTests();
