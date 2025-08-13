import pino from 'pino';
import { env } from './env';

export const logger = pino({
  level: env.LOG_LEVEL,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
  // Add request ID to logs
  mixin() {
    return {
      service: 'multi-tenant-api',
      environment: env.NODE_ENV,
    };
  },
  // Custom serializers for better logging
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
});

// Create child loggers for different contexts
export const createLogger = (context: string) => {
  return logger.child({ context });
};

// Export commonly used loggers
export const authLogger = createLogger('auth');
export const dbLogger = createLogger('database');
export const apiLogger = createLogger('api');
export const tenantLogger = createLogger('tenant');
