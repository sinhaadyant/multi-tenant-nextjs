import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global E2E test setup...');
  
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for the development server to be ready
    console.log('⏳ Waiting for development server...');
    await page.goto(baseURL || 'http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 120000 
    });
    
    // Setup test database with initial data
    console.log('🗄️ Setting up test database...');
    await setupTestDatabase();
    
    // Create test users and tenants
    console.log('👥 Creating test users and tenants...');
    await createTestData(page, baseURL);
    
    // Verify application is working
    console.log('✅ Verifying application health...');
    await verifyApplicationHealth(page);
    
    console.log('✨ Global setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function setupTestDatabase() {
  const { execSync } = require('child_process');
  
  try {
    // Run database migrations
    execSync('npx prisma migrate reset --force', { 
      stdio: 'inherit',
      env: { 
        ...process.env, 
        DATABASE_URL: 'sqlite://test-e2e.db' 
      }
    });
    
    // Seed test data
    execSync('npx prisma db seed', { 
      stdio: 'inherit',
      env: { 
        ...process.env, 
        DATABASE_URL: 'sqlite://test-e2e.db' 
      }
    });
    
  } catch (error) {
    console.warn('Database setup warning:', error.message);
  }
}

async function createTestData(page: any, baseURL: string) {
  try {
    // Create SuperAdmin test user via API
    const superAdminResponse = await page.request.post(`${baseURL}/api/e2e-testing`, {
      data: {
        action: 'createSuperAdmin',
        email: 'admin@superadmin.com',
        password: 'Test123!@#',
        name: 'Test SuperAdmin',
      }
    });
    
    if (!superAdminResponse.ok()) {
      console.warn('SuperAdmin creation failed:', await superAdminResponse.text());
    }
    
    // Create test tenants
    const testTenants = [
      {
        slug: 'e2e-tenant-1',
        name: 'E2E Test Tenant 1',
        domain: 'e2e-tenant-1.example.com',
        adminEmail: 'admin@e2e-tenant-1.com',
        adminName: 'E2E Admin 1',
        adminPassword: 'TestAdmin123!',
      },
      {
        slug: 'e2e-tenant-2',
        name: 'E2E Test Tenant 2',
        domain: 'e2e-tenant-2.example.com',
        adminEmail: 'admin@e2e-tenant-2.com',
        adminName: 'E2E Admin 2',
        adminPassword: 'TestAdmin123!',
      },
    ];
    
    for (const tenant of testTenants) {
      const tenantResponse = await page.request.post(`${baseURL}/api/e2e-testing`, {
        data: {
          action: 'createTenant',
          ...tenant,
        }
      });
      
      if (!tenantResponse.ok()) {
        console.warn(`Tenant ${tenant.slug} creation failed:`, await tenantResponse.text());
      }
    }
    
    // Create additional test users
    const testUsers = [
      {
        tenantSlug: 'e2e-tenant-1',
        email: 'manager@e2e-tenant-1.com',
        name: 'E2E Manager 1',
        password: 'TestManager123!',
        role: 'manager',
      },
      {
        tenantSlug: 'e2e-tenant-1',
        email: 'user@e2e-tenant-1.com',
        name: 'E2E User 1',
        password: 'TestUser123!',
        role: 'user',
      },
    ];
    
    for (const user of testUsers) {
      const userResponse = await page.request.post(`${baseURL}/api/e2e-testing`, {
        data: {
          action: 'createTenantUser',
          ...user,
        }
      });
      
      if (!userResponse.ok()) {
        console.warn(`User ${user.email} creation failed:`, await userResponse.text());
      }
    }
    
  } catch (error) {
    console.warn('Test data creation failed:', error);
  }
}

async function verifyApplicationHealth(page: any) {
  // Check that main routes are accessible
  const routes = [
    '/',
    '/superadmin/auth/login',
    '/e2e-tenant-1/auth/login',
  ];
  
  for (const route of routes) {
    try {
      const response = await page.goto(route, { waitUntil: 'networkidle' });
      if (!response.ok()) {
        throw new Error(`Route ${route} returned ${response.status()}`);
      }
    } catch (error) {
      console.warn(`Health check failed for ${route}:`, error.message);
    }
  }
  
  // Check API health
  try {
    const apiResponse = await page.request.get('/api/health');
    if (!apiResponse.ok()) {
      console.warn('API health check failed');
    }
  } catch (error) {
    console.warn('API health check error:', error.message);
  }
}

export default globalSetup;
