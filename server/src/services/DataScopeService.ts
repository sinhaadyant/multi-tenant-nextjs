import { permissionService } from './PermissionService';
import { logger } from '../config/logger';

// TypeScript interfaces for scope filters
export interface ScopeWhereClause {
  userId?: string;
  tenantId?: string;
  [key: string]: any;
}

export interface DataScopeFilter {
  scope: 'all' | 'tenant' | 'own';
  tenantId?: string;
  userId?: string;
}

export interface TableConfig {
  hasUserId: boolean;
  hasTenantId: boolean;
  userIdField?: string;
  tenantIdField?: string;
}

// Default table configurations
const TABLE_CONFIGS: { [tableName: string]: TableConfig } = {
  users: {
    hasUserId: true,
    hasTenantId: true,
    userIdField: 'id',
    tenantIdField: 'tenantId',
  },
  roles: { hasUserId: false, hasTenantId: true, tenantIdField: 'tenantId' },
  modules: { hasUserId: false, hasTenantId: false },
  submodules: { hasUserId: false, hasTenantId: false },
  role_permissions: { hasUserId: false, hasTenantId: false },
  user_roles: { hasUserId: true, hasTenantId: false, userIdField: 'userId' },
  support_tickets: {
    hasUserId: true,
    hasTenantId: true,
    userIdField: 'userId',
    tenantIdField: 'tenantId',
  },
  support_replies: {
    hasUserId: true,
    hasTenantId: false,
    userIdField: 'userId',
  },
  audit_logs: {
    hasUserId: true,
    hasTenantId: true,
    userIdField: 'userId',
    tenantIdField: 'tenantId',
  },
  refresh_tokens: {
    hasUserId: true,
    hasTenantId: false,
    userIdField: 'userId',
  },
  reset_tokens: { hasUserId: true, hasTenantId: false, userIdField: 'userId' },
  login_devices: { hasUserId: true, hasTenantId: false, userIdField: 'userId' },
};

export class DataScopeService {
  private static instance: DataScopeService;

  private constructor() {}

  public static getInstance(): DataScopeService {
    if (!DataScopeService.instance) {
      DataScopeService.instance = new DataScopeService();
    }
    return DataScopeService.instance;
  }

  /**
   * Apply data scope filter to a Prisma query
   */
  async applyDataScopeFilter<T>(
    query: any,
    userId: string,
    moduleKey: string,
    tableName?: string
  ): Promise<T> {
    try {
      const dataScope = await permissionService.getDataScope(userId, moduleKey);
      const whereClause = this.getScopeWhereClause(dataScope, tableName);

      // Apply the where clause to the query
      if (Object.keys(whereClause).length > 0) {
        query.where = { ...query.where, ...whereClause };
      }

      return query;
    } catch (error) {
      logger.error(
        `Error applying data scope filter: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      // Fail secure - apply most restrictive filter
      const restrictiveScope: DataScopeFilter = { scope: 'own', userId };
      const whereClause = this.getScopeWhereClause(restrictiveScope, tableName);

      if (Object.keys(whereClause).length > 0) {
        query.where = { ...query.where, ...whereClause };
      }

      return query;
    }
  }

  /**
   * Get scope where clause for a given data scope and table
   */
  getScopeWhereClause(
    dataScope: DataScopeFilter,
    tableName?: string
  ): ScopeWhereClause {
    const whereClause: ScopeWhereClause = {};

    // If no table name provided, return basic scope
    if (!tableName) {
      switch (dataScope.scope) {
        case 'all':
          return {}; // No filters for superadmin
        case 'tenant':
          if (dataScope.tenantId) {
            whereClause.tenantId = dataScope.tenantId;
          }
          break;
        case 'own':
          if (dataScope.userId) {
            whereClause.userId = dataScope.userId;
          }
          if (dataScope.tenantId) {
            whereClause.tenantId = dataScope.tenantId;
          }
          break;
      }
      return whereClause;
    }

    // Get table configuration
    const tableConfig = TABLE_CONFIGS[tableName] || {
      hasUserId: false,
      hasTenantId: false,
    };

    switch (dataScope.scope) {
      case 'all':
        // No filters for superadmin
        return {};

      case 'tenant':
        if (dataScope.tenantId && tableConfig.hasTenantId) {
          const tenantField = tableConfig.tenantIdField || 'tenantId';
          whereClause[tenantField] = dataScope.tenantId;
        }
        break;

      case 'own':
        if (dataScope.userId && tableConfig.hasUserId) {
          const userField = tableConfig.userIdField || 'userId';
          whereClause[userField] = dataScope.userId;
        }
        if (dataScope.tenantId && tableConfig.hasTenantId) {
          const tenantField = tableConfig.tenantIdField || 'tenantId';
          whereClause[tenantField] = dataScope.tenantId;
        }
        break;
    }

    return whereClause;
  }

  /**
   * Apply data scope filter to raw SQL queries
   */
  applyDataScopeToSQL(
    sql: string,
    dataScope: DataScopeFilter,
    tableName: string,
    params: any[] = []
  ): { sql: string; params: any[] } {
    const tableConfig = TABLE_CONFIGS[tableName];
    if (!tableConfig) {
      logger.warn(`No table configuration found for ${tableName}`);
      return { sql, params };
    }

    let modifiedSQL = sql;
    let modifiedParams = [...params];

    switch (dataScope.scope) {
      case 'all':
        // No modifications needed for superadmin
        return { sql: modifiedSQL, params: modifiedParams };

      case 'tenant':
        if (dataScope.tenantId && tableConfig.hasTenantId) {
          const tenantField = tableConfig.tenantIdField || 'tenant_id';
          modifiedSQL += ` AND ${tableName}.${tenantField} = ?`;
          modifiedParams.push(dataScope.tenantId);
        }
        break;

      case 'own':
        if (dataScope.userId && tableConfig.hasUserId) {
          const userField = tableConfig.userIdField || 'user_id';
          modifiedSQL += ` AND ${tableName}.${userField} = ?`;
          modifiedParams.push(dataScope.userId);
        }
        if (dataScope.tenantId && tableConfig.hasTenantId) {
          const tenantField = tableConfig.tenantIdField || 'tenant_id';
          modifiedSQL += ` AND ${tableName}.${tenantField} = ?`;
          modifiedParams.push(dataScope.tenantId);
        }
        break;
    }

    return { sql: modifiedSQL, params: modifiedParams };
  }

  /**
   * Validate if user can access a specific record
   */
  async validateDataAccess(
    userId: string,
    record: any,
    moduleKey: string,
    tableName?: string
  ): Promise<boolean> {
    try {
      const dataScope = await permissionService.getDataScope(userId, moduleKey);

      // Superadmin can access all records
      if (dataScope.scope === 'all') {
        return true;
      }

      if (!tableName) {
        // Basic validation without table context
        if (dataScope.scope === 'tenant') {
          return record.tenantId === dataScope.tenantId;
        }
        if (dataScope.scope === 'own') {
          return record.userId === dataScope.userId;
        }
        return false;
      }

      const tableConfig = TABLE_CONFIGS[tableName];
      if (!tableConfig) {
        logger.warn(`No table configuration found for ${tableName}`);
        return false;
      }

      // Check tenant access
      if (dataScope.tenantId && tableConfig.hasTenantId) {
        const tenantField = tableConfig.tenantIdField || 'tenantId';
        if (record[tenantField] !== dataScope.tenantId) {
          return false;
        }
      }

      // Check user access
      if (
        dataScope.scope === 'own' &&
        dataScope.userId &&
        tableConfig.hasUserId
      ) {
        const userField = tableConfig.userIdField || 'userId';
        if (record[userField] !== dataScope.userId) {
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error(
        `Error validating data access: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return false; // Fail secure
    }
  }

  /**
   * Bulk validate data access for multiple records
   */
  async validateBulkDataAccess(
    userId: string,
    records: any[],
    moduleKey: string,
    tableName?: string
  ): Promise<{ valid: boolean[]; validRecords: any[]; invalidRecords: any[] }> {
    const valid: boolean[] = [];
    const validRecords: any[] = [];
    const invalidRecords: any[] = [];

    for (const record of records) {
      const isValid = await this.validateDataAccess(
        userId,
        record,
        moduleKey,
        tableName
      );
      valid.push(isValid);

      if (isValid) {
        validRecords.push(record);
      } else {
        invalidRecords.push(record);
      }
    }

    return { valid, validRecords, invalidRecords };
  }

  /**
   * Get filtered records with data scope applied
   */
  async getFilteredRecords<T>(
    model: any,
    userId: string,
    moduleKey: string,
    tableName: string,
    additionalFilters: any = {}
  ): Promise<T[]> {
    try {
      const dataScope = await permissionService.getDataScope(userId, moduleKey);
      const whereClause = this.getScopeWhereClause(dataScope, tableName);

      // Merge with additional filters
      const finalWhere = { ...whereClause, ...additionalFilters };

      return await model.findMany({ where: finalWhere });
    } catch (error) {
      logger.error(
        `Error getting filtered records: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return []; // Return empty array on error
    }
  }

  /**
   * Count records with data scope applied
   */
  async countFilteredRecords(
    model: any,
    userId: string,
    moduleKey: string,
    tableName: string,
    additionalFilters: any = {}
  ): Promise<number> {
    try {
      const dataScope = await permissionService.getDataScope(userId, moduleKey);
      const whereClause = this.getScopeWhereClause(dataScope, tableName);

      // Merge with additional filters
      const finalWhere = { ...whereClause, ...additionalFilters };

      return await model.count({ where: finalWhere });
    } catch (error) {
      logger.error(
        `Error counting filtered records: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return 0; // Return 0 on error
    }
  }

  /**
   * Apply data scope to complex queries with joins
   */
  async applyDataScopeToComplexQuery(
    query: any,
    userId: string,
    moduleKey: string,
    mainTable: string,
    joinTables: string[] = []
  ): Promise<any> {
    try {
      const dataScope = await permissionService.getDataScope(userId, moduleKey);
      const mainTableWhere = this.getScopeWhereClause(dataScope, mainTable);

      // Apply filters to main table
      if (Object.keys(mainTableWhere).length > 0) {
        query.where = { ...query.where, ...mainTableWhere };
      }

      // Apply filters to join tables if they have relevant fields
      for (const joinTable of joinTables) {
        const joinTableWhere = this.getScopeWhereClause(dataScope, joinTable);
        if (Object.keys(joinTableWhere).length > 0) {
          // Add join table filters to the query
          // This is a simplified approach - in practice, you might need more complex join logic
          query.where = { ...query.where, [joinTable]: joinTableWhere };
        }
      }

      return query;
    } catch (error) {
      logger.error(
        `Error applying data scope to complex query: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return query; // Return original query on error
    }
  }

  /**
   * Register custom table configuration
   */
  registerTableConfig(tableName: string, config: TableConfig): void {
    TABLE_CONFIGS[tableName] = config;
    logger.debug(`Registered table configuration for ${tableName}`);
  }

  /**
   * Get table configuration
   */
  getTableConfig(tableName: string): TableConfig | undefined {
    return TABLE_CONFIGS[tableName];
  }

  /**
   * Get all registered table configurations
   */
  getAllTableConfigs(): { [tableName: string]: TableConfig } {
    return { ...TABLE_CONFIGS };
  }

  /**
   * Clear table configurations (useful for testing)
   */
  clearTableConfigs(): void {
    Object.keys(TABLE_CONFIGS).forEach(key => {
      delete TABLE_CONFIGS[key];
    });
    logger.debug('Cleared all table configurations');
  }
}

// Export singleton instance
export const dataScopeService = DataScopeService.getInstance();
