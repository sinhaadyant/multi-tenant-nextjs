const axios = require('axios');

// Test tenant notifications API
async function testTenantNotifications() {
  console.log('🧪 Testing Tenant Notifications API...');
  
  const tenantSlug = 'riyo'; // Replace with actual tenant slug
  const baseUrl = `http://localhost:3000/api/tenant/${tenantSlug}/notifications`;
  
  try {
    // Test GET - List notifications
    console.log('\n📋 Testing GET /notifications (list)...');
    const listResponse = await fetch(`${baseUrl}?page=1&limit=10`);
    console.log('Status:', listResponse.status);
    
    if (listResponse.ok) {
      const listData = await listResponse.json();
      console.log('✅ List response:', {
        success: listData.success,
        notificationsCount: listData.data?.notifications?.length || 0,
        total: listData.data?.pagination?.total || 0,
        permissions: listData.data?.permissions
      });
    } else {
      console.log('❌ List failed:', await listResponse.text());
    }

    // Test POST - Create notification
    console.log('\n📝 Testing POST /notifications (create)...');
    const createData = {
      title: 'Test Notification',
      message: 'This is a test notification from the API',
      type: 'info',
      priority: 'medium',
      targetType: 'all_tenant_users',
      status: 'draft'
    };

    const createResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers if needed
      },
      body: JSON.stringify(createData)
    });

    console.log('Status:', createResponse.status);
    
    if (createResponse.ok) {
      const createResult = await createResponse.json();
      console.log('✅ Create response:', {
        success: createResult.success,
        notificationId: createResult.data?.notification?.id
      });
      
      // Test PUT - Update notification
      if (createResult.data?.notification?.id) {
        console.log('\n✏️ Testing PUT /notifications (update)...');
        const updateData = {
          id: createResult.data.notification.id,
          title: 'Updated Test Notification',
          message: 'This notification has been updated',
          type: 'warning',
          priority: 'high'
        };

        const updateResponse = await fetch(baseUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData)
        });

        console.log('Status:', updateResponse.status);
        
        if (updateResponse.ok) {
          const updateResult = await updateResponse.json();
          console.log('✅ Update response:', {
            success: updateResult.success,
            title: updateResult.data?.notification?.title
          });
        } else {
          console.log('❌ Update failed:', await updateResponse.text());
        }

        // Test DELETE - Delete notification
        console.log('\n🗑️ Testing DELETE /notifications (delete)...');
        const deleteResponse = await fetch(`${baseUrl}?id=${createResult.data.notification.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        console.log('Status:', deleteResponse.status);
        
        if (deleteResponse.ok) {
          const deleteResult = await deleteResponse.json();
          console.log('✅ Delete response:', {
            success: deleteResult.success,
            message: deleteResult.data?.message
          });
        } else {
          console.log('❌ Delete failed:', await deleteResponse.text());
        }
      }
    } else {
      console.log('❌ Create failed:', await createResponse.text());
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testTenantNotifications().catch(console.error);
