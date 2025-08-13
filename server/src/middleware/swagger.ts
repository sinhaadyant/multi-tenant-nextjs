import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { specs } from '@/config/swagger';

export const setupSwagger = (app: Express): void => {
  // Serve Swagger UI
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Multi-Tenant Platform API Documentation',
      customfavIcon: '/favicon.ico',
      swaggerOptions: {
        docExpansion: 'list',
        filter: true,
        showRequestHeaders: true,
        tryItOutEnabled: true,
      },
    })
  );

  // Serve raw OpenAPI spec
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  // Serve OpenAPI spec in YAML format
  app.get('/api-docs.yaml', (_req, res) => {
    res.setHeader('Content-Type', 'text/yaml');
    // Convert JSON to YAML (you might want to use a library like js-yaml)
    res.send(JSON.stringify(specs, null, 2));
  });
};
