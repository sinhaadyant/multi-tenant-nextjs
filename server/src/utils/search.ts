import { z } from 'zod';

// Search query schema
export const searchQuerySchema = z.object({
  q: z.string().optional(),
  search: z.string().optional(),
  filters: z.record(z.string(), z.any()).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  fields: z.array(z.string()).optional(),
});

// Search options interface
export interface SearchOptions {
  query?: string;
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
  searchFields?: string[];
}

// Search result interface
export interface SearchResult<T> {
  data: T[];
  total: number;
  query?: string;
  filters?: Record<string, any>;
}

/**
 * Parse search query parameters
 */
export function parseSearchQuery(query: any): SearchOptions {
  const result = searchQuerySchema.safeParse(query);

  if (!result.success) {
    return {
      sortOrder: 'desc',
    };
  }

  const { q, search, filters, sortBy, sortOrder, fields } = result.data;

  return {
    query: q || search,
    filters,
    sortBy,
    sortOrder,
    searchFields: fields,
  };
}

/**
 * Build text search filters
 */
export function buildTextSearchFilters(
  query: string,
  fields: string[],
  options: {
    mode?: 'contains' | 'startsWith' | 'endsWith';
    caseSensitive?: boolean;
    fuzzy?: boolean;
  } = {}
): any {
  if (!query || fields.length === 0) {
    return {};
  }

  const { mode = 'contains', caseSensitive = false, fuzzy = false } = options;

  const searchConditions = fields.map(field => {
    const condition: any = {
      [field]: {
        [mode]: query,
        mode: caseSensitive ? undefined : 'insensitive',
      },
    };

    // Add fuzzy search if enabled
    if (fuzzy) {
      condition[field].mode = 'insensitive';
    }

    return condition;
  });

  return {
    OR: searchConditions,
  };
}

/**
 * Build advanced search filters with multiple criteria
 */
export function buildAdvancedSearchFilters(
  searchOptions: SearchOptions,
  defaultSearchFields: string[] = ['name', 'email', 'description']
): any {
  const { query, filters, searchFields } = searchOptions;

  const where: any = {
    ...filters,
  };

  // Add text search
  if (query) {
    const fields = searchFields || defaultSearchFields;
    const textSearch = buildTextSearchFilters(query, fields);

    if (Object.keys(textSearch).length > 0) {
      where.AND = where.AND || [];
      where.AND.push(textSearch);
    }
  }

  return where;
}

/**
 * Build sort options
 */
export function buildSortOptions(
  sortBy?: string,
  sortOrder: 'asc' | 'desc' = 'desc',
  defaultSortBy: string = 'createdAt'
): any {
  const orderBy: any = {};
  const field = sortBy || defaultSortBy;

  orderBy[field] = sortOrder;

  return orderBy;
}

/**
 * Build compound search filters
 */
export function buildCompoundSearchFilters(filters: Record<string, any>): any {
  const result: any = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          result[key] = { in: value };
        }
      } else if (typeof value === 'object') {
        result[key] = value;
      } else {
        result[key] = value;
      }
    }
  });

  return result;
}

/**
 * Build range filters for numeric fields
 */
export function buildRangeFilters(
  field: string,
  min?: number,
  max?: number
): any {
  const filter: any = {};

  if (min !== undefined) {
    filter[field] = { ...filter[field], gte: min };
  }

  if (max !== undefined) {
    filter[field] = { ...filter[field], lte: max };
  }

  return Object.keys(filter).length > 0 ? filter : {};
}

/**
 * Build date range filters
 */
export function buildDateRangeFilters(
  field: string,
  startDate?: string | Date,
  endDate?: string | Date
): any {
  const filter: any = {};

  if (startDate) {
    filter[field] = { ...filter[field], gte: new Date(startDate) };
  }

  if (endDate) {
    filter[field] = { ...filter[field], lte: new Date(endDate) };
  }

  return Object.keys(filter).length > 0 ? filter : {};
}

/**
 * Build boolean filters
 */
export function buildBooleanFilters(
  filters: Record<string, boolean | string>
): any {
  const result: any = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      // Convert string boolean to actual boolean
      if (typeof value === 'string') {
        if (value.toLowerCase() === 'true') {
          result[key] = true;
        } else if (value.toLowerCase() === 'false') {
          result[key] = false;
        }
      } else {
        result[key] = value;
      }
    }
  });

  return result;
}

/**
 * Build relation filters
 */
export function buildRelationFilters(
  relation: string,
  filters: Record<string, any>
): any {
  if (Object.keys(filters).length === 0) {
    return {};
  }

  return {
    [relation]: {
      some: filters,
    },
  };
}

/**
 * Build nested search filters
 */
export function buildNestedSearchFilters(
  path: string,
  filters: Record<string, any>
): any {
  const result: any = {};
  let current = result;

  const parts = path.split('.');
  const lastPart = parts.pop()!;

  // Navigate to the nested level
  for (const part of parts) {
    current[part] = {};
    current = current[part];
  }

  // Apply filters at the final level
  current[lastPart] = filters;

  return result;
}

/**
 * Combine multiple search filters
 */
export function combineSearchFilters(...filters: any[]): any {
  const combined: any = {};

  filters.forEach(filter => {
    if (filter && typeof filter === 'object') {
      Object.assign(combined, filter);
    }
  });

  return combined;
}

/**
 * Build search query for full-text search (if supported)
 */
export function buildFullTextSearch(
  query: string,
  fields: string[],
  options: {
    language?: string;
    mode?: 'natural' | 'boolean';
  } = {}
): any {
  if (!query || fields.length === 0) {
    return {};
  }

  const { language, mode = 'natural' } = options;

  // This is a placeholder for full-text search implementation
  // The actual implementation would depend on the database and ORM
  return {
    _text: {
      search: query,
      path: fields,
      queryType: mode,
      language,
    },
  };
}

/**
 * Validate search parameters
 */
export function validateSearchParams(params: any): {
  isValid: boolean;
  errors: string[];
  options?: SearchOptions;
} {
  const result = searchQuerySchema.safeParse(params);

  if (!result.success) {
    return {
      isValid: false,
      errors: result.error.issues.map(issue => issue.message),
    };
  }

  return {
    isValid: true,
    errors: [],
    options: parseSearchQuery(params),
  };
}

/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return '';

  // Remove special characters that could cause issues
  return query
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[&]/g, '&amp;') // Escape ampersands
    .substring(0, 100); // Limit length
}

/**
 * Build search suggestions query
 */
export function buildSearchSuggestions(
  query: string,
  fields: string[],
  limit: number = 5
): any {
  if (!query || fields.length === 0) {
    return {};
  }

  const sanitizedQuery = sanitizeSearchQuery(query);

  return {
    where: {
      OR: fields.map(field => ({
        [field]: {
          startsWith: sanitizedQuery,
          mode: 'insensitive',
        },
      })),
    },
    take: limit,
    orderBy: fields.map(field => ({ [field]: 'asc' })),
  };
}
