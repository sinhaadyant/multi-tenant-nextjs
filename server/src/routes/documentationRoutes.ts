import { Router } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import {
  interactiveDocs,
  openAPISpec,
  postmanCollection,
  changelog,
  codeExamples,
} from '@/controllers/documentationController';

const router = Router();

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: Interactive API documentation
 *     description: Get interactive API documentation interface
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: Documentation interface
 */
router.get('/', asyncHandler(interactiveDocs));

/**
 * @swagger
 * /api/docs/openapi.json:
 *   get:
 *     summary: OpenAPI specification
 *     description: Get OpenAPI/Swagger specification in JSON format
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: OpenAPI specification
 */
router.get('/openapi.json', asyncHandler(openAPISpec));

/**
 * @swagger
 * /api/docs/postman:
 *   get:
 *     summary: Postman collection
 *     description: Get Postman collection for API testing
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: Postman collection
 */
router.get('/postman', asyncHandler(postmanCollection));

/**
 * @swagger
 * /api/docs/changelog:
 *   get:
 *     summary: API changelog
 *     description: Get API version changelog and migration guides
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: API changelog
 */
router.get('/changelog', asyncHandler(changelog));

/**
 * @swagger
 * /api/docs/examples:
 *   get:
 *     summary: Code examples
 *     description: Get code examples in multiple languages
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: Code examples
 */
router.get('/examples', asyncHandler(codeExamples));

export default router;
