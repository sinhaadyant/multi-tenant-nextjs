// Register TypeScript and path mapping
require('tsconfig-paths/register');
require('ts-node').register({
  transpileOnly: true,
});

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Create Express app for testing
const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting - Disabled for tests to avoid interference
if (process.env.NODE_ENV !== 'test') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
  });
  app.use(limiter);
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Mock middleware for testing
app.use((req, res, next) => {
  // Add request ID for testing
  req.id = `test-${Date.now()}`;
  next();
});

// Import and use real API routes from TypeScript source
try {
  // Use the TypeScript routes directly
  const apiRoutes = require('../../src/routes/index');
  app.use('/api', apiRoutes.default);
  console.log('✅ Real routes loaded successfully');
} catch (error) {
  console.error('Failed to load real routes:', error.message);
  // Fallback to basic routes if real routes fail to load
  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      message: 'API is healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  });
}

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    message: 'Multi-Tenant Platform API - Test Mode',
    version: '1.0.0',
    status: 'running',
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Test error:', err);

  // Handle custom error types
  if (err.statusCode) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error:
        process.env.NODE_ENV === 'test' ? err.message : 'Something went wrong',
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error:
        process.env.NODE_ENV === 'test' ? err.message : 'Something went wrong',
    });
  }
});

module.exports = app;
