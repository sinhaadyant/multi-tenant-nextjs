import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { logger } from '@/config/logger';
import { AuthenticatedUser } from '@/middleware/auth';
import { permissionGuard } from '@/middleware/permissionGuard';
import { dataScopeService } from '@/services/DataScopeService';

const prisma = new PrismaClient();

// Search schemas
const searchQuerySchema = z.object({
  q: z.string().min(1).max(100),
  entity: z
    .enum(['users', 'roles', 'tenants', 'support_tickets', 'audit_logs'])
    .optional(),
  filters: z.record(z.string(), z.any()).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const advancedSearchSchema = z.object({
  queries: z.array(
    z.object({
      entity: z.enum([
        'users',
        'roles',
        'tenants',
        'support_tickets',
        'audit_logs',
      ]),
      query: z.string(),
      filters: z.record(z.string(), z.any()).optional(),
    })
  ),
  globalFilters: z.record(z.string(), z.any()).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

const saveSearchSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  query: z.record(z.string(), z.any()),
  isPublic: z.boolean().default(false),
});

export class SearchController {
  /**
   * Global search across all entities
   */
  static globalSearch = async (req: Request, res: Response) => {
    try {
      const user = req.user as AuthenticatedUser;
      const validatedData = searchQuerySchema.parse(req.query);

      const { q, entity, filters, page, limit, sortBy, sortOrder } =
        validatedData;
      const offset = (page - 1) * limit;

      let results: any[] = [];
      let total = 0;

      if (entity) {
        // Search specific entity
        const entityResults = await SearchController.searchEntity(
          entity,
          q,
          filters,
          user,
          offset,
          limit,
          sortBy,
          sortOrder
        );
        results = entityResults.results;
        total = entityResults.total;
      } else {
        // Search across all entities
        const searchPromises = [
          SearchController.searchEntity(
            'users',
            q,
            filters,
            user,
            0,
            limit / 4,
            sortBy,
            sortOrder
          ),
          SearchController.searchEntity(
            'roles',
            q,
            filters,
            user,
            0,
            limit / 4,
            sortBy,
            sortOrder
          ),
          SearchController.searchEntity(
            'support_tickets',
            q,
            filters,
            user,
            0,
            limit / 4,
            sortBy,
            sortOrder
          ),
          SearchController.searchEntity(
            'audit_logs',
            q,
            filters,
            user,
            0,
            limit / 4,
            sortBy,
            sortOrder
          ),
        ];

        const searchResults = await Promise.all(searchPromises);

        // Combine and sort results by relevance
        results = searchResults.flatMap(result => result.results);
        total = searchResults.reduce((sum, result) => sum + result.total, 0);

        // Sort by relevance score and limit
        results = results
          .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
          .slice(0, limit);
      }

      // Log search activity
      await prisma?.auditLog?.create({
        data: {
          userId: user?.id,
          tenantId: user?.tenantId,
          action: 'SEARCH',
          details: {
            query: q,
            entity,
            resultsCount: results.length,
            filters,
          },
          ipAddress: req.ip,
        },
      });

      res.json({
        success: true,
        message: 'Search completed successfully',
        data: {
          results,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('Global search error:', error);
      res.status(500).json({
        success: false,
        message: 'Search failed',
        errors: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Advanced search with complex filter combinations
   */
  static advancedSearch = async (req: Request, res: Response) => {
    try {
      const user = req.user as AuthenticatedUser;
      const validatedData = advancedSearchSchema.parse(req.body);

      const { queries, globalFilters, page, limit } = validatedData;
      const offset = (page - 1) * limit;

      const searchPromises = queries.map(async ({ entity, query, filters }) => {
        const entityFilters = { ...filters, ...globalFilters };
        return SearchController.searchEntity(
          entity,
          query,
          entityFilters,
          user,
          offset,
          limit,
          undefined,
          'desc'
        );
      });

      const searchResults = await Promise.all(searchPromises);

      // Combine results
      const results = searchResults.flatMap(result => result.results);
      const total = searchResults.reduce(
        (sum, result) => sum + result.total,
        0
      );

      // Group by entity
      const groupedResults = results.reduce(
        (acc, result) => {
          if (!acc[result.entity]) {
            acc[result.entity] = [];
          }
          acc[result.entity].push(result);
          return acc;
        },
        {} as Record<string, any[]>
      );

      res.json({
        success: true,
        message: 'Advanced search completed successfully',
        data: {
          results: groupedResults,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('Advanced search error:', error);
      res.status(500).json({
        success: false,
        message: 'Advanced search failed',
        errors: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Get search suggestions and autocomplete
   */
  static getSuggestions = async (req: Request, res: Response) => {
    try {
      const user = req.user as AuthenticatedUser;
      const { q, entity } = req.query;

      if (!q || typeof q !== 'string') {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const suggestions: any[] = [];

      // Get suggestions based on entity or all entities
      const entities = entity
        ? [entity as string]
        : ['users', 'roles', 'support_tickets'];

      for (const ent of entities) {
        const entitySuggestions = await SearchController.getEntitySuggestions(
          ent,
          q,
          user
        );
        suggestions.push(...entitySuggestions);
      }

      // Sort by relevance and limit
      const sortedSuggestions = suggestions
        .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
        .slice(0, 10);

      res.json({
        success: true,
        message: 'Suggestions retrieved successfully',
        data: sortedSuggestions,
      });
    } catch (error) {
      logger.error('Get suggestions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get suggestions',
        errors: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Save search query for user
   */
  static saveSearch = async (req: Request, res: Response) => {
    try {
      const user = req.user as AuthenticatedUser;
      const validatedData = saveSearchSchema.parse(req.body);

      // Note: This would require a saved_searches table in the database
      // For now, we'll return a success response

      // Log the saved search
      await prisma?.auditLog?.create({
        data: {
          userId: user?.id,
          tenantId: user?.tenantId,
          action: 'SAVE_SEARCH',
          details: {
            searchName: validatedData.name,
            searchQuery: validatedData.query,
            isPublic: validatedData.isPublic,
          },
          ipAddress: req.ip,
        },
      });

      res.json({
        success: true,
        message: 'Search saved successfully',
        data: {
          id: `search_${Date.now()}`,
          name: validatedData.name,
          description: validatedData.description,
          isPublic: validatedData.isPublic,
        },
      });
    } catch (error) {
      logger.error('Save search error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save search',
        errors: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Get saved searches for user
   */
  static getSavedSearches = async (req: Request, res: Response) => {
    try {
      // const user = req.user as AuthenticatedUser;
      const { page = 1, limit = 20 } = req.query;

      // Note: This would require a saved_searches table in the database
      // For now, we'll return mock data

      const savedSearches = [
        {
          id: 'search_1',
          name: 'Recent Users',
          description: 'Users created in the last 30 days',
          query: {
            entity: 'users',
            filters: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            },
          },
          isPublic: false,
          createdAt: new Date(),
        },
      ];

      return res.json({
        success: true,
        message: 'Saved searches retrieved successfully',
        data: {
          searches: savedSearches,
          page: Number(page),
          limit: Number(limit),
          total: savedSearches.length,
        },
      });
    } catch (error) {
      logger.error('Get saved searches error:', error);
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }
  };

  /**
   * Get search analytics
   */
  static getSearchAnalytics = async (req: Request, res: Response) => {
    try {
      const user = req.user as AuthenticatedUser;

      // Get search statistics from audit logs
      const searchStats = await prisma?.auditLog?.groupBy({
        by: ['action'],
        where: {
          action: 'SEARCH',
          userId: user?.isSuperadmin ? undefined : user?.id,
          tenantId: user?.isSuperadmin ? undefined : user?.tenantId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        _count: {
          id: true,
        },
      });

      // Get popular search terms
      const popularSearches = await prisma?.auditLog?.findMany({
        where: {
          action: 'SEARCH',
          userId: user?.isSuperadmin ? undefined : user?.id,
          tenantId: user?.isSuperadmin ? undefined : user?.tenantId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        select: {
          details: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      });

      const analytics = {
        totalSearches:
          searchStats.find(s => s.action === 'SEARCH')?._count.id || 0,
        popularSearches: popularSearches.map(s => s.details),
        searchTrends: {
          daily: [],
          weekly: [],
        },
      };

      res.json({
        success: true,
        message: 'Search analytics retrieved successfully',
        data: analytics,
      });
    } catch (error) {
      logger.error('Get search analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get search analytics',
        errors: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Helper method to search specific entity
   */
  private static async searchEntity(
    entity: string,
    query: string,
    filters: any,
    user: AuthenticatedUser,
    offset: number,
    limit: number,
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'desc'
  ) {
    const searchConfig = {
      users: {
        model: prisma.user,
        searchFields: ['name', 'email'],
        include: { tenant: true, userRoles: { include: { role: true } } },
      },
      roles: {
        model: prisma.role,
        searchFields: ['name', 'description'],
        include: { tenant: true },
      },
      support_tickets: {
        model: prisma.supportTicket,
        searchFields: ['title', 'description'],
        include: { user: true, tenant: true },
      },
      audit_logs: {
        model: prisma.auditLog,
        searchFields: ['action'],
        include: { user: true, tenant: true },
      },
    };

    const config = searchConfig[entity as keyof typeof searchConfig];
    if (!config) {
      return { results: [], total: 0 };
    }

    // Build search conditions
    const searchConditions = config?.searchFields?.map(field => ({
      [field]: {
        contains: query,
        mode: 'insensitive' as const,
      },
    }));

    // Apply data scope
    const baseQuery = {
      where: {
        OR: searchConditions,
        ...filters,
      },
      include: config.include,
      skip: offset,
      take: limit,
      orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: sortOrder },
    };

    const scopedQuery = await dataScopeService.applyDataScopeFilter(
      baseQuery,
      user?.id,
      entity,
      entity
    );

    const [results, total] = await Promise.all([
      (config?.model as any).findMany(scopedQuery),
      (config?.model as any).count({ where: (scopedQuery as any).where }),
    ]);

    // Add relevance scoring
    const scoredResults = results.map((result: any) => ({
      ...result,
      entity,
      relevanceScore: SearchController.calculateRelevanceScore(
        result,
        query,
        config.searchFields
      ),
    }));

    return { results: scoredResults, total };
  }

  /**
   * Helper method to get entity suggestions
   */
  private static async getEntitySuggestions(
    entity: string,
    query: string,
    _user: AuthenticatedUser
  ) {
    const suggestions: any[] = [];

    try {
      const config = {
        users: {
          model: prisma.user,
          searchFields: ['name', 'email'],
          displayField: 'name',
        },
        roles: {
          model: prisma.role,
          searchFields: ['name'],
          displayField: 'name',
        },
        support_tickets: {
          model: prisma.supportTicket,
          searchFields: ['title'],
          displayField: 'title',
        },
      }[entity];

      if (!config) return suggestions;

      const results = await (config?.model as any).findMany({
        where: {
          OR: config?.searchFields?.map(field => ({
            [field]: {
              contains: query,
              mode: 'insensitive' as const,
            },
          })),
        },
        select: {
          id: true,
          [config.displayField]: true,
        },
        take: 5,
      });

      suggestions.push(
        ...results.map((result: any) => ({
          id: result.id,
          text: result[config.displayField as keyof typeof result],
          entity,
          type: 'suggestion',
        }))
      );
    } catch (error) {
      logger.error(`Error getting suggestions for ${entity}:`, error);
    }

    return suggestions;
  }

  /**
   * Helper method to calculate relevance score
   */
  private static calculateRelevanceScore(
    result: any,
    query: string,
    searchFields: string[]
  ): number {
    let score = 0;
    const queryLower = query.toLowerCase();

    for (const field of searchFields) {
      const value = result[field];
      if (value) {
        const valueLower = value.toLowerCase();

        // Exact match gets highest score
        if (valueLower === queryLower) {
          score += 100;
        }
        // Starts with query gets high score
        else if (valueLower.startsWith(queryLower)) {
          score += 50;
        }
        // Contains query gets medium score
        else if (valueLower.includes(queryLower)) {
          score += 25;
        }
        // Partial word match gets low score
        else if (
          queryLower.split(' ').some(word => valueLower.includes(word))
        ) {
          score += 10;
        }
      }
    }

    return score;
  }
}

// Export middleware-wrapped methods
export const globalSearch = [
  permissionGuard({ moduleKey: 'search', action: 'read' }),
  SearchController.globalSearch,
];

export const advancedSearch = [
  permissionGuard({ moduleKey: 'search', action: 'read' }),
  SearchController.advancedSearch,
];

export const getSuggestions = [SearchController.getSuggestions];

export const saveSearch = [
  permissionGuard({ moduleKey: 'search', action: 'create' }),
  SearchController.saveSearch,
];

export const getSavedSearches = [
  permissionGuard({ moduleKey: 'search', action: 'read' }),
  SearchController.getSavedSearches,
];

export const getSearchAnalytics = [
  permissionGuard({ moduleKey: 'search', action: 'read' }),
  SearchController.getSearchAnalytics,
];
