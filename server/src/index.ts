import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from '@/config/env';
import { logger } from '@/config/logger';
// import { connectRedis } from '@/config/redis';
import { setupSwagger } from '@/middleware/swagger';
import { requestIdMiddleware } from '@/middleware/requestId';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler';
import apiRoutes from '@/routes';

const app = express();
const PORT = env.PORT;

// Request ID middleware (must be first)
app.use(requestIdMiddleware);

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Setup Swagger documentation
setupSwagger(app);

// API routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    message: 'Multi-Tenant Platform API',
    version: '1.0.0',
    status: 'running',
    documentation: '/api-docs',
  });
});

// 404 handler - catch all unmatched routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${env.NODE_ENV}`);
});

export default app;
