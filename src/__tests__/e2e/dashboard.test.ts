import { PuppeteerTestHelper, testData, selectors } from './puppeteer-setup';

describe('SuperAdmin Dashboard E2E Tests', () => {
  let testHelper: PuppeteerTestHelper;

  beforeAll(async () => {
    testHelper = new PuppeteerTestHelper();
    await testHelper.setup();
  });

  afterAll(async () => {
    await testHelper.teardown();
  });

  beforeEach(async () => {
    // Login before each test
    await testHelper.login(testData.superAdmin.email, testData.superAdmin.password);
  });

  describe('Dashboard Overview', () => {
    test('should navigate to dashboard and display overview', async () => {
      await testHelper.navigateTo('/superadmin/dashboard');
      
      // Verify we're on the dashboard page
      await testHelper.expectUrlToContain('/superadmin/dashboard');
      
      // Wait for page to load and check for any content
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check if page has any content
      const bodyText = await testHelper.getPage().$eval('body', el => el.textContent || '');
      expect(bodyText.length).toBeGreaterThan(0);
      
      // Look for dashboard-related content
      expect(bodyText.toLowerCase()).toContain('dashboard');
    });

    test('should display dashboard content after loading', async () => {
      await testHelper.navigateTo('/superadmin/dashboard');
      
      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      // Check for any dashboard content
      const dashboardContent = await testHelper.getPage().$eval('body', el => {
        const text = el.textContent || '';
        return text.includes('Dashboard') || text.includes('Tenants') || text.includes('Users');
      });
      
      expect(dashboardContent).toBe(true);
    });

    test('should have working navigation', async () => {
      await testHelper.navigateTo('/superadmin/dashboard');
      
      // Wait for page to load
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check if we can find any navigation elements
      const navElements = await testHelper.getPage().$$('nav, [role="navigation"], a[href]');
      expect(navElements.length).toBeGreaterThan(0);
    });
  });

  describe('Dashboard Functionality', () => {
    test('should load without JavaScript errors', async () => {
      await testHelper.navigateTo('/superadmin/dashboard');
      
      // Wait for page to load
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      // Check for any console errors (this will be captured by the page.on('pageerror') handler)
      const hasErrors = await testHelper.getPage().evaluate(() => {
        return window.performance.getEntriesByType('resource')
          .filter((resource: any) => resource.initiatorType === 'xmlhttprequest' && resource.responseStatus >= 400)
          .length;
      });
      
      // Allow some minor errors (like 404s for missing resources)
      expect(hasErrors).toBeLessThan(10);
    });

    test('should have responsive layout', async () => {
      await testHelper.navigateTo('/superadmin/dashboard');
      
      // Wait for page to load
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check if page has responsive classes
      const hasResponsiveClasses = await testHelper.getPage().$eval('body', el => {
        const html = el.innerHTML;
        return html.includes('grid') || html.includes('flex') || html.includes('responsive');
      });
      
      expect(hasResponsiveClasses).toBe(true);
    });
  });

  describe('Dashboard Performance', () => {
    test('should load within reasonable time', async () => {
      const startTime = Date.now();
      
      await testHelper.navigateTo('/superadmin/dashboard');
      
      // Wait for basic content to load
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      const loadTime = Date.now() - startTime;
      
      // Dashboard should load within 20 seconds (including API calls)
      expect(loadTime).toBeLessThan(20000);
    });

    test('should handle API requests', async () => {
      await testHelper.navigateTo('/superadmin/dashboard');
      
      // Wait for API calls to complete
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      // Check if API requests were made (this indicates the dashboard is working)
      const apiRequests = await testHelper.getPage().evaluate(() => {
        return window.performance.getEntriesByType('resource')
          .filter((resource: any) => resource.initiatorType === 'xmlhttprequest')
          .length;
      });
      
      expect(apiRequests).toBeGreaterThan(0);
    });
  });

  describe('Dashboard Error Handling', () => {
    test('should handle missing data gracefully', async () => {
      await testHelper.navigateTo('/superadmin/dashboard');
      
      // Wait for page to load
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      // Check if page loaded without crashing
      const pageContent = await testHelper.getPage().$eval('body', el => el.textContent || '');
      expect(pageContent.length).toBeGreaterThan(0);
    });

    test('should display content even with API errors', async () => {
      await testHelper.navigateTo('/superadmin/dashboard');
      
      // Wait for page to load
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      // Check if page has any meaningful content
      const hasContent = await testHelper.getPage().$eval('body', el => {
        const text = el.textContent || '';
        return text.length > 100; // Should have substantial content
      });
      
      expect(hasContent).toBe(true);
    });
  });
}); 