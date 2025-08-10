import axios from 'axios';

async function testAPI() {
  try {
    console.log('🧪 Testing API endpoints...');

    // Test the dashboard endpoint
    const response = await axios.get('http://localhost:3000/api/superadmin/dashboard?range=7d', {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    console.log('✅ API Response Status:', response.status);
    console.log('✅ API Response Data:', {
      success: response.data.success,
      hasData: !!response.data.data,
      dataKeys: response.data.data ? Object.keys(response.data.data) : [],
      summary: response.data.data?.summary,
      charts: response.data.data?.charts ? {
        userSignups: response.data.data.charts.userSignups?.length || 0,
        tenantActivity: response.data.data.charts.tenantActivity?.length || 0,
        roleDistribution: response.data.data.charts.roleDistribution?.length || 0,
        planDistribution: response.data.data.charts.tenantPlanDistribution?.length || 0,
      } : null,
      recentActivity: response.data.data?.recentActivity?.auditLogs?.length || 0,
      topTenants: response.data.data?.topTenants?.length || 0,
    });

    if (response.data.success && response.data.data) {
      console.log('🎉 API is working correctly!');
      console.log('📊 Dashboard data summary:');
      console.log(`- Total Tenants: ${response.data.data.summary?.totalTenants || 0}`);
      console.log(`- Active Tenants: ${response.data.data.summary?.activeTenants || 0}`);
      console.log(`- Total Users: ${response.data.data.summary?.totalUsers || 0}`);
      console.log(`- SuperAdmins: ${response.data.data.summary?.totalSuperAdmins || 0}`);
      console.log(`- Recent Activities: ${response.data.data.recentActivity?.auditLogs?.length || 0}`);
      console.log(`- Top Tenants: ${response.data.data.topTenants?.length || 0}`);
    } else {
      console.log('❌ API returned error:', response.data);
    }

  } catch (error: any) {
    console.error('❌ API test failed:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });
  }
}

testAPI(); 