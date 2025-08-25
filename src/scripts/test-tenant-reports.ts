import axios from 'axios';

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TENANT_SLUG = 'acme-corp'; // Replace with your test tenant
const TEST_USER_EMAIL = 'admin@acme-corp.com';
const TEST_USER_PASSWORD = 'password123';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message: string;
  data?: any;
}

class TenantReportsTester {
  private authToken: string = '';
  private results: TestResult[] = [];

  async runTests() {
    console.log('🧪 Starting Tenant Reports Tests...\n');
    
    try {
      // Test 1: Authentication
      await this.testAuthentication();
      
      // Test 2: Reports Overview
      await this.testReportsOverview();
      
      // Test 3: Reports List with Filters
      await this.testReportsList();
      
      // Test 4: Search Functionality
      await this.testSearchFunctionality();
      
      // Test 5: Sorting Functionality
      await this.testSortingFunctionality();
      
      // Test 6: Generate Report
      await this.testGenerateReport();
      
      // Test 7: Export Reports
      await this.testExportReports();
      
      // Test 8: Report Details
      await this.testReportDetails();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
    
    this.printResults();
  }

  private async testAuthentication(): Promise<void> {
    try {
      console.log('🔐 Testing Authentication...');
      
      const response = await axios.post(`${BASE_URL}/api/tenant/${TENANT_SLUG}/auth/login`, {
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      });
      
      if (response.data.success && response.data.data.token) {
        this.authToken = response.data.data.token;
        this.addResult('Authentication', 'PASS', 'Successfully authenticated');
      } else {
        this.addResult('Authentication', 'FAIL', 'Authentication failed');
      }
    } catch (error: any) {
      this.addResult('Authentication', 'FAIL', `Authentication error: ${error.message}`);
    }
  }

  private async testReportsOverview(): Promise<void> {
    try {
      console.log('📊 Testing Reports Overview...');
      
      const response = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/reports/overview`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (response.data.success) {
        const data = response.data.data;
        this.addResult('Reports Overview', 'PASS', 'Successfully fetched reports overview', {
          totalReports: data.overview?.totalReports,
          reportsThisMonth: data.overview?.reportsThisMonth,
          totalUsers: data.tenantStats?.totalUsers
        });
      } else {
        this.addResult('Reports Overview', 'FAIL', 'Failed to fetch reports overview');
      }
    } catch (error: any) {
      this.addResult('Reports Overview', 'FAIL', `Overview error: ${error.message}`);
    }
  }

  private async testReportsList(): Promise<void> {
    try {
      console.log('📋 Testing Reports List...');
      
      const response = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/reports?page=1&limit=10`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (response.data.success) {
        const data = response.data.data;
        this.addResult('Reports List', 'PASS', 'Successfully fetched reports list', {
          reportsCount: data.reports?.length,
          totalPages: data.pagination?.totalPages,
          totalCount: data.pagination?.totalCount
        });
      } else {
        this.addResult('Reports List', 'FAIL', 'Failed to fetch reports list');
      }
    } catch (error: any) {
      this.addResult('Reports List', 'FAIL', `List error: ${error.message}`);
    }
  }

  private async testSearchFunctionality(): Promise<void> {
    try {
      console.log('🔍 Testing Search Functionality...');
      
      const response = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/reports?search=test`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (response.data.success) {
        this.addResult('Search Functionality', 'PASS', 'Search functionality working');
      } else {
        this.addResult('Search Functionality', 'FAIL', 'Search functionality failed');
      }
    } catch (error: any) {
      this.addResult('Search Functionality', 'FAIL', `Search error: ${error.message}`);
    }
  }

  private async testSortingFunctionality(): Promise<void> {
    try {
      console.log('📈 Testing Sorting Functionality...');
      
      const response = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/reports?sortBy=createdAt&sortOrder=desc`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (response.data.success) {
        this.addResult('Sorting Functionality', 'PASS', 'Sorting functionality working');
      } else {
        this.addResult('Sorting Functionality', 'FAIL', 'Sorting functionality failed');
      }
    } catch (error: any) {
      this.addResult('Sorting Functionality', 'FAIL', `Sorting error: ${error.message}`);
    }
  }

  private async testGenerateReport(): Promise<void> {
    try {
      console.log('📄 Testing Generate Report...');
      
      const reportData = {
        reportType: 'user_activity',
        name: 'Test User Activity Report',
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
        format: 'csv'
      };
      
      const response = await axios.post(`${BASE_URL}/api/tenant/${TENANT_SLUG}/reports`, reportData, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (response.data.success) {
        this.addResult('Generate Report', 'PASS', 'Successfully generated report', {
          reportId: response.data.data.report?.id
        });
      } else {
        this.addResult('Generate Report', 'FAIL', 'Failed to generate report');
      }
    } catch (error: any) {
      this.addResult('Generate Report', 'FAIL', `Generate error: ${error.message}`);
    }
  }

  private async testExportReports(): Promise<void> {
    try {
      console.log('📤 Testing Export Reports...');
      
      const response = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/reports/export?format=csv`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
        responseType: 'blob'
      });
      
      if (response.status === 200) {
        this.addResult('Export Reports', 'PASS', 'Successfully exported reports');
      } else {
        this.addResult('Export Reports', 'FAIL', 'Failed to export reports');
      }
    } catch (error: any) {
      this.addResult('Export Reports', 'FAIL', `Export error: ${error.message}`);
    }
  }

  private async testReportDetails(): Promise<void> {
    try {
      console.log('📋 Testing Report Details...');
      
      // First get a list of reports to find one to test details
      const listResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/reports?limit=1`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (listResponse.data.success && listResponse.data.data.reports?.length > 0) {
        const reportId = listResponse.data.data.reports[0].id;
        
        const detailsResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/reports/${reportId}`, {
          headers: { Authorization: `Bearer ${this.authToken}` }
        });
        
        if (detailsResponse.data.success) {
          this.addResult('Report Details', 'PASS', 'Successfully fetched report details');
        } else {
          this.addResult('Report Details', 'FAIL', 'Failed to fetch report details');
        }
      } else {
        this.addResult('Report Details', 'FAIL', 'No reports available to test details');
      }
    } catch (error: any) {
      this.addResult('Report Details', 'FAIL', `Details error: ${error.message}`);
    }
  }

  private addResult(test: string, status: 'PASS' | 'FAIL', message: string, data?: any): void {
    this.results.push({ test, status, message, data });
  }

  private printResults(): void {
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;
    
    this.results.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${icon} ${result.test}: ${result.message}`);
      if (result.data) {
        console.log(`   Data: ${JSON.stringify(result.data)}`);
      }
    });
    
    console.log('\n📈 Summary:');
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
      console.log('\n🎉 All tests passed! Tenant reports functionality is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the implementation.');
    }
  }
}

// Run the tests
async function main() {
  const tester = new TenantReportsTester();
  await tester.runTests();
}

// Only run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export default TenantReportsTester;
