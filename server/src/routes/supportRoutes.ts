import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth';
import { requireTenant } from '@/middleware/tenantResolver';
import {
  requireRead,
  requireCreate,
  requireUpdate,
  requireDelete,
} from '@/middleware/permissionGuard';
import { asyncHandler } from '@/middleware/errorHandler';
import multer from 'multer';
import {
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  getTicketReplies,
  createReply,
  updateReply,
  deleteReply,
  uploadAttachment,
  downloadAttachment,
  deleteAttachment,
} from '@/controllers/supportController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Support
 *   description: Support ticket management
 */

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/support/');
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Allow only specific file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

// All support routes require authentication and tenant context
router.use(authMiddleware);
router.use(requireTenant);

/**
 * @swagger
 * /api/support/tickets:
 *   get:
 *     summary: Get all tickets
 *     tags: [Support]
 */
router.get('/tickets', requireRead('support'), asyncHandler(getAllTickets));

/**
 * @swagger
 * /api/support/tickets:
 *   post:
 *     summary: Create a new ticket
 *     tags: [Support]
 */
router.post('/tickets', requireCreate('support'), asyncHandler(createTicket));

/**
 * @swagger
 * /api/support/tickets/{id}:
 *   get:
 *     summary: Get ticket by ID
 *     tags: [Support]
 */
router.get('/tickets/:id', requireRead('support'), asyncHandler(getTicketById));

/**
 * @swagger
 * /api/support/tickets/{id}:
 *   put:
 *     summary: Update ticket
 *     tags: [Support]
 */
router.put(
  '/tickets/:id',
  requireUpdate('support'),
  asyncHandler(updateTicket)
);

/**
 * @swagger
 * /api/support/tickets/{id}:
 *   delete:
 *     summary: Delete ticket
 *     tags: [Support]
 */
router.delete(
  '/tickets/:id',
  requireDelete('support'),
  asyncHandler(deleteTicket)
);

/**
 * @swagger
 * /api/support/tickets/{id}/replies:
 *   get:
 *     summary: Get ticket replies
 *     tags: [Support]
 */
router.get(
  '/tickets/:id/replies',
  requireRead('support'),
  asyncHandler(getTicketReplies)
);

/**
 * @swagger
 * /api/support/tickets/{id}/replies:
 *   post:
 *     summary: Create reply
 *     tags: [Support]
 */
router.post(
  '/tickets/:id/replies',
  requireCreate('support'),
  asyncHandler(createReply)
);

/**
 * @swagger
 * /api/support/tickets/{ticketId}/replies/{replyId}:
 *   put:
 *     summary: Update reply
 *     tags: [Support]
 */
router.put(
  '/tickets/:ticketId/replies/:replyId',
  requireUpdate('support'),
  asyncHandler(updateReply)
);

/**
 * @swagger
 * /api/support/tickets/{ticketId}/replies/{replyId}:
 *   delete:
 *     summary: Delete reply
 *     tags: [Support]
 */
router.delete(
  '/tickets/:ticketId/replies/:replyId',
  requireDelete('support'),
  asyncHandler(deleteReply)
);

/**
 * @swagger
 * /api/support/tickets/{id}/attachments:
 *   post:
 *     summary: Upload attachment
 *     tags: [Support]
 */
router.post(
  '/tickets/:id/attachments',
  requireCreate('support'),
  upload.single('attachment'),
  asyncHandler(uploadAttachment)
);

/**
 * @swagger
 * /api/support/attachments/{attachmentId}:
 *   get:
 *     summary: Download attachment
 *     tags: [Support]
 */
router.get(
  '/attachments/:attachmentId',
  requireRead('support'),
  asyncHandler(downloadAttachment)
);

/**
 * @swagger
 * /api/support/attachments/{attachmentId}:
 *   delete:
 *     summary: Delete attachment
 *     tags: [Support]
 */
router.delete(
  '/attachments/:attachmentId',
  requireDelete('support'),
  asyncHandler(deleteAttachment)
);

export default router;
