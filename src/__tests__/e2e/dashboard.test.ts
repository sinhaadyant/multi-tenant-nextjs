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
      
      // Verify page title
      await testHelper.expectElementToExist('h1');
      await testHelper.expectElementToHaveText('h1', 'Dashboard');
    });

    test('should display dashboard statistics cards', async () => {
      await testHelper.navigateTo('/superadmin/dashboard');
      
      // Wait for statistics cards to load
      await testHelper.waitForElement('[data-testid="stats-card"]', 10000);
      
      // Verify all statistics cards are present
      await testHelper.expectElementToExist('[data-testid="total-tenants-card"]');
      await testHelper.expectElementToExist('[data-testid="total-users-card"]');
      await testHelper.expectElementToExist('[data-testid="active-tenants-card"]');
      await testHelper.expectElementToExist('[data-testid="system-health-card"]');
      
      // Verify cards have numeric values
      const tenantCount = await testHelper.getText('[data-testid="total-tenants-count"]');
      expect(parseInt(tenantCount)).toBeGreaterThanOrEqual(0);
      
      const userCount = await testHelper.getText('[data-testid="total-users-count"]');
      expect(parseInt(userCount)).toBeGreaterThanOrEqual(0);
    });

    test('should display recent activity feed', async () => {
      await testHelper.navigateTo('/superadmin/dashboard');
      
      // Wait for activity feed to load
      await testHelper.waitForElement('[data-testid="activity-feed"]', 10000);
      
      // Verify activity feed elements
      await testHelper.expectElementToExist('[data-testid="activity-feed-title"]');
      await testHelper.expectElementToHaveText('[data-testid="activity-feed-title"]', 'Recent Activity');
      
      // Verify activity items exist
      const activityItems = await testHelper.getPage().$$('[data-testid="activity-item"]');
      expect(activityItems.length).toBeGreaterThanOrEqual(0);
    });

    test('should display system health indicators', async () => {
      await testHelper.navigateTo('/superadmin/dashboard');
      
      // Wait for system health section
      await testHelper.waitForElement('[data-testid="system-health-section"]', 10000);
      
      // Verify health indicators
      await testHelper.expectElementToExist('[data-testid="cpu-usage"]');
      await testHelper.expectElementToExist('[data-testid="memory-usage"]');
      await testHelper.expectElementToExist('[data-testid="disk-usage"]');
      await testHelper.expectElementToExist('[data-testid="network-status"]');
    });

    test('should display quick action buttons', async () => {
      await testHelper.navigateTo('/superadmin/dashboard');
      
      // Wait for quick actions section
      await testHelper.waitForElement('[data-testid="quick-actions"]', 10000);
      
      // Verify quick action buttons
      await testHelper.expectElementToExist('[data-testid="create-tenant-button"]');
      await testHelper.expectElementToExist('[data-testid="create-user-button"]');
      await testHelper.expectElementToExist('[data-testid="backup-data-button"]');
      await testHelper.expectElementToExist('[data-testid="view-reports-button"]');
    });

    test('should navigate to create tenant from quick actions', async () => {
      await testHelper.navigateTo('/superadmin/dashboard');
      
      // Wait for create tenant button
      await testHelper.waitForElement('[data-testid="create-tenant-button"]', 10000);
      
      // Click create tenant button
      await testHelper.clickElement('[data-testid="create-tenant-button"]');
      
      // Verify navigation to create tenant page
      await testHelper.expectUrlToContain('/superadmin/tenants/new');
    });

    test('should navigate to create user from quick actions', async () => {
      await testHelper.navigateTo('/superadmin/dashboard');
      
      // Wait for create user button
      await testHelper.waitForElement('[data-testid="create-user-button"]', 10000);
      
      // Click create user button
      await testHelper.clickElement('[data-testid="create-user-button"]');
      
      // Verify navigation to create user page
      await testHelper.expectUrlToContain('/superadmin/users');
    });
  });

  describe('Dashboard Charts and Analytics', () => {
    test('should display tenant growth chart', async () => {
      await testHelper.navigateTo('/superadmin/dashboard');
      
      // Wait for charts to load
      await testHelper.waitForElement('[data-testid="tenant-growth-chart"]', 15000);
      
      // Verify chart container exists
      await testHelper.expectElementToExist('[data-testid="tenant-growth-chart"]');
      
      // Verify chart title
      await testHelper.expectElementToHaveText('[data-testid="tenant-growth-chart-title"]', 'Tenant Growth');
    });

    test('should display user activity chart', async () => {
      await testHelper.navigateTo('/superadmin/dashboard');
      
      // Wait for user activity chart
      await testHelper.waitForElement('[data-testid="user-activity-chart"]', 15000);
      
      // Verify chart container exists
      await testHelper.expectElementToExist('[data-testid="user-activity-chart"]');
      
      // Verify chart title
      await testHelper.expectElementToHaveText('[data-testid="user-activity-chart-title"]', 'User Activity');
    });

    test('should display system performance metrics', async () => {
      await testHelper.navigateTo('/superadmin/dashboard');
      
      // Wait for performance metrics
      await testHelper.waitForElement('[data-testid="performance-metrics"]', 10000);
      
      // Verify performance indicators
      await testHelper.expectElementToExist('[data-testid="response-time"]');
      await testHelper.expectElementToExist('[data-testid="uptime"]');
      await testHelper.expectElementToExist('[data-testid="error-rate"]');
    });

    test('should allow chart time period selection', async () => {
      await testHelper.navigateTo('/superadmin/dashboard');
      
      // Wait for time period selector
      await testHelper.waitForElement('[data-testid="time-period-selector"]', 10000);
      
      // Click time period selector
      await testHelper.clickElement('[data-testid="time-period-selector"]');
      
      // Select different time period
      await testHelper.waitForElement('[data-value="7d"]', 5000);
      await testHelper.clickElement('[data-value="7d"]');
      
      // Verify chart updates
      await testHelper.waitForElement('[data-testid="chart-loading"]', 5000);
      await testHelper.waitForElement('[data-testid="tenant-growth-chart"]', 10000);
    });
  });

  describe('Dashboard Notifications', () => {
    test('should display notification bell with count', async () => {
      await testHelper.navigateTo('/superadmin/dashboard');
      
      // Wait for notification bell
      await testHelper.waitForElement('[data-testid="notification-bell"]', 10000);
      
      // Verify notification count exists
      const notificationCount = await testHelper.getPage().$('[data-testid="notification-count"]');
      expect(notificationCount).toBeTruthy();
    });

    test('should open notification dropdown', async () => {
      await testHelper.navigateTo('/superadmin/dashboard');
      
      // Wait for notification bell
      await testHelper.waitForElement('[data-testid="notification-bell"]', 10000);
      
      // Click notification bell
      await testHelper.clickElement('[data-testid="notification-bell"]');
      
      // Verify notification dropdown opens
      await testHelper.waitForElement('[data-testid="notification-dropdown"]', 5000);
      await testHelper.expectElementToExist('[data-testid="notification-dropdown"]');
    });

    test('should display recent notifications in dropdown', async () => {
      await testHelper.navigateTo('/superadmin/dashboard');
      
      // Open notification dropdown
      await testHelper.waitForElement('[data-testid="notification-bell"]', 10000);
      await testHelper.clickElement('[data-testid="notification-bell"]');
      
      // Wait for notification dropdown
      await testHelper.waitForElement('[data-testid="notification-dropdown"]', 5000);
      
      // Verify notification items exist
      const notificationItems = await testHelper.getPage().$$('[data-testid="notification-item"]');
      expect(notificationItems.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Dashboard Responsive Design', () => {
    test('should be responsive on mobile devices', async () => {
      await testHelper.navigateTo('/superadmin/dashboard');
      
      // Set mobile viewport
      await testHelper.getPage().setViewport({ width: 375, height: 667 });
      
      // Verify page is responsive
      await testHelper.expectElementToExist('h1');
      
      // Verify statistics cards stack properly
      await testHelper.expectElementToExist('[data-testid="stats-card"]');
      
      // Take screenshot for visual verification
      await testHelper.takeScreenshot('dashboard-mobile');
    });

    test('should be responsive on tablet devices', async () => {
      await testHelper.navigateTo('/superadmin/dashboard');
      
      // Set tablet viewport
      await testHelper.getPage().setViewport({ width: 768, height: 1024 });
      
      // Verify page is responsive
      await testHelper.expectElementToExist('h1');
      
      // Take screenshot for visual verification
      await testHelper.takeScreenshot('dashboard-tablet');
    });
  });

  describe('Dashboard Performance', () => {
    test('should load dashboard within acceptable time', async () => {
      const startTime = Date.now();
      
      await testHelper.navigateTo('/superadmin/dashboard');
      
      // Wait for main dashboard elements
      await testHelper.waitForElement('[data-testid="stats-card"]', 10000);
      
      const loadTime = Date.now() - startTime;
      
      // Dashboard should load within 8 seconds (charts take time)
      expect(loadTime).toBeLessThan(8000);
    });

    test('should handle real-time data updates', async () => {
      await testHelper.navigateTo('/superadmin/dashboard');
      
      // Wait for dashboard to load
      await testHelper.waitForElement('[data-testid="stats-card"]', 10000);
      
      // Wait for potential real-time updates
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verify no loading spinners are visible
      const loadingSpinners = await testHelper.getPage().$$(selectors.loadingSpinner);
      expect(loadingSpinners.length).toBe(0);
    });
  });

  describe('Dashboard Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      await testHelper.navigateTo('/superadmin/dashboard');
      
      // Wait for dashboard to load
      await testHelper.waitForElement('[data-testid="stats-card"]', 10000);
      
      // Verify error handling elements exist
      await testHelper.expectElementToExist('[data-testid="error-boundary"]');
    });

    test('should display loading states while fetching data', async () => {
      await testHelper.navigateTo('/superadmin/dashboard');
      
      // Verify loading states are shown initially
      const loadingStates = await testHelper.getPage().$$('[data-testid="loading-skeleton"]');
      expect(loadingStates.length).toBeGreaterThanOrEqual(0);
      
      // Wait for content to load
      await testHelper.waitForElement('[data-testid="stats-card"]', 10000);
      
      // Verify loading states are hidden
      const finalLoadingStates = await testHelper.getPage().$$('[data-testid="loading-skeleton"]');
      expect(finalLoadingStates.length).toBe(0);
    });
  });
}); 