import { test, expect } from "@playwright/test";
import { TestUtils } from "../helpers/test-utils";

test.describe("Health Check Endpoints", () => {
  let testUtils: TestUtils;

  test.beforeEach(async ({ request }) => {
    testUtils = new TestUtils(request);
  });

  test.describe("GET /api/health", () => {
    test("should return basic health status", async ({ request }) => {
      const { response, data } = await testUtils.makeRequest(
        "GET",
        "/api/health"
      );

      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("Service is healthy");
      expect(data.data).toHaveProperty("status");
      expect(data.data).toHaveProperty("timestamp");
      expect(data.data).toHaveProperty("uptime");
      expect(data.data).toHaveProperty("version");
      expect(data.data).toHaveProperty("environment");

      // Validate data types
      expect(data.data.status).toBe("healthy");
      expect(typeof data.data.timestamp).toBe("string");
      expect(typeof data.data.uptime).toBe("number");
      expect(typeof data.data.version).toBe("string");
      expect(typeof data.data.environment).toBe("string");
    });

    test("should include service information", async ({ request }) => {
      const { response, data } = await testUtils.makeRequest(
        "GET",
        "/api/health"
      );

      expect(response.status()).toBe(200);
      expect(data.data).toHaveProperty("service");
      expect(data.data.service).toHaveProperty("name");
      expect(data.data.service).toHaveProperty("description");
      expect(data.data.service.name).toBe("Multi-Tenant Admin API");
    });

    test("should include memory usage information", async ({ request }) => {
      const { response, data } = await testUtils.makeRequest(
        "GET",
        "/api/health"
      );

      expect(response.status()).toBe(200);
      expect(data.data).toHaveProperty("memory");
      expect(data.data.memory).toHaveProperty("used");
      expect(data.data.memory).toHaveProperty("total");
      expect(data.data.memory).toHaveProperty("free");
      expect(data.data.memory).toHaveProperty("percentage");

      // Validate memory values
      expect(typeof data.data.memory.used).toBe("number");
      expect(typeof data.data.memory.total).toBe("number");
      expect(typeof data.data.memory.free).toBe("number");
      expect(typeof data.data.memory.percentage).toBe("number");
      expect(data.data.memory.percentage).toBeGreaterThanOrEqual(0);
      expect(data.data.memory.percentage).toBeLessThanOrEqual(100);
    });

    test("should include CPU usage information", async ({ request }) => {
      const { response, data } = await testUtils.makeRequest(
        "GET",
        "/api/health"
      );

      expect(response.status()).toBe(200);
      expect(data.data).toHaveProperty("cpu");
      expect(data.data.cpu).toHaveProperty("usage");
      expect(data.data.cpu).toHaveProperty("loadAverage");

      // Validate CPU values
      expect(typeof data.data.cpu.usage).toBe("number");
      expect(typeof data.data.cpu.loadAverage).toBe("number");
      expect(data.data.cpu.usage).toBeGreaterThanOrEqual(0);
      expect(data.data.cpu.usage).toBeLessThanOrEqual(100);
    });
  });

  test.describe("GET /api/health/detailed", () => {
    test("should return detailed health status", async ({ request }) => {
      const { response, data } = await testUtils.makeRequest(
        "GET",
        "/api/health/detailed"
      );

      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("Detailed health check completed");
      expect(data.data).toHaveProperty("overall");
      expect(data.data).toHaveProperty("components");
      expect(data.data).toHaveProperty("timestamp");

      // Overall status should be healthy if all components are healthy
      expect(["healthy", "degraded", "unhealthy"]).toContain(data.data.overall);
    });

    test("should include database health check", async ({ request }) => {
      const { response, data } = await testUtils.makeRequest(
        "GET",
        "/api/health/detailed"
      );

      expect(response.status()).toBe(200);
      expect(data.data.components).toHaveProperty("database");
      expect(data.data.components.database).toHaveProperty("status");
      expect(data.data.components.database).toHaveProperty("responseTime");
      expect(data.data.components.database).toHaveProperty("lastChecked");

      // Database should be healthy
      expect(data.data.components.database.status).toBe("healthy");
      expect(typeof data.data.components.database.responseTime).toBe("number");
      expect(data.data.components.database.responseTime).toBeGreaterThan(0);
    });

    test("should include Redis health check", async ({ request }) => {
      const { response, data } = await testUtils.makeRequest(
        "GET",
        "/api/health/detailed"
      );

      expect(response.status()).toBe(200);
      expect(data.data.components).toHaveProperty("redis");
      expect(data.data.components.redis).toHaveProperty("status");
      expect(data.data.components.redis).toHaveProperty("responseTime");
      expect(data.data.components.redis).toHaveProperty("lastChecked");

      // Redis should be healthy
      expect(data.data.components.redis.status).toBe("healthy");
      expect(typeof data.data.components.redis.responseTime).toBe("number");
      expect(data.data.components.redis.responseTime).toBeGreaterThan(0);
    });

    test("should include file system health check", async ({ request }) => {
      const { response, data } = await testUtils.makeRequest(
        "GET",
        "/api/health/detailed"
      );

      expect(response.status()).toBe(200);
      expect(data.data.components).toHaveProperty("filesystem");
      expect(data.data.components.filesystem).toHaveProperty("status");
      expect(data.data.components.filesystem).toHaveProperty("diskUsage");
      expect(data.data.components.filesystem).toHaveProperty("lastChecked");

      // File system should be healthy
      expect(data.data.components.filesystem.status).toBe("healthy");
      expect(data.data.components.filesystem.diskUsage).toHaveProperty("used");
      expect(data.data.components.filesystem.diskUsage).toHaveProperty("total");
      expect(data.data.components.filesystem.diskUsage).toHaveProperty("free");
    });

    test("should include external services health check", async ({
      request,
    }) => {
      const { response, data } = await testUtils.makeRequest(
        "GET",
        "/api/health/detailed"
      );

      expect(response.status()).toBe(200);
      expect(data.data.components).toHaveProperty("externalServices");
      expect(data.data.components.externalServices).toHaveProperty("status");
      expect(data.data.components.externalServices).toHaveProperty("services");
      expect(
        Array.isArray(data.data.components.externalServices.services)
      ).toBe(true);
    });
  });

  test.describe("GET /api/health/database", () => {
    test("should return database health status", async ({ request }) => {
      const { response, data } = await testUtils.makeRequest(
        "GET",
        "/api/health/database"
      );

      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("Database health check completed");
      expect(data.data).toHaveProperty("status");
      expect(data.data).toHaveProperty("responseTime");
      expect(data.data).toHaveProperty("connectionPool");
      expect(data.data).toHaveProperty("lastChecked");

      // Database should be healthy
      expect(data.data.status).toBe("healthy");
      expect(typeof data.data.responseTime).toBe("number");
      expect(data.data.responseTime).toBeGreaterThan(0);
    });

    test("should include connection pool information", async ({ request }) => {
      const { response, data } = await testUtils.makeRequest(
        "GET",
        "/api/health/database"
      );

      expect(response.status()).toBe(200);
      expect(data.data.connectionPool).toHaveProperty("total");
      expect(data.data.connectionPool).toHaveProperty("idle");
      expect(data.data.connectionPool).toHaveProperty("active");
      expect(data.data.connectionPool).toHaveProperty("waiting");

      // Validate connection pool values
      expect(typeof data.data.connectionPool.total).toBe("number");
      expect(typeof data.data.connectionPool.idle).toBe("number");
      expect(typeof data.data.connectionPool.active).toBe("number");
      expect(typeof data.data.connectionPool.waiting).toBe("number");
      expect(data.data.connectionPool.total).toBeGreaterThan(0);
      expect(data.data.connectionPool.idle).toBeGreaterThanOrEqual(0);
      expect(data.data.connectionPool.active).toBeGreaterThanOrEqual(0);
      expect(data.data.connectionPool.waiting).toBeGreaterThanOrEqual(0);
    });

    test("should include database version information", async ({ request }) => {
      const { response, data } = await testUtils.makeRequest(
        "GET",
        "/api/health/database"
      );

      expect(response.status()).toBe(200);
      expect(data.data).toHaveProperty("version");
      expect(data.data).toHaveProperty("databaseType");

      // Validate database information
      expect(typeof data.data.version).toBe("string");
      expect(typeof data.data.databaseType).toBe("string");
      expect(data.data.databaseType).toBe("mysql");
    });
  });

  test.describe("GET /api/health/redis", () => {
    test("should return Redis health status", async ({ request }) => {
      const { response, data } = await testUtils.makeRequest(
        "GET",
        "/api/health/redis"
      );

      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("Redis health check completed");
      expect(data.data).toHaveProperty("status");
      expect(data.data).toHaveProperty("responseTime");
      expect(data.data).toHaveProperty("lastChecked");

      // Redis should be healthy
      expect(data.data.status).toBe("healthy");
      expect(typeof data.data.responseTime).toBe("number");
      expect(data.data.responseTime).toBeGreaterThan(0);
    });

    test("should include Redis memory information", async ({ request }) => {
      const { response, data } = await testUtils.makeRequest(
        "GET",
        "/api/health/redis"
      );

      expect(response.status()).toBe(200);
      expect(data.data).toHaveProperty("memory");
      expect(data.data.memory).toHaveProperty("used");
      expect(data.data.memory).toHaveProperty("peak");
      expect(data.data.memory).toHaveProperty("allocated");

      // Validate memory values
      expect(typeof data.data.memory.used).toBe("number");
      expect(typeof data.data.memory.peak).toBe("number");
      expect(typeof data.data.memory.allocated).toBe("number");
      expect(data.data.memory.used).toBeGreaterThan(0);
    });

    test("should include Redis connection information", async ({ request }) => {
      const { response, data } = await testUtils.makeRequest(
        "GET",
        "/api/health/redis"
      );

      expect(response.status()).toBe(200);
      expect(data.data).toHaveProperty("connections");
      expect(data.data.connections).toHaveProperty("connected");
      expect(data.data.connections).toHaveProperty("max");

      // Validate connection values
      expect(typeof data.data.connections.connected).toBe("number");
      expect(typeof data.data.connections.max).toBe("number");
      expect(data.data.connections.connected).toBeGreaterThan(0);
      expect(data.data.connections.max).toBeGreaterThan(0);
    });

    test("should include Redis version information", async ({ request }) => {
      const { response, data } = await testUtils.makeRequest(
        "GET",
        "/api/health/redis"
      );

      expect(response.status()).toBe(200);
      expect(data.data).toHaveProperty("version");
      expect(data.data).toHaveProperty("mode");

      // Validate version information
      expect(typeof data.data.version).toBe("string");
      expect(typeof data.data.mode).toBe("string");
    });
  });

  test.describe("GET /api/metrics", () => {
    test("should return system performance metrics", async ({ request }) => {
      const { response, data } = await testUtils.makeRequest(
        "GET",
        "/api/metrics"
      );

      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("Metrics retrieved successfully");
      expect(data.data).toHaveProperty("system");
      expect(data.data).toHaveProperty("application");
      expect(data.data).toHaveProperty("timestamp");
    });

    test("should include system metrics", async ({ request }) => {
      const { response, data } = await testUtils.makeRequest(
        "GET",
        "/api/metrics"
      );

      expect(response.status()).toBe(200);
      expect(data.data.system).toHaveProperty("cpu");
      expect(data.data.system).toHaveProperty("memory");
      expect(data.data.system).toHaveProperty("disk");
      expect(data.data.system).toHaveProperty("network");

      // Validate system metrics
      expect(typeof data.data.system.cpu.usage).toBe("number");
      expect(typeof data.data.system.memory.used).toBe("number");
      expect(typeof data.data.system.memory.total).toBe("number");
    });

    test("should include application metrics", async ({ request }) => {
      const { response, data } = await testUtils.makeRequest(
        "GET",
        "/api/metrics"
      );

      expect(response.status()).toBe(200);
      expect(data.data.application).toHaveProperty("requests");
      expect(data.data.application).toHaveProperty("errors");
      expect(data.data.application).toHaveProperty("responseTime");

      // Validate application metrics
      expect(data.data.application.requests).toHaveProperty("total");
      expect(data.data.application.requests).toHaveProperty("perSecond");
      expect(data.data.application.errors).toHaveProperty("total");
      expect(data.data.application.errors).toHaveProperty("rate");
      expect(data.data.application.responseTime).toHaveProperty("average");
      expect(data.data.application.responseTime).toHaveProperty("p95");
      expect(data.data.application.responseTime).toHaveProperty("p99");
    });

    test("should include uptime information", async ({ request }) => {
      const { response, data } = await testUtils.makeRequest(
        "GET",
        "/api/metrics"
      );

      expect(response.status()).toBe(200);
      expect(data.data).toHaveProperty("uptime");
      expect(data.data).toHaveProperty("startTime");

      // Validate uptime
      expect(typeof data.data.uptime).toBe("number");
      expect(typeof data.data.startTime).toBe("string");
      expect(data.data.uptime).toBeGreaterThan(0);
    });
  });

  test.describe("GET /api/status", () => {
    test("should return overall system status", async ({ request }) => {
      const { response, data } = await testUtils.makeRequest(
        "GET",
        "/api/status"
      );

      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain("System status retrieved");
      expect(data.data).toHaveProperty("status");
      expect(data.data).toHaveProperty("version");
      expect(data.data).toHaveProperty("environment");
      expect(data.data).toHaveProperty("timestamp");
      expect(data.data).toHaveProperty("services");

      // Overall status should be operational
      expect(data.data.status).toBe("operational");
    });

    test("should include service status information", async ({ request }) => {
      const { response, data } = await testUtils.makeRequest(
        "GET",
        "/api/status"
      );

      expect(response.status()).toBe(200);
      expect(Array.isArray(data.data.services)).toBe(true);

      // Each service should have status information
      data.data.services.forEach((service: any) => {
        expect(service).toHaveProperty("name");
        expect(service).toHaveProperty("status");
        expect(service).toHaveProperty("lastChecked");
        expect(["operational", "degraded", "down"]).toContain(service.status);
      });
    });

    test("should include incident information", async ({ request }) => {
      const { response, data } = await testUtils.makeRequest(
        "GET",
        "/api/status"
      );

      expect(response.status()).toBe(200);
      expect(data.data).toHaveProperty("incidents");
      expect(Array.isArray(data.data.incidents)).toBe(true);

      // Each incident should have proper structure
      data.data.incidents.forEach((incident: any) => {
        expect(incident).toHaveProperty("id");
        expect(incident).toHaveProperty("title");
        expect(incident).toHaveProperty("status");
        expect(incident).toHaveProperty("createdAt");
        expect(incident).toHaveProperty("updatedAt");
      });
    });
  });

  test.describe("Error Handling", () => {
    test("should handle database connection failures gracefully", async ({
      request,
    }) => {
      // This test would require simulating database connection issues
      // For now, we'll test the error response structure
      const { response, data } = await testUtils.makeRequest(
        "GET",
        "/api/health/database"
      );

      // Should either be healthy or return a proper error
      expect([200, 503]).toContain(response.status());

      if (response.status() === 503) {
        expect(data.success).toBe(false);
        expect(data.message).toContain("Database connection failed");
      }
    });

    test("should handle Redis connection failures gracefully", async ({
      request,
    }) => {
      // This test would require simulating Redis connection issues
      const { response, data } = await testUtils.makeRequest(
        "GET",
        "/api/health/redis"
      );

      // Should either be healthy or return a proper error
      expect([200, 503]).toContain(response.status());

      if (response.status() === 503) {
        expect(data.success).toBe(false);
        expect(data.message).toContain("Redis connection failed");
      }
    });

    test("should handle file system issues gracefully", async ({ request }) => {
      // This test would require simulating file system issues
      const { response, data } = await testUtils.makeRequest(
        "GET",
        "/api/health/detailed"
      );

      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);

      // Even if file system is unhealthy, overall should still return 200
      // but with degraded status
      if (data.data.overall === "degraded") {
        expect(data.data.components.filesystem.status).toBe("unhealthy");
      }
    });
  });
});
