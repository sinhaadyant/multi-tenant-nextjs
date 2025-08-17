import { Page, expect } from "@playwright/test";

export class BackendE2ETestUtils {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  generateRandomEmail(): string {
    return `test-${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}@example.com`;
  }

  generateRandomString(length: number = 10): string {
    return Math.random()
      .toString(36)
      .substring(2, length + 2);
  }

  generateRandomPassword(): string {
    return `TestPassword${Date.now()}!`;
  }

  generateRandomName(): string {
    return `Test User ${Date.now()}`;
  }

  generateRandomTenantName(): string {
    return `Test Tenant ${Date.now()}`;
  }

  generateRandomDomain(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substring(7)}.example.com`;
  }

  generateRandomSlug(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  generateValidUserData(overrides: any = {}): any {
    return {
      name: this.generateRandomName(),
      email: this.generateRandomEmail(),
      password: this.generateRandomPassword(),
      role: "Tenant User",
      ...overrides,
    };
  }

  generateValidTenantData(overrides: any = {}): any {
    return {
      name: this.generateRandomTenantName(),
      domain: this.generateRandomDomain(),
      slug: this.generateRandomSlug(),
      loginRestrictions: {
        allowedDomains: [this.generateRandomDomain()],
        maxUsers: 50,
      },
      status: "active",
      ...overrides,
    };
  }

  generateInvalidUserData(type: string): any {
    switch (type) {
      case "emptyName":
        return { name: "", email: this.generateRandomEmail(), password: this.generateRandomPassword() };
      case "emptyEmail":
        return { name: this.generateRandomName(), email: "", password: this.generateRandomPassword() };
      case "emptyPassword":
        return { name: this.generateRandomName(), email: this.generateRandomEmail(), password: "" };
      case "invalidEmail":
        return { name: this.generateRandomName(), email: "invalid-email", password: this.generateRandomPassword() };
      case "weakPassword":
        return { name: this.generateRandomName(), email: this.generateRandomEmail(), password: "weak" };
      case "longName":
        return { name: "a".repeat(1000), email: this.generateRandomEmail(), password: this.generateRandomPassword() };
      case "longEmail":
        return { name: this.generateRandomName(), email: "a".repeat(100) + "@example.com", password: this.generateRandomPassword() };
      default:
        return this.generateValidUserData();
    }
  }

  generateInvalidTenantData(type: string): any {
    switch (type) {
      case "emptyName":
        return { name: "", domain: this.generateRandomDomain(), slug: this.generateRandomSlug() };
      case "emptyDomain":
        return { name: this.generateRandomTenantName(), domain: "", slug: this.generateRandomSlug() };
      case "emptySlug":
        return { name: this.generateRandomTenantName(), domain: this.generateRandomDomain(), slug: "" };
      case "invalidDomain":
        return { name: this.generateRandomTenantName(), domain: "invalid-domain", slug: this.generateRandomSlug() };
      case "invalidSlug":
        return { name: this.generateRandomTenantName(), domain: this.generateRandomDomain(), slug: "invalid slug with spaces" };
      case "longName":
        return { name: "a".repeat(1000), domain: this.generateRandomDomain(), slug: this.generateRandomSlug() };
      default:
        return this.generateValidTenantData();
    }
  }

  generateSQLInjectionAttempts(): string[] {
    return [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "'; INSERT INTO users VALUES ('hacker', 'password'); --",
      "' UNION SELECT * FROM users --",
      "'; UPDATE users SET password='hacked' --",
    ];
  }

  generateXSSAttempts(): string[] {
    return [
      "<script>alert('xss')</script>",
      "javascript:alert('xss')",
      "<img src=x onerror=alert('xss')>",
      "';alert('xss');//",
      "<svg onload=alert('xss')>",
    ];
  }

  generateRateLimitTestData(): any[] {
    const attempts = [];
    for (let i = 0; i < 20; i++) {
      attempts.push({
        email: `test${i}@example.com`,
        password: "TestPassword123!",
      });
    }
    return attempts;
  }

  generateBulkUserData(count: number = 10): any[] {
    const users = [];
    for (let i = 0; i < count; i++) {
      users.push(this.generateValidUserData({
        name: `Bulk User ${i + 1}`,
        email: `bulk-user-${i + 1}@example.com`,
      }));
    }
    return users;
  }

  generateBulkTenantData(count: number = 5): any[] {
    const tenants = [];
    for (let i = 0; i < count; i++) {
      tenants.push(this.generateValidTenantData({
        name: `Bulk Tenant ${i + 1}`,
        domain: `bulk-tenant-${i + 1}.example.com`,
        slug: `bulk-tenant-${i + 1}`,
      }));
    }
    return tenants;
  }

  generateSearchTestData(): any[] {
    return [
      { name: "John Doe", email: "john.doe@example.com" },
      { name: "Jane Smith", email: "jane.smith@example.com" },
      { name: "Bob Johnson", email: "bob.johnson@example.com" },
      { name: "Alice Brown", email: "alice.brown@example.com" },
      { name: "Charlie Wilson", email: "charlie.wilson@example.com" },
    ];
  }

  generateFilterTestData(): any[] {
    return [
      { name: "Active User 1", email: "active1@example.com", status: "active", role: "Tenant User" },
      { name: "Active User 2", email: "active2@example.com", status: "active", role: "Tenant Admin" },
      { name: "Inactive User 1", email: "inactive1@example.com", status: "inactive", role: "Tenant User" },
      { name: "Inactive User 2", email: "inactive2@example.com", status: "inactive", role: "Tenant Admin" },
      { name: "Suspended User", email: "suspended@example.com", status: "suspended", role: "Tenant User" },
    ];
  }

  generatePaginationTestData(count: number = 100): any[] {
    const data = [];
    for (let i = 0; i < count; i++) {
      data.push({
        name: `Pagination User ${i + 1}`,
        email: `pagination-user-${i + 1}@example.com`,
        role: i % 2 === 0 ? "Tenant User" : "Tenant Admin",
        status: i % 3 === 0 ? "active" : i % 3 === 1 ? "inactive" : "suspended",
      });
    }
    return data;
  }

  generateExportTestData(): any[] {
    return [
      { name: "Export User 1", email: "export1@example.com", role: "Tenant User", status: "active" },
      { name: "Export User 2", email: "export2@example.com", role: "Tenant Admin", status: "active" },
      { name: "Export User 3", email: "export3@example.com", role: "Tenant User", status: "inactive" },
      { name: "Export User 4", email: "export4@example.com", role: "Tenant Admin", status: "suspended" },
      { name: "Export User 5", email: "export5@example.com", role: "Tenant User", status: "active" },
    ];
  }

  generateAuditLogData(): any[] {
    return [
      { action: "CREATE", resource: "User", details: "Created new user" },
      { action: "UPDATE", resource: "User", details: "Updated user profile" },
      { action: "DELETE", resource: "User", details: "Deleted user account" },
      { action: "LOGIN", resource: "Auth", details: "User logged in" },
      { action: "LOGOUT", resource: "Auth", details: "User logged out" },
    ];
  }

  generateNotificationData(): any[] {
    return [
      { type: "success", message: "User created successfully" },
      { type: "error", message: "Failed to create user" },
      { type: "warning", message: "User account is about to expire" },
      { type: "info", message: "System maintenance scheduled" },
    ];
  }

  generateFileUploadData(): any[] {
    return [
      { filename: "test-document.pdf", size: 1024 * 1024, type: "application/pdf" },
      { filename: "test-image.jpg", size: 512 * 1024, type: "image/jpeg" },
      { filename: "test-spreadsheet.xlsx", size: 2048 * 1024, type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
      { filename: "test-text.txt", size: 100, type: "text/plain" },
    ];
  }

  generateInvalidFileData(): any[] {
    return [
      { filename: "test-virus.exe", size: 1024, type: "application/x-executable" },
      { filename: "test-large-file.zip", size: 100 * 1024 * 1024, type: "application/zip" },
      { filename: "", size: 0, type: "text/plain" },
      { filename: "test-file.txt", size: -1, type: "text/plain" },
    ];
  }

  generatePerformanceTestData(count: number = 1000): any[] {
    const data = [];
    for (let i = 0; i < count; i++) {
      data.push({
        name: `Performance User ${i + 1}`,
        email: `performance-user-${i + 1}@example.com`,
        role: "Tenant User",
        status: "active",
        metadata: {
          lastLogin: new Date().toISOString(),
          loginCount: Math.floor(Math.random() * 100),
          preferences: {
            theme: i % 2 === 0 ? "light" : "dark",
            language: i % 3 === 0 ? "en" : i % 3 === 1 ? "es" : "fr",
          },
        },
      });
    }
    return data;
  }

  generateConcurrentTestData(count: number = 10): any[] {
    const data = [];
    for (let i = 0; i < count; i++) {
      data.push({
        name: `Concurrent User ${i + 1}`,
        email: `concurrent-user-${i + 1}@example.com`,
        password: this.generateRandomPassword(),
        role: "Tenant User",
      });
    }
    return data;
  }

  generateStressTestData(count: number = 100): any[] {
    const data = [];
    for (let i = 0; i < count; i++) {
      data.push({
        name: `Stress User ${i + 1}`,
        email: `stress-user-${i + 1}@example.com`,
        password: this.generateRandomPassword(),
        role: "Tenant User",
        metadata: {
          largeField: "a".repeat(10000), // Large field to test memory usage
          nestedObject: {
            level1: {
              level2: {
                level3: {
                  level4: {
                    level5: "deep nested value",
                  },
                },
              },
            },
          },
        },
      });
    }
    return data;
  }

  generateEdgeCaseData(): any[] {
    return [
      { name: "User with special chars: !@#$%^&*()", email: "special@example.com" },
      { name: "User with unicode: 用户测试", email: "unicode@example.com" },
      { name: "User with emoji: 👨‍💻", email: "emoji@example.com" },
      { name: "User with very long name: " + "a".repeat(500), email: "longname@example.com" },
      { name: "User with numbers: 12345", email: "numbers@example.com" },
    ];
  }

  generateBoundaryTestData(): any[] {
    return [
      { name: "a", email: "a@b.c" }, // Minimum valid values
      { name: "a".repeat(255), email: "a".repeat(64) + "@" + "b".repeat(63) + ".com" }, // Maximum valid values
      { name: "", email: "" }, // Empty values
      { name: "a".repeat(256), email: "a".repeat(65) + "@" + "b".repeat(64) + ".com" }, // Exceeds maximum
      { name: "a".repeat(10000), email: "a".repeat(1000) + "@example.com" }, // Very large values
    ];
  }
}
