import { APIRequestContext } from "@playwright/test";

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export class TestUtils {
  private request: APIRequestContext;
  private baseURL: string;

  constructor(
    request: APIRequestContext,
    baseURL: string = "http://localhost:3001"
  ) {
    this.request = request;
    this.baseURL = baseURL;
  }

  async makeRequest<T = any>(
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    endpoint: string,
    options: {
      data?: any;
      headers?: Record<string, string>;
      params?: Record<string, string>;
    } = {}
  ): Promise<{ response: any; data: ApiResponse<T> }> {
    const url = new URL(`${this.baseURL}${endpoint}`);

    // Add query parameters
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await this.request[method.toLowerCase()](url.toString(), {
      data: options.data,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json();
    return { response, data };
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

  validateResponseSchema(
    response: ApiResponse,
    expectedFields: string[]
  ): void {
    expect(response).toHaveProperty("success");
    expect(typeof response.success).toBe("boolean");
    expect(response).toHaveProperty("message");
    expect(typeof response.message).toBe("string");

    if (response.success && response.data) {
      expectedFields.forEach((field) => {
        expect(response.data).toHaveProperty(field);
      });
    }
  }

  validatePaginationSchema(response: ApiResponse): void {
    if (response.meta) {
      expect(response.meta).toHaveProperty("page");
      expect(response.meta).toHaveProperty("limit");
      expect(response.meta).toHaveProperty("total");
      expect(response.meta).toHaveProperty("totalPages");

      expect(typeof response.meta.page).toBe("number");
      expect(typeof response.meta.limit).toBe("number");
      expect(typeof response.meta.total).toBe("number");
      expect(typeof response.meta.totalPages).toBe("number");
    }
  }

  validateErrorResponse(
    response: ApiResponse,
    expectedStatus: number,
    expectedMessage?: string
  ): void {
    expect(response.success).toBe(false);
    expect(response).toHaveProperty("message");

    if (expectedMessage) {
      expect(response.message).toContain(expectedMessage);
    }
  }

  async waitForCondition(
    condition: () => Promise<boolean>,
    timeout: number = 10000,
    interval: number = 1000
  ): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error(`Condition not met within ${timeout}ms`);
  }
}
