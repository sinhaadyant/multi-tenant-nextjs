import { PrismaClient } from '@prisma/client';

// Global constant to control Prisma logging - this is the single source of truth
// Changed default behavior: logging is disabled by default, only enabled when PRISMA_LOG=true
export const ENABLE_PRISMA_LOGGING = process.env.PRISMA_LOG === 'true';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Enhanced Prisma client with logging controlled by the constant
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  // Use minimal logging configuration to avoid TypeScript issues
  log: ENABLE_PRISMA_LOGGING ? ['query', 'info', 'warn', 'error'] : ['error'],
  // Performance optimizations
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Export a function to enable/disable logging at runtime
export const setPrismaLogging = (enabled: boolean) => {
  // This function is now deprecated - use the constant instead
  if (typeof window !== 'undefined') {
    console.warn('🔍 Prisma: setPrismaLogging is deprecated. Use ENABLE_PRISMA_LOGGING constant instead.');
  }
};

// Export a function to get current logging status
export const getPrismaLoggingStatus = () => {
  return ENABLE_PRISMA_LOGGING;
};

// Export a function to log a custom message - only if constant is enabled
export const logPrismaMessage = (level: 'info' | 'warn' | 'error', message: string, data?: any) => {
  // Only log if the global constant is enabled
  if (ENABLE_PRISMA_LOGGING) {
    const timestamp = new Date().toISOString();
    const prefix = '🔍 Prisma';
    
    switch (level) {
      case 'info':
        console.log(`${prefix} [INFO] ${timestamp}:`, message, data || '');
        break;
      case 'warn':
        console.warn(`${prefix} [WARN] ${timestamp}:`, message, data || '');
        break;
      case 'error':
        console.error(`${prefix} [ERROR] ${timestamp}:`, message, data || '');
        break;
    }
  }
};

// Export a function to check if logging is enabled
export const isPrismaLoggingEnabled = () => ENABLE_PRISMA_LOGGING; 