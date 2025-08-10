import puppeteer, { Browser, Page } from 'puppeteer';

export interface TestConfig {
  baseUrl: string;
  timeout: number;
  headless: boolean;
  slowMo: number;
}

export const defaultConfig: TestConfig = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 30000,
  headless: process.env.HEADLESS !== 'false',
  slowMo: 100,
};

export class PuppeteerTestHelper {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private config: TestConfig;

  constructor(config: TestConfig = defaultConfig) {
    this.config = config;
  }

  async setup(): Promise<void> {
    try {
      this.browser = await puppeteer.launch({
        headless: this.config.headless,
        slowMo: this.config.slowMo,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ],
        ignoreDefaultArgs: ['--disable-extensions'],
      });
      this.page = await this.browser.newPage();
      await this.page.setViewport({ width: 1280, height: 720 });
      await this.page.setDefaultTimeout(this.config.timeout);
      
      // Enable console log capture
      this.page.on('console', msg => {
        console.log(`📱 Browser Console: ${msg.text()}`);
      });
      
      // Enable error capture
      this.page.on('pageerror', error => {
        console.error(`❌ Page Error: ${error.message}`);
      });
      
    } catch (error) {
      console.error('Failed to setup Puppeteer:', error);
      throw error;
    }
  }

  async teardown(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
      }
      if (this.browser) {
        await this.browser.close();
      }
    } catch (error) {
      console.error('Failed to teardown Puppeteer:', error);
    }
  }

  getPage(): Page {
    if (!this.page) {
      throw new Error('Page not initialized. Call setup() first.');
    }
    return this.page;
  }

  async navigateTo(path: string): Promise<void> {
    const url = `${this.config.baseUrl}${path}`;
    console.log(`🌐 Navigating to: ${url}`);
    await this.getPage().goto(url, { waitUntil: 'networkidle0' });
  }

  async login(email: string, password: string): Promise<void> {
    console.log(`🔐 Logging in with: ${email}`);
    await this.navigateTo('/superadmin/login');
    
    await this.getPage().waitForSelector('input[type="email"]');
    await this.getPage().type('input[type="email"]', email);
    await this.getPage().type('input[type="password"]', password);
    await this.getPage().click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await this.getPage().waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('✅ Login successful');
  }

  async waitForElement(selector: string, timeout?: number): Promise<void> {
    console.log(`⏳ Waiting for element: ${selector}`);
    await this.getPage().waitForSelector(selector, { timeout });
  }

  async clickElement(selector: string): Promise<void> {
    console.log(`🖱️ Clicking element: ${selector}`);
    await this.getPage().click(selector);
  }

  async typeText(selector: string, text: string): Promise<void> {
    console.log(`⌨️ Typing text in: ${selector}`);
    await this.getPage().type(selector, text);
  }

  async getText(selector: string): Promise<string> {
    return await this.getPage().$eval(selector, el => el.textContent || '');
  }

  async isElementVisible(selector: string): Promise<boolean> {
    try {
      await this.getPage().waitForSelector(selector, { visible: true, timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async takeScreenshot(name: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `./test-screenshots/${name}-${timestamp}.png`;
    console.log(`📸 Taking screenshot: ${filename}`);
    await this.getPage().screenshot({ 
      path: filename,
      fullPage: true 
    });
  }

  async waitForNavigation(): Promise<void> {
    await this.getPage().waitForNavigation({ waitUntil: 'networkidle0' });
  }

  async getCurrentUrl(): Promise<string> {
    return this.getPage().url();
  }

  async expectUrlToContain(expectedPath: string): Promise<void> {
    const currentUrl = await this.getCurrentUrl();
    if (!currentUrl.includes(expectedPath)) {
      throw new Error(`Expected URL to contain "${expectedPath}", but got "${currentUrl}"`);
    }
  }

  async expectElementToExist(selector: string): Promise<void> {
    const exists = await this.getPage().$(selector);
    if (!exists) {
      throw new Error(`Element with selector "${selector}" not found`);
    }
  }

  async expectElementToHaveText(selector: string, expectedText: string): Promise<void> {
    const actualText = await this.getText(selector);
    if (!actualText.includes(expectedText)) {
      throw new Error(`Expected element "${selector}" to contain "${expectedText}", but got "${actualText}"`);
    }
  }
}

// Common test data
export const testData = {
  superAdmin: {
    email: 'admin@superadmin.com',
    password: 'SuperAdmin123!',
  },
  testTenant: {
    name: 'Test Tenant',
    email: 'test@tenant.com',
    subdomain: 'test-tenant',
  },
  testUser: {
    name: 'Test User',
    email: 'testuser@example.com',
    password: 'Password123!',
  },
};

// Common selectors
export const selectors = {
  // Sidebar
  sidebar: 'aside',
  sidebarToggle: '[data-testid="sidebar-toggle"]',
  sidebarLogo: 'img[alt="SuperAdmin Logo"]',
  
  // Navigation
  menuItem: '.menu-item',
  menuItemActive: '.menu-item-active',
  submenuItem: '.menu-dropdown-item',
  
  // Forms
  form: 'form',
  input: 'input',
  button: 'button',
  submitButton: 'button[type="submit"]',
  
  // Tables
  table: 'table',
  tableRow: 'tr',
  tableHeader: 'th',
  tableCell: 'td',
  
  // Modals
  modal: '[role="dialog"]',
  modalClose: '[data-testid="modal-close"]',
  
  // Loading states
  loadingSpinner: '[data-testid="loading-spinner"]',
  skeleton: '[data-testid="skeleton"]',
  
  // Notifications
  toast: '[data-testid="toast"]',
  alert: '[role="alert"]',
  
  // Pagination
  pagination: '[data-testid="pagination"]',
  pageButton: '[data-testid="page-button"]',
  nextButton: '[data-testid="next-button"]',
  prevButton: '[data-testid="prev-button"]',
  
  // Search and filters
  searchInput: '[data-testid="search-input"]',
  filterDropdown: '[data-testid="filter-dropdown"]',
  
  // Actions
  actionButton: '[data-testid="action-button"]',
  deleteButton: '[data-testid="delete-button"]',
  editButton: '[data-testid="edit-button"]',
  viewButton: '[data-testid="view-button"]',
};

// Common test utilities
export const testUtils = {
  async waitForPageLoad(page: Page): Promise<void> {
    await page.waitForFunction(() => document.readyState === 'complete');
  },

  async waitForNetworkIdle(page: Page): Promise<void> {
    await page.waitForFunction(() => {
      return !window.performance.getEntriesByType('resource').some(
        (resource: any) => resource.initiatorType === 'xmlhttprequest' && !resource.responseEnd
      );
    });
  },

  async clearStorage(page: Page): Promise<void> {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  },

  async mockApiResponse(page: Page, url: string, response: any): Promise<void> {
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (request.url().includes(url)) {
        request.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(response),
        });
      } else {
        request.continue();
      }
    });
  },
}; 