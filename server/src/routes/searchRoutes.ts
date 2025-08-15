import { Router } from 'express';
import {
  globalSearch,
  advancedSearch,
  getSuggestions,
  saveSearch,
  getSavedSearches,
  getSearchAnalytics,
} from '@/controllers/searchController';

const router = Router();

/**
 * @swagger
 * /search/global:
 *   get:
 *     summary: Global search across all entities
 *     description: Search across users, roles, tenants, support tickets, and audit logs
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: entity
 *         schema:
 *           type: string
 *           enum: [users, roles, tenants, support_tickets, audit_logs]
 *         description: Specific entity to search (optional)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Number of results per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       400:
 *         description: Invalid search parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/global', globalSearch);

/**
 * @swagger
 * /search/advanced:
 *   post:
 *     summary: Advanced search with complex filters
 *     description: Perform advanced search with multiple queries and complex filter combinations
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               queries:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     entity:
 *                       type: string
 *                       enum: [users, roles, tenants, support_tickets, audit_logs]
 *                     query:
 *                       type: string
 *                     filters:
 *                       type: object
 *               globalFilters:
 *                 type: object
 *               page:
 *                 type: integer
 *                 default: 1
 *               limit:
 *                 type: integer
 *                 default: 20
 *     responses:
 *       200:
 *         description: Advanced search results
 *       400:
 *         description: Invalid search parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/advanced', advancedSearch);

/**
 * @swagger
 * /search/suggestions:
 *   get:
 *     summary: Get search suggestions and autocomplete
 *     description: Get real-time search suggestions for autocomplete functionality
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Partial search query
 *       - in: query
 *         name: entity
 *         schema:
 *           type: string
 *           enum: [users, roles, support_tickets]
 *         description: Specific entity for suggestions (optional)
 *     responses:
 *       200:
 *         description: Search suggestions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       text:
 *                         type: string
 *                       entity:
 *                         type: string
 *                       type:
 *                         type: string
 *       400:
 *         description: Missing query parameter
 */
router.get('/suggestions', getSuggestions);

/**
 * @swagger
 * /search/save:
 *   post:
 *     summary: Save search query
 *     description: Save a search query for future use
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - query
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *               description:
 *                 type: string
 *               query:
 *                 type: object
 *               isPublic:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Search saved successfully
 *       400:
 *         description: Invalid search data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/save', saveSearch);

/**
 * @swagger
 * /search/saved:
 *   get:
 *     summary: Get saved searches
 *     description: Retrieve user's saved search queries
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Saved searches retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/saved', getSavedSearches);

/**
 * @swagger
 * /search/analytics:
 *   get:
 *     summary: Get search analytics
 *     description: Retrieve search usage analytics and statistics
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Search analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalSearches:
 *                       type: integer
 *                     popularSearches:
 *                       type: array
 *                       items:
 *                         type: object
 *                     searchTrends:
 *                       type: object
 *                       properties:
 *                         daily:
 *                           type: array
 *                         weekly:
 *                           type: array
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/analytics', getSearchAnalytics);

export default router;
