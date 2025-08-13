import { z } from 'zod';

// Create ticket schema
export const createTicketSchema = z.object({
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(200, 'Subject must be less than 200 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(5000, 'Description must be less than 5000 characters'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  category: z
    .string()
    .min(1, 'Category is required')
    .max(100, 'Category must be less than 100 characters'),
  subcategory: z
    .string()
    .max(100, 'Subcategory must be less than 100 characters')
    .optional(),
  assignedTo: z.string().optional(),
  tags: z.array(z.string()).default([]),
  customFields: z.record(z.string(), z.any()).optional(),
  notifyUsers: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
  estimatedResolutionTime: z.number().min(1).optional(), // in hours
});

// Update ticket schema
export const updateTicketSchema = z.object({
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(200, 'Subject must be less than 200 characters')
    .optional(),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(5000, 'Description must be less than 5000 characters')
    .optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  category: z
    .string()
    .min(1, 'Category is required')
    .max(100, 'Category must be less than 100 characters')
    .optional(),
  subcategory: z
    .string()
    .max(100, 'Subcategory must be less than 100 characters')
    .optional(),
  status: z
    .enum([
      'open',
      'in_progress',
      'waiting_for_customer',
      'waiting_for_third_party',
      'resolved',
      'closed',
    ])
    .optional(),
  assignedTo: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.string(), z.any()).optional(),
  resolution: z
    .string()
    .max(5000, 'Resolution must be less than 5000 characters')
    .optional(),
  estimatedResolutionTime: z.number().min(1).optional(), // in hours
  actualResolutionTime: z.number().min(0).optional(), // in hours
});

// Ticket list query schema
export const ticketListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z
    .enum([
      'open',
      'in_progress',
      'waiting_for_customer',
      'waiting_for_third_party',
      'resolved',
      'closed',
    ])
    .optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  category: z.string().optional(),
  assignedTo: z.string().optional(),
  createdBy: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'priority', 'status', 'subject'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  includeReplies: z.boolean().default(false),
  includeAttachments: z.boolean().default(false),
});

// Ticket ID parameter schema
export const ticketIdParamSchema = z.object({
  id: z.string().min(1, 'Ticket ID is required'),
});

// Create reply schema
export const createReplySchema = z.object({
  content: z
    .string()
    .min(1, 'Content is required')
    .max(5000, 'Content must be less than 5000 characters'),
  isInternal: z.boolean().default(false),
  notifyCustomer: z.boolean().default(true),
  notifyAssignedTo: z.boolean().default(true),
  timeSpent: z.number().min(0).optional(), // in minutes
  tags: z.array(z.string()).default([]),
});

// Update reply schema
export const updateReplySchema = z.object({
  content: z
    .string()
    .min(1, 'Content is required')
    .max(5000, 'Content must be less than 5000 characters'),
  isInternal: z.boolean().optional(),
  timeSpent: z.number().min(0).optional(), // in minutes
  tags: z.array(z.string()).optional(),
});

// Reply ID parameter schema
export const replyIdParamSchema = z.object({
  replyId: z.string().min(1, 'Reply ID is required'),
});

// Upload attachment schema
export const uploadAttachmentSchema = z.object({
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  isPublic: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
});

// Attachment ID parameter schema
export const attachmentIdParamSchema = z.object({
  attachmentId: z.string().min(1, 'Attachment ID is required'),
});

// Ticket statistics query schema
export const ticketStatsQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).default('month'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  category: z.string().optional(),
  assignedTo: z.string().optional(),
  includeResolved: z.boolean().default(true),
});

// Ticket export schema
export const ticketExportSchema = z.object({
  format: z.enum(['csv', 'xlsx', 'json']).default('csv'),
  includeReplies: z.boolean().default(false),
  includeAttachments: z.boolean().default(false),
  includeCustomFields: z.boolean().default(true),
  filters: z.record(z.string(), z.any()).optional(),
});

// Ticket bulk operations schema
export const ticketBulkOperationSchema = z.object({
  ticketIds: z.array(z.string()).min(1, 'At least one ticket ID is required'),
  operation: z.enum([
    'update_status',
    'assign',
    'add_tags',
    'remove_tags',
    'delete',
  ]),
  data: z.record(z.string(), z.any()).optional(),
});

// Ticket template schema
export const ticketTemplateSchema = z.object({
  name: z
    .string()
    .min(1, 'Template name is required')
    .max(100, 'Template name must be less than 100 characters'),
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(200, 'Subject must be less than 200 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(5000, 'Description must be less than 5000 characters'),
  category: z
    .string()
    .min(1, 'Category is required')
    .max(100, 'Category must be less than 100 characters'),
  subcategory: z
    .string()
    .max(100, 'Subcategory must be less than 100 characters')
    .optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  tags: z.array(z.string()).default([]),
  customFields: z.record(z.string(), z.any()).optional(),
  isPublic: z.boolean().default(false),
});

// Ticket category schema
export const ticketCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(100, 'Category name must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color')
    .optional(),
  icon: z.string().optional(),
  parentCategoryId: z.string().optional(),
  slaHours: z.number().min(1).optional(), // Service Level Agreement in hours
  autoAssignTo: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Ticket SLA schema
export const ticketSLASchema = z.object({
  categoryId: z.string().min(1, 'Category ID is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  responseTime: z.number().min(1), // in hours
  resolutionTime: z.number().min(1), // in hours
  businessHours: z
    .object({
      startTime: z
        .string()
        .regex(
          /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
          'Start time must be in HH:MM format'
        ),
      endTime: z
        .string()
        .regex(
          /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
          'End time must be in HH:MM format'
        ),
      timezone: z.string().default('UTC'),
    })
    .optional(),
  workingDays: z.array(z.number().min(0).max(6)).default([1, 2, 3, 4, 5]), // Monday = 1, Sunday = 0
});

// Ticket notification schema
export const ticketNotificationSchema = z.object({
  ticketId: z.string().min(1, 'Ticket ID is required'),
  type: z.enum([
    'status_change',
    'assignment',
    'reply',
    'escalation',
    'sla_breach',
  ]),
  recipients: z.array(z.string()).min(1, 'At least one recipient is required'),
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(200, 'Subject must be less than 200 characters'),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(2000, 'Message must be less than 2000 characters'),
  channels: z
    .array(z.enum(['email', 'sms', 'push', 'webhook']))
    .default(['email']),
  scheduledAt: z.string().datetime().optional(),
});

// Ticket escalation schema
export const ticketEscalationSchema = z.object({
  ticketId: z.string().min(1, 'Ticket ID is required'),
  reason: z
    .string()
    .min(1, 'Escalation reason is required')
    .max(500, 'Reason must be less than 500 characters'),
  escalatedTo: z.string().min(1, 'Escalated to user ID is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  deadline: z.string().datetime().optional(),
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional(),
});

// Export types
export type CreateTicketRequest = z.infer<typeof createTicketSchema>;
export type UpdateTicketRequest = z.infer<typeof updateTicketSchema>;
export type TicketListQuery = z.infer<typeof ticketListQuerySchema>;
export type TicketIdParam = z.infer<typeof ticketIdParamSchema>;
export type CreateReplyRequest = z.infer<typeof createReplySchema>;
export type UpdateReplyRequest = z.infer<typeof updateReplySchema>;
export type ReplyIdParam = z.infer<typeof replyIdParamSchema>;
export type UploadAttachmentRequest = z.infer<typeof uploadAttachmentSchema>;
export type AttachmentIdParam = z.infer<typeof attachmentIdParamSchema>;
export type TicketStatsQuery = z.infer<typeof ticketStatsQuerySchema>;
export type TicketExport = z.infer<typeof ticketExportSchema>;
export type TicketBulkOperation = z.infer<typeof ticketBulkOperationSchema>;
export type TicketTemplate = z.infer<typeof ticketTemplateSchema>;
export type TicketCategory = z.infer<typeof ticketCategorySchema>;
export type TicketSLA = z.infer<typeof ticketSLASchema>;
export type TicketNotification = z.infer<typeof ticketNotificationSchema>;
export type TicketEscalation = z.infer<typeof ticketEscalationSchema>;
