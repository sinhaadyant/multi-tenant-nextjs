import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    extraHTTPHeaders: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "api-tests",
      testMatch: /api\/.*\.spec\.ts/,
      use: {
        baseURL: "http://localhost:3001",
      },
    },
    {
      name: "e2e-tests",
      testMatch: /e2e\/.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3000",
      },
    },
    {
      name: "e2e-mobile",
      testMatch: /e2e\/.*\.spec\.ts/,
      use: {
        ...devices["iPhone 12"],
        baseURL: "http://localhost:3000",
      },
    },
  ],
  webServer: [
    {
      command: "cd ../server && npm run dev",
      url: "http://localhost:3001/api/health",
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: "cd ../client && npm run dev",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
});
