import { Router, Request, Response } from 'express';
import { authMiddleware } from '@/middleware/auth';
import { requireTenant, optionalTenant } from '@/middleware/tenantResolver';
import { requireRead, superadminOnly } from '@/middleware/permissionGuard';
import { asyncHandler } from '@/middleware/errorHandler';
import { successResponse } from '@/utils/apiResponse';

const router = Router();

/**
 * @swagger
 * /api/example/public:
 *   get:
 *     summary: Public endpoint (no auth required)
 *     description: Example of a public endpoint that doesn't require authentication
 *     tags: [Example]
 *     responses:
 *       200:
 *         description: Public data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Public data retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: This is public data
 */
router.get(
  '/public',
  asyncHandler(async (req: Request, res: Response) => {
    successResponse(
      res,
      {
        message: 'This is public data',
        requestId: req.requestId,
      },
      'Public data retrieved successfully'
    );
  })
);

/**
 * @swagger
 * /api/example/authenticated:
 *   get:
 *     summary: Authenticated endpoint
 *     description: Example of an endpoint that requires authentication
 *     tags: [Example]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authenticated data retrieved successfully
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/authenticated',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    successResponse(
      res,
      {
        message: 'This is authenticated data',
        user: {
          id: req.user?.id,
          email: req.user?.email,
          isSuperadmin: req.user?.isSuperadmin,
        },
        requestId: req.requestId,
      },
      'Authenticated data retrieved successfully'
    );
  })
);

/**
 * @swagger
 * /api/example/tenant-required:
 *   get:
 *     summary: Tenant-required endpoint
 *     description: Example of an endpoint that requires tenant context
 *     tags: [Example]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tenant data retrieved successfully
 *       401:
 *         description: Authentication required
 *       400:
 *         description: Tenant context required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/tenant-required',
  authMiddleware,
  requireTenant,
  asyncHandler(async (req: Request, res: Response) => {
    successResponse(
      res,
      {
        message: 'This is tenant-specific data',
        tenant: {
          id: req.tenant?.id,
          name: req.tenant?.name,
          domain: req.tenant?.domain,
        },
        user: {
          id: req.user?.id,
          email: req.user?.email,
        },
        requestId: req.requestId,
      },
      'Tenant data retrieved successfully'
    );
  })
);

/**
 * @swagger
 * /api/example/tenant-optional:
 *   get:
 *     summary: Tenant-optional endpoint
 *     description: Example of an endpoint that can work with or without tenant context
 *     tags: [Example]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data retrieved successfully
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/tenant-optional',
  authMiddleware,
  optionalTenant,
  asyncHandler(async (req: Request, res: Response) => {
    const data: any = {
      message: 'This data can be tenant-specific or global',
      hasTenant: !!req.tenant,
      requestId: req.requestId,
    };

    if (req.tenant) {
      data.tenant = {
        id: req.tenant.id,
        name: req.tenant.name,
      };
    }

    successResponse(res, data, 'Data retrieved successfully');
  })
);

/**
 * @swagger
 * /api/example/superadmin-only:
 *   get:
 *     summary: Superadmin-only endpoint
 *     description: Example of an endpoint that only superadmins can access
 *     tags: [Example]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Superadmin data retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Superadmin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/superadmin-only',
  authMiddleware,
  superadminOnly,
  asyncHandler(async (req: Request, res: Response) => {
    successResponse(
      res,
      {
        message: 'This is superadmin-only data',
        user: {
          id: req.user?.id,
          email: req.user?.email,
          isSuperadmin: req.user?.isSuperadmin,
        },
        requestId: req.requestId,
      },
      'Superadmin data retrieved successfully'
    );
  })
);

/**
 * @swagger
 * /api/example/permission-required:
 *   get:
 *     summary: Permission-required endpoint
 *     description: Example of an endpoint that requires specific permissions
 *     tags: [Example]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permission-protected data retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Permission denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/permission-required',
  authMiddleware,
  requireTenant,
  requireRead('user-management'),
  asyncHandler(async (req: Request, res: Response) => {
    successResponse(
      res,
      {
        message:
          'This data requires read permission for user-management module',
        tenant: {
          id: req.tenant?.id,
          name: req.tenant?.name,
        },
        user: {
          id: req.user?.id,
          email: req.user?.email,
        },
        requestId: req.requestId,
      },
      'Permission-protected data retrieved successfully'
    );
  })
);

export default router;
