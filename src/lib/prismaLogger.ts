import { prisma, ENABLE_PRISMA_LOGGING, logPrismaMessage, isPrismaLoggingEnabled } from './prisma';

// Runtime logging control - but still respects the global constant
let runtimeLoggingEnabled = ENABLE_PRISMA_LOGGING;

export const PrismaLogger = {
  // Enable/disable logging at runtime (but only if global constant allows it)
  setLogging: (enabled: boolean) => {
    runtimeLoggingEnabled = enabled && ENABLE_PRISMA_LOGGING;
    if (ENABLE_PRISMA_LOGGING) {
      logPrismaMessage('info', `Prisma logging ${enabled ? 'enabled' : 'disabled'} at runtime`);
    }
  },

  // Get current logging status - must respect both global constant and runtime setting
  isLoggingEnabled: () => runtimeLoggingEnabled && ENABLE_PRISMA_LOGGING,

  // Log custom messages - only if both global constant and runtime setting allow it
  info: (message: string, data?: any) => {
    if (runtimeLoggingEnabled && ENABLE_PRISMA_LOGGING) {
      logPrismaMessage('info', message, data);
    }
  },

  warn: (message: string, data?: any) => {
    if (runtimeLoggingEnabled && ENABLE_PRISMA_LOGGING) {
      logPrismaMessage('warn', message, data);
    }
  },

  error: (message: string, data?: any) => {
    if (runtimeLoggingEnabled && ENABLE_PRISMA_LOGGING) {
      logPrismaMessage('error', message, data);
    }
  },

  // Performance monitoring - only if logging is enabled
  time: (label: string) => {
    if (runtimeLoggingEnabled && ENABLE_PRISMA_LOGGING) {
      console.time(`🔍 Prisma [TIMER] ${label}`);
    }
  },

  timeEnd: (label: string) => {
    if (runtimeLoggingEnabled && ENABLE_PRISMA_LOGGING) {
      console.timeEnd(`🔍 Prisma [TIMER] ${label}`);
    }
  },

  // Query performance wrapper - only logs if enabled
  async measureQuery<T>(
    label: string,
    queryFn: () => Promise<T>,
    additionalData?: any
  ): Promise<T> {
    const startTime = Date.now();
    
    if (runtimeLoggingEnabled && ENABLE_PRISMA_LOGGING) {
      logPrismaMessage('info', `Starting query: ${label}`, additionalData);
    }

    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      if (runtimeLoggingEnabled && ENABLE_PRISMA_LOGGING) {
        logPrismaMessage('info', `Query completed: ${label}`, {
          duration: `${duration}ms`,
          success: true,
          ...additionalData,
        });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (runtimeLoggingEnabled && ENABLE_PRISMA_LOGGING) {
        logPrismaMessage('error', `Query failed: ${label}`, {
          duration: `${duration}ms`,
          error: error instanceof Error ? error.message : 'Unknown error',
          ...additionalData,
        });
      }
      
      throw error;
    }
  },

  // Batch query monitoring - only logs if enabled
  async measureBatchQueries<T>(
    label: string,
    queries: Array<{ name: string; fn: () => Promise<any> }>,
    additionalData?: any
  ): Promise<T[]> {
    const startTime = Date.now();
    
    if (runtimeLoggingEnabled && ENABLE_PRISMA_LOGGING) {
      logPrismaMessage('info', `Starting batch queries: ${label}`, {
        queryCount: queries.length,
        ...additionalData,
      });
    }

    try {
      const results = await Promise.all(
        queries.map(async (query, index) => {
          const queryStartTime = Date.now();
          
          if (runtimeLoggingEnabled && ENABLE_PRISMA_LOGGING) {
            logPrismaMessage('info', `Executing query ${index + 1}/${queries.length}: ${query.name}`);
          }
          
          const result = await query.fn();
          const queryDuration = Date.now() - queryStartTime;
          
          if (runtimeLoggingEnabled && ENABLE_PRISMA_LOGGING) {
            logPrismaMessage('info', `Query ${index + 1} completed: ${query.name}`, {
              duration: `${queryDuration}ms`,
            });
          }
          
          return result;
        })
      );
      
      const totalDuration = Date.now() - startTime;
      
      if (runtimeLoggingEnabled && ENABLE_PRISMA_LOGGING) {
        logPrismaMessage('info', `Batch queries completed: ${label}`, {
          totalDuration: `${totalDuration}ms`,
          queryCount: queries.length,
          success: true,
          ...additionalData,
        });
      }
      
      return results;
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      
      if (runtimeLoggingEnabled && ENABLE_PRISMA_LOGGING) {
        logPrismaMessage('error', `Batch queries failed: ${label}`, {
          totalDuration: `${totalDuration}ms`,
          error: error instanceof Error ? error.message : 'Unknown error',
          ...additionalData,
        });
      }
      
      throw error;
    }
  },

  // Connection monitoring - only logs if enabled
  getConnectionInfo: async () => {
    if (runtimeLoggingEnabled && ENABLE_PRISMA_LOGGING) {
      try {
        // This is a simple way to check connection health
        const startTime = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        const duration = Date.now() - startTime;
        
        logPrismaMessage('info', 'Database connection health check', {
          duration: `${duration}ms`,
          status: 'healthy',
        });
        
        return { status: 'healthy', duration };
      } catch (error) {
        logPrismaMessage('error', 'Database connection health check failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        
        return { status: 'unhealthy', error };
      }
    }
    
    return { status: 'unknown' };
  },

  // Export current configuration
  getConfig: () => ({
    environmentLogging: ENABLE_PRISMA_LOGGING,
    runtimeLogging: runtimeLoggingEnabled,
    effectiveLogging: runtimeLoggingEnabled && ENABLE_PRISMA_LOGGING,
    environment: process.env.NODE_ENV,
    prismaLogEnv: process.env.PRISMA_LOG,
  }),
};

// Export convenience functions that respect the global constant
export const enablePrismaLogging = () => {
  if (ENABLE_PRISMA_LOGGING) {
    PrismaLogger.setLogging(true);
  } else {
    console.warn('🔍 Prisma: Cannot enable logging - global constant ENABLE_PRISMA_LOGGING is false');
  }
};

export const disablePrismaLogging = () => {
  PrismaLogger.setLogging(false);
};

export const isPrismaLoggingEnabled = () => PrismaLogger.isLoggingEnabled();
export const measurePrismaQuery = PrismaLogger.measureQuery;
export const measurePrismaBatch = PrismaLogger.measureBatchQueries; 