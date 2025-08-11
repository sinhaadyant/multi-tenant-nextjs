// API-specific Jest setup

// Mock Next.js Request and Response
global.Request = class Request {
  constructor(url, options = {}) {
    this.url = url;
    this.method = options.method || 'GET';
    this.headers = new Map(Object.entries(options.headers || {}));
    this.body = options.body;
    this.json = jest.fn().mockResolvedValue(options.body ? JSON.parse(options.body) : {});
  }
}

global.Response = class Response {
  constructor(body, options = {}) {
    this.body = body;
    this.status = options.status || 200;
    this.headers = new Map(Object.entries(options.headers || {}));
    this.ok = this.status >= 200 && this.status < 300;
  }

  json() {
    return Promise.resolve(typeof this.body === 'string' ? JSON.parse(this.body) : this.body);
  }

  text() {
    return Promise.resolve(typeof this.body === 'string' ? this.body : JSON.stringify(this.body));
  }
}

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    return { ...props, type: 'img' }
  },
}))

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
}))

// Mock Prisma
jest.mock('./src/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
    role: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    auditLog: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    supportTicket: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    notification: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    tenant: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    permission: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    userRole: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      groupBy: jest.fn(),
    },
    rolePermission: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    supportTicketComment: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback()),
  },
}))

// Mock authentication middleware
jest.mock('./src/lib/authMiddleware', () => ({
  withTenantAuth: jest.fn((handler) => handler),
  AuthenticatedRequest: class AuthenticatedRequest {
    constructor() {
      this.user = {
        id: 'user-1',
        email: 'admin@techcorp.com',
        tenantId: 'tenant-1',
        roles: ['admin']
      };
      this.headers = new Map();
      this.url = 'http://localhost:3000/api/tenant/techcorp/users';
      this.json = jest.fn();
      this.nextUrl = new URL('http://localhost:3000/api/tenant/techcorp/users');
    }
  }
}))

// Mock API response utilities
jest.mock('./src/lib/apiResponse', () => ({
  createSuccessResponse: jest.fn((data) => new Response(JSON.stringify({ success: true, data }), { status: 200 })),
  createErrorResponse: jest.fn((message, status = 400) => new Response(JSON.stringify({ success: false, error: message }), { status })),
}))

// Mock audit logging
jest.mock('./src/lib/audit', () => ({
  createAuditLogFromRequest: jest.fn(),
}))

// Mock JWT utilities
jest.mock('./src/lib/jwt', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed-password'),
  verifyToken: jest.fn().mockResolvedValue({ userId: 'user-1', email: 'admin@techcorp.com' }),
  generateToken: jest.fn().mockResolvedValue('mock-jwt-token'),
}))

// Mock permissions
jest.mock('./src/lib/permissions', () => ({
  getUserWithRolesByEmail: jest.fn(),
  checkTenantPermission: jest.fn().mockResolvedValue(true),
}))

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: class NextRequest {
    constructor(url, options = {}) {
      this.url = url;
      this.method = options.method || 'GET';
      this.headers = new Map(Object.entries(options.headers || {}));
      this.body = options.body;
      this.json = jest.fn().mockResolvedValue(options.body ? JSON.parse(options.body) : {});
      this.nextUrl = new URL(url);
    }
  },
  NextResponse: {
    json: jest.fn((data, options = {}) => new Response(JSON.stringify(data), options)),
    redirect: jest.fn((url) => new Response(null, { status: 302, headers: { Location: url } })),
  }
}))

// Mock console methods to reduce noise
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
}

beforeAll(() => {
  // Suppress console output during tests unless explicitly needed
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
  console.info = jest.fn();
})

afterAll(() => {
  // Restore console methods
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
})

// Global test utilities
global.testUtils = {
  createMockRequest: (url, options = {}) => {
    return new global.Request(url, options);
  },
  
  createMockResponse: (data, options = {}) => {
    return new global.Response(JSON.stringify(data), options);
  },
  
  mockPrismaResponse: (model, method, response) => {
    const { prisma } = require('./src/lib/prisma');
    prisma[model][method].mockResolvedValue(response);
  },
  
  mockPrismaError: (model, method, error) => {
    const { prisma } = require('./src/lib/prisma');
    prisma[model][method].mockRejectedValue(error);
  }
} 