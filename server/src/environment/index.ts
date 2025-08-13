import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const ENV = {
  // Server configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  HOST: process.env.HOST || 'localhost',
  
  // Database configuration
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '3306', 10),
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'multi_tenant_saas',
  DB_NAME_TEST: process.env.DB_NAME_TEST || 'multi_tenant_saas_test',
  DB_POOL_MAX: parseInt(process.env.DB_POOL_MAX || '10', 10),
  DB_POOL_MIN: parseInt(process.env.DB_POOL_MIN || '0', 10),
  DB_POOL_ACQUIRE: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10),
  DB_POOL_IDLE: parseInt(process.env.DB_POOL_IDLE || '10000', 10),
  
  // JWT configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '24h',
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
  JWT_RESET_EXPIRY: process.env.JWT_RESET_EXPIRY || '1h',
  
  // CORS configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  CORS_CREDENTIALS: process.env.CORS_CREDENTIALS === 'true',
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  
  // File upload
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
  ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain'
  ],
  
  // Email configuration (for password reset)
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM || 'noreply@example.com',
  
  // Security
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
  SESSION_SECRET: process.env.SESSION_SECRET || 'your-session-secret',
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE,
  
  // API configuration
  API_PREFIX: process.env.API_PREFIX || '/api/v1',
  API_VERSION: process.env.API_VERSION || '1.0.0',
  
  // Pagination defaults
  DEFAULT_PAGE_SIZE: parseInt(process.env.DEFAULT_PAGE_SIZE || '10', 10),
  MAX_PAGE_SIZE: parseInt(process.env.MAX_PAGE_SIZE || '100', 10),
  
  // Audit logging
  AUDIT_LOG_ENABLED: process.env.AUDIT_LOG_ENABLED === 'true',
  AUDIT_LOG_RETENTION_DAYS: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '90', 10),
  
  // Tenant configuration
  DEFAULT_TENANT_LOGIN_RESTRICTIONS: {
    max_devices: parseInt(process.env.DEFAULT_MAX_DEVICES || '3', 10),
    allow_multiple_sessions: process.env.DEFAULT_ALLOW_MULTIPLE_SESSIONS === 'true',
    password_expiry_days: parseInt(process.env.DEFAULT_PASSWORD_EXPIRY_DAYS || '90', 10),
    session_timeout: parseInt(process.env.DEFAULT_SESSION_TIMEOUT || '3600', 10) // 1 hour
  },
  
  // Testing
  TEST_DB_SYNC: process.env.TEST_DB_SYNC === 'true',
  TEST_TIMEOUT: parseInt(process.env.TEST_TIMEOUT || '10000', 10),
  
  // Development
  ENABLE_SWAGGER: process.env.ENABLE_SWAGGER === 'true',
  ENABLE_LOGGING: process.env.ENABLE_LOGGING !== 'false',
  
  // External services
  REDIS_URL: process.env.REDIS_URL,
  REDIS_TTL: parseInt(process.env.REDIS_TTL || '3600', 10),
  
  // Monitoring
  ENABLE_METRICS: process.env.ENABLE_METRICS === 'true',
  METRICS_PORT: parseInt(process.env.METRICS_PORT || '9090', 10)
} as const;

// Validation function to ensure required environment variables are set
export const validateEnvironment = (): void => {
  const requiredVars = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};

// Environment-specific configurations
export const getEnvironmentConfig = () => {
  switch (ENV.NODE_ENV) {
    case 'production':
      return {
        logging: false,
        cors: {
          origin: ENV.CORS_ORIGIN,
          credentials: ENV.CORS_CREDENTIALS
        },
        rateLimit: {
          windowMs: ENV.RATE_LIMIT_WINDOW_MS,
          max: ENV.RATE_LIMIT_MAX_REQUESTS
        }
      };
    
    case 'test':
      return {
        logging: false,
        cors: {
          origin: '*',
          credentials: false
        },
        rateLimit: {
          windowMs: 60000, // 1 minute
          max: 1000
        }
      };
    
    default: // development
      return {
        logging: ENV.ENABLE_LOGGING,
        cors: {
          origin: '*',
          credentials: false
        },
        rateLimit: {
          windowMs: ENV.RATE_LIMIT_WINDOW_MS,
          max: ENV.RATE_LIMIT_MAX_REQUESTS
        }
      };
  }
};

export default ENV;
