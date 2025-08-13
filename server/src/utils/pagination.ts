import { z } from 'zod';

// Pagination query parameters schema
export const paginationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  cursor: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Search query parameters schema
export const searchQuerySchema = z.object({
  q: z.string().optional(),
  search: z.string().optional(),
  filters: z.record(z.string(), z.any()).optional(),
});

// Combined pagination and search schema
export const listQuerySchema = paginationQuerySchema.merge(searchQuerySchema);

// Pagination result interface
export interface PaginationResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor?: string;
    previousCursor?: string;
  };
}

// Pagination options interface
export interface PaginationOptions {
  page: number;
  limit: number;
  cursor?: string;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

// Prisma-compatible filter interface
export interface PrismaFilters {
  where?: any;
  orderBy?: any;
  skip?: number;
  take?: number;
  cursor?: any;
}

/**
 * Parse query parameters into pagination options
 */
export function parsePaginationQuery(query: any): PaginationOptions {
  const result = listQuerySchema.safeParse(query);

  if (!result.success) {
    // Return default values if parsing fails
    return {
      page: 1,
      limit: 10,
      sortOrder: 'desc',
    };
  }

  const { page, limit, cursor, sortBy, sortOrder, q, search, filters } =
    result.data;

  return {
    page,
    limit,
    cursor,
    sortBy,
    sortOrder,
    search: q || search,
    filters,
  };
}

/**
 * Convert pagination options to Prisma-compatible filters
 */
export function buildPrismaFilters(
  options: PaginationOptions,
  defaultSortBy: string = 'createdAt',
  searchFields: string[] = ['name', 'email'],
  additionalFilters: Record<string, any> = {}
): PrismaFilters {
  const { page, limit, cursor, sortBy, sortOrder, search, filters } = options;

  // Build where clause
  const where: any = {
    ...additionalFilters,
    ...filters,
  };

  // Add search functionality
  if (search && searchFields.length > 0) {
    where.OR = searchFields.map(field => ({
      [field]: {
        contains: search,
        mode: 'insensitive' as const,
      },
    }));
  }

  // Build orderBy clause
  const orderBy: any = {};
  if (sortBy) {
    orderBy[sortBy] = sortOrder;
  } else {
    orderBy[defaultSortBy] = sortOrder;
  }

  // Handle cursor-based pagination
  if (cursor) {
    return {
      where,
      orderBy,
      cursor: { id: cursor },
      take: limit,
    };
  }

  // Handle offset-based pagination
  return {
    where,
    orderBy,
    skip: (page - 1) * limit,
    take: limit,
  };
}

/**
 * Build pagination metadata
 */
export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
  cursor?: string
): PaginationResult<any>['meta'] {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: cursor ? true : page < totalPages,
    hasPreviousPage: page > 1,
    nextCursor: cursor,
    previousCursor: cursor,
  };
}

/**
 * Create a standardized pagination response
 */
export function createPaginationResponse<T>(
  data: T[],
  options: PaginationOptions,
  total: number,
  cursor?: string
): PaginationResult<T> {
  return {
    data,
    meta: buildPaginationMeta(options.page, options.limit, total, cursor),
  };
}

/**
 * Validate and sanitize pagination parameters
 */
export function validatePaginationParams(params: any): {
  isValid: boolean;
  errors: string[];
  options?: PaginationOptions;
} {
  const result = listQuerySchema.safeParse(params);

  if (!result.success) {
    return {
      isValid: false,
      errors: result.error.issues.map(issue => issue.message),
    };
  }

  return {
    isValid: true,
    errors: [],
    options: parsePaginationQuery(params),
  };
}

/**
 * Get the next cursor for cursor-based pagination
 */
export function getNextCursor<T extends { id: string }>(
  data: T[],
  sortOrder: 'asc' | 'desc'
): string | undefined {
  if (data.length === 0) return undefined;

  if (sortOrder === 'asc') {
    return data[data.length - 1]?.id;
  } else {
    return data[0]?.id;
  }
}

/**
 * Get the previous cursor for cursor-based pagination
 */
export function getPreviousCursor<T extends { id: string }>(
  data: T[],
  sortOrder: 'asc' | 'desc'
): string | undefined {
  if (data.length === 0) return undefined;

  if (sortOrder === 'asc') {
    return data[0]?.id;
  } else {
    return data[data.length - 1]?.id;
  }
}

/**
 * Convert offset-based pagination to cursor-based
 */
export function offsetToCursor<T extends { id: string }>(
  data: T[],
  page: number,
  limit: number,
  sortOrder: 'asc' | 'desc'
): { nextCursor?: string; previousCursor?: string } {
  if (data.length === 0) {
    return {};
  }

  const nextCursor = getNextCursor(data, sortOrder);
  const previousCursor = getPreviousCursor(data, sortOrder);

  return {
    nextCursor: data.length === limit ? nextCursor : undefined,
    previousCursor: page > 1 ? previousCursor : undefined,
  };
}

/**
 * Build search filters for specific fields
 */
export function buildSearchFilters(
  searchTerm: string,
  fields: string[],
  mode: 'contains' | 'startsWith' | 'endsWith' = 'contains'
): any {
  if (!searchTerm || fields.length === 0) {
    return {};
  }

  return {
    OR: fields.map(field => ({
      [field]: {
        [mode]: searchTerm,
        mode: 'insensitive' as const,
      },
    })),
  };
}

/**
 * Build date range filters
 */
export function buildDateRangeFilters(
  startDate?: string,
  endDate?: string,
  field: string = 'createdAt'
): any {
  const filters: any = {};

  if (startDate) {
    filters[field] = {
      ...filters[field],
      gte: new Date(startDate),
    };
  }

  if (endDate) {
    filters[field] = {
      ...filters[field],
      lte: new Date(endDate),
    };
  }

  return Object.keys(filters).length > 0 ? filters : {};
}

/**
 * Build boolean filters
 */
export function buildBooleanFilters(
  filters: Record<string, boolean | undefined>
): any {
  const result: any = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      result[key] = value;
    }
  });

  return result;
}

/**
 * Build array filters (IN clause)
 */
export function buildArrayFilters(
  filters: Record<string, string[] | undefined>
): any {
  const result: any = {};

  Object.entries(filters).forEach(([key, values]) => {
    if (values && values.length > 0) {
      result[key] = {
        in: values,
      };
    }
  });

  return result;
}
