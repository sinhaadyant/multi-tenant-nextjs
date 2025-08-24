const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TENANT_SLUG = 'cons';
const TEST_USER = 'test11@gmail.com';
const TEST_PASSWORD = 'password123';

async function testTenantSupport() {
  console.log('🧪 Testing Tenant Support Module...\n');

  try {
    // Step 1: Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/api/tenant/auth/login`, {
      email: TEST_USER,
      password: TEST_PASSWORD,
      tenantSlug: TENANT_SLUG
    });

    if (!loginResponse.data.success) {
      throw new Error(`Login failed: ${loginResponse.data.message}`);
    }

    const { token } = loginResponse.data.data;
    console.log('✅ Login successful\n');

    // Set up axios with auth token
    const api = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Step 2: Test GET support tickets
    console.log('2️⃣ Testing GET support tickets...');
    const ticketsResponse = await api.get(`/api/tenant/${TENANT_SLUG}/support`);
    
    if (!ticketsResponse.data.success) {
      throw new Error(`GET support tickets failed: ${ticketsResponse.data.message}`);
    }

    const ticketsData = ticketsResponse.data.data;
    console.log('✅ GET support tickets successful');
    console.log('📊 Support tickets data:', {
      totalTickets: ticketsData.tickets?.length || 0,
      pagination: ticketsData.pagination,
      stats: ticketsData.stats
    });

    // Step 3: Test GET support ticket detail (if tickets exist)
    if (ticketsData.tickets && ticketsData.tickets.length > 0) {
      const testTicket = ticketsData.tickets[0];
      console.log('\n3️⃣ Testing GET support ticket detail...');
      
      const ticketDetailResponse = await api.get(`/api/tenant/${TENANT_SLUG}/support/${testTicket.id}`);
      
      if (!ticketDetailResponse.data.success) {
        throw new Error(`GET ticket detail failed: ${ticketDetailResponse.data.message}`);
      }

      const ticketDetailData = ticketDetailResponse.data.data;
      console.log('✅ GET ticket detail successful');
      console.log('🎫 Ticket detail:', {
        id: ticketDetailData.ticket.id,
        title: ticketDetailData.ticket.title,
        status: ticketDetailData.ticket.status,
        priority: ticketDetailData.ticket.priority,
        category: ticketDetailData.ticket.category,
        createdBy: ticketDetailData.ticket.createdBy?.name
      });

      // Step 4: Test GET ticket comments
      console.log('\n4️⃣ Testing GET ticket comments...');
      
      const commentsResponse = await api.get(`/api/tenant/${TENANT_SLUG}/support/${testTicket.id}/comments`);
      
      if (!commentsResponse.data.success) {
        throw new Error(`GET comments failed: ${commentsResponse.data.message}`);
      }

      const commentsData = commentsResponse.data.data;
      console.log('✅ GET comments successful');
      console.log('💬 Comments:', {
        totalComments: commentsData.comments?.length || 0
      });
    } else {
      console.log('\n⚠️ No existing tickets found, skipping detail tests');
    }

    console.log('\n🎉 All tenant support tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testTenantSupport();
