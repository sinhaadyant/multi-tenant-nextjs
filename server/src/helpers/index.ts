import { Request, Response } from "express";
import { Op, WhereOptions, Order, IncludeOptions } from "sequelize";
import {
  PaginationQuery,
  PaginationMeta,
  ApiResponse,
  WhereClause,
  OrderClause,
  IncludeClause,
  User,
  Tenant,
} from "@/interfaces";
import { API_CONSTANTS, ERROR_MESSAGES } from "@/constants";

// Pagination helpers
export const buildPaginationQuery = (req: Request): PaginationQuery => {
  const { page, limit, sortBy, sortOrder, search } = req.query;

  return {
    page: page ? parseInt(page as string, 10) : API_CONSTANTS.DEFAULT_PAGE,
    limit: limit ? parseInt(limit as string, 10) : API_CONSTANTS.DEFAULT_LIMIT,
    sortBy: sortBy as string,
    sortOrder:
      (sortOrder as "ASC" | "DESC") || API_CONSTANTS.DEFAULT_SORT_ORDER,
    search: search as string,
    filters: req.query,
  };
};

export const buildPaginationMeta = (
  total: number,
  page: number,
  limit: number
): PaginationMeta => {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const buildSequelizeOptions = (
  paginationQuery: PaginationQuery,
  searchFields: string[] = [],
  defaultSortBy: string = "created_at"
) => {
  const { page, limit, sortBy, sortOrder, search, filters } = paginationQuery;

  const offset = (page - 1) * limit;
  const order: Order = [[sortBy || defaultSortBy, sortOrder]];

  const where: WhereOptions = {};

  // Add search functionality
  if (search && searchFields.length > 0) {
    where[Op.or] = searchFields.map((field) => ({
      [field]: { [Op.like]: `%${search}%` },
    }));
  }

  // Add filters
  if (filters) {
    Object.keys(filters).forEach((key) => {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== "") {
        if (key.includes("_from")) {
          const fieldName = key.replace("_from", "");
          where[fieldName] = { [Op.gte]: value };
        } else if (key.includes("_to")) {
          const fieldName = key.replace("_to", "");
          where[fieldName] = { ...where[fieldName], [Op.lte]: value };
        } else {
          where[key] = value;
        }
      }
    });
  }

  return {
    where,
    order,
    limit,
    offset,
    distinct: true,
  };
};

// Response helpers
export const successResponse = <T>(
  res: Response,
  data: T,
  message: string = "Success",
  meta?: PaginationMeta
): Response<ApiResponse<T>> => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(200).json(response);
};

export const errorResponse = (
  res: Response,
  message: string,
  statusCode: number = 400,
  errors?: string[]
): Response<ApiResponse> => {
  const response: ApiResponse = {
    success: false,
    message,
    errors,
  };

  return res.status(statusCode).json(response);
};

export const notFoundResponse = (
  res: Response,
  message: string = ERROR_MESSAGES.NOT_FOUND
): Response<ApiResponse> => {
  return errorResponse(res, message, 404);
};

export const unauthorizedResponse = (
  res: Response,
  message: string = ERROR_MESSAGES.UNAUTHORIZED
): Response<ApiResponse> => {
  return errorResponse(res, message, 401);
};

export const forbiddenResponse = (
  res: Response,
  message: string = ERROR_MESSAGES.FORBIDDEN
): Response<ApiResponse> => {
  return errorResponse(res, message, 403);
};

export const validationErrorResponse = (
  res: Response,
  message: string = ERROR_MESSAGES.VALIDATION_ERROR,
  errors?: string[]
): Response<ApiResponse> => {
  return errorResponse(res, message, 400, errors);
};

export const internalServerErrorResponse = (
  res: Response,
  message: string = ERROR_MESSAGES.INTERNAL_SERVER_ERROR
): Response<ApiResponse> => {
  return errorResponse(res, message, 500);
};

// Role and permission helpers
export const isSuperAdmin = (user: User): boolean => {
  return user.is_superadmin;
};

export const isTenantAdmin = (user: User, tenantId: number): boolean => {
  return user.tenant_id === tenantId && !user.is_superadmin;
};

export const canAccessTenant = (user: User, tenantId: number): boolean => {
  return isSuperAdmin(user) || isTenantAdmin(user, tenantId);
};

export const canAccessUser = (currentUser: User, targetUser: User): boolean => {
  if (isSuperAdmin(currentUser)) return true;
  return currentUser.tenant_id === targetUser.tenant_id;
};

export const canAccessResource = (
  currentUser: User,
  resourceTenantId: number
): boolean => {
  if (isSuperAdmin(currentUser)) return true;
  return currentUser.tenant_id === resourceTenantId;
};

// Database query helpers
export const buildWhereClause = (filters: Record<string, any>): WhereClause => {
  const where: WhereClause = {};

  Object.keys(filters).forEach((key) => {
    const value = filters[key];
    if (value !== undefined && value !== null && value !== "") {
      if (key.includes("_from")) {
        const fieldName = key.replace("_from", "");
        where[fieldName] = { [Op.gte]: value };
      } else if (key.includes("_to")) {
        const fieldName = key.replace("_to", "");
        where[fieldName] = { ...where[fieldName], [Op.lte]: value };
      } else if (key.includes("_like")) {
        const fieldName = key.replace("_like", "");
        where[fieldName] = { [Op.like]: `%${value}%` };
      } else if (key.includes("_in")) {
        const fieldName = key.replace("_in", "");
        where[fieldName] = { [Op.in]: Array.isArray(value) ? value : [value] };
      } else {
        where[key] = value;
      }
    }
  });

  return where;
};

export const buildOrderClause = (
  sortBy: string = "created_at",
  sortOrder: "ASC" | "DESC" = "DESC"
): OrderClause => {
  return { [sortBy]: sortOrder };
};

export const buildIncludeClause = (
  includes: IncludeClause[]
): IncludeOptions[] => {
  return includes.map((include) => ({
    model: include.model,
    as: include.as,
    required: include.required || false,
    where: include.where,
    include: include.include,
  }));
};

// Validation helpers
export const validatePagination = (page: number, limit: number): boolean => {
  return (
    page >= API_CONSTANTS.MIN_LIMIT &&
    limit >= API_CONSTANTS.MIN_LIMIT &&
    limit <= API_CONSTANTS.MAX_LIMIT
  );
};

export const validateSortOrder = (sortOrder: string): boolean => {
  return API_CONSTANTS.VALID_SORT_ORDERS.includes(sortOrder as any);
};

export const validateSearchLength = (search: string): boolean => {
  return search.length <= API_CONSTANTS.MAX_SEARCH_LENGTH;
};

// Date helpers
export const formatDate = (date: Date): string => {
  return date.toISOString();
};

export const parseDateRange = (
  from: string,
  to: string
): { start: Date; end: Date } => {
  return {
    start: new Date(from),
    end: new Date(to),
  };
};

export const isValidDate = (date: string): boolean => {
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
};

// String helpers
export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, "");
};

export const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const generateSlug = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

// Array helpers
export const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const uniqueArray = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

export const sortArrayBy = <T>(
  array: T[],
  key: keyof T,
  order: "ASC" | "DESC" = "ASC"
): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal < bVal) return order === "ASC" ? -1 : 1;
    if (aVal > bVal) return order === "ASC" ? 1 : -1;
    return 0;
  });
};

// Object helpers
export const pick = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (obj.hasOwnProperty(key)) {
      result[key] = obj[key];
    }
  });
  return result;
};

export const omit = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach((key) => {
    delete result[key];
  });
  return result;
};

export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

// Error handling helpers
export const handleAsyncError = (fn: Function) => {
  return (req: Request, res: Response, next: Function) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const createError = (
  message: string,
  statusCode: number = 400
): Error => {
  const error = new Error(message);
  (error as any).statusCode = statusCode;
  return error;
};

// Logging helpers
export const logError = (error: Error, context?: string): void => {
  console.error(`[${context || "ERROR"}]`, {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });
};

export const logInfo = (message: string, data?: any): void => {
  console.log(`[INFO] ${message}`, data || "");
};

export const logWarning = (message: string, data?: any): void => {
  console.warn(`[WARNING] ${message}`, data || "");
};

// Export all helpers
export const helpers = {
  // Pagination
  buildPaginationQuery,
  buildPaginationMeta,
  buildSequelizeOptions,

  // Response
  successResponse,
  errorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  internalServerErrorResponse,

  // Role & Permission
  isSuperAdmin,
  isTenantAdmin,
  canAccessTenant,
  canAccessUser,
  canAccessResource,

  // Database
  buildWhereClause,
  buildOrderClause,
  buildIncludeClause,

  // Validation
  validatePagination,
  validateSortOrder,
  validateSearchLength,

  // Date
  formatDate,
  parseDateRange,
  isValidDate,

  // String
  sanitizeString,
  capitalizeFirst,
  generateSlug,

  // Array
  chunkArray,
  uniqueArray,
  sortArrayBy,

  // Object
  pick,
  omit,
  deepClone,

  // Error
  handleAsyncError,
  createError,

  // Logging
  logError,
  logInfo,
  logWarning,
} as const;

export default helpers;
