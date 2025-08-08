// Database Index Optimization Recommendations
// These are the recommended indexes to add to your Prisma schema for better performance

export const RECOMMENDED_INDEXES = `
// Add these indexes to your Prisma schema for better API performance

// User table indexes
model User {
  // ... existing fields ...
  
  @@index([email])
  @@index([tenantId])
  @@index([roleId])
  @@index([isActive])
  @@index([createdAt])
  @@index([lastLogin])
  @@index([tenantId, isActive])
  @@index([createdAt, isActive])
}

// Tenant table indexes
model Tenant {
  // ... existing fields ...
  
  @@index([slug])
  @@index([domain])
  @@index([isActive])
  @@index([plan])
  @@index([createdAt])
  @@index([isActive, plan])
  @@index([createdAt, isActive])
}

// AuditLog table indexes
model AuditLog {
  // ... existing fields ...
  
  @@index([tenantId])
  @@index([userId])
  @@index([superAdminId])
  @@index([action])
  @@index([createdAt])
  @@index([tenantId, createdAt])
  @@index([action, createdAt])
}

// Role table indexes
model Role {
  // ... existing fields ...
  
  @@index([name])
  @@index([isActive])
  @@index([tenantId])
}

// SupportTicket table indexes
model SupportTicket {
  // ... existing fields ...
  
  @@index([tenantId])
  @@index([userId])
  @@index([status])
  @@index([priority])
  @@index([createdAt])
  @@index([tenantId, status])
  @@index([status, createdAt])
}

// Notification table indexes
model Notification {
  // ... existing fields ...
  
  @@index([tenantId])
  @@index([userId])
  @@index([isRead])
  @@index([createdAt])
  @@index([tenantId, isRead])
  @@index([isRead, createdAt])
}
`;

// Query optimization tips
export const QUERY_OPTIMIZATION_TIPS = {
  // Use select to fetch only needed fields
  selectOnlyNeededFields: `
    // Instead of:
    const users = await prisma.user.findMany({
      include: { tenant: true, role: true }
    });
    
    // Use:
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        tenant: { select: { name: true, slug: true } },
        role: { select: { name: true } }
      }
    });
  `,
  
  // Use cursor-based pagination for large datasets
  cursorPagination: `
    // Instead of offset pagination:
    const users = await prisma.user.findMany({
      skip: 1000,
      take: 10
    });
    
    // Use cursor pagination:
    const users = await prisma.user.findMany({
      take: 10,
      cursor: { id: lastUserId },
      orderBy: { id: 'asc' }
    });
  `,
  
  // Batch operations
  batchOperations: `
    // Instead of multiple queries:
    const user1 = await prisma.user.findUnique({ where: { id: '1' } });
    const user2 = await prisma.user.findUnique({ where: { id: '2' } });
    const user3 = await prisma.user.findUnique({ where: { id: '3' } });
    
    // Use Promise.all:
    const [user1, user2, user3] = await Promise.all([
      prisma.user.findUnique({ where: { id: '1' } }),
      prisma.user.findUnique({ where: { id: '2' } }),
      prisma.user.findUnique({ where: { id: '3' } })
    ]);
  `,
  
  // Use raw queries for complex aggregations
  rawQueries: `
    // For complex aggregations, consider raw SQL:
    const stats = await prisma.$queryRaw\`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recent
      FROM users
      WHERE tenant_id = \${tenantId}
    \`;
  `
};

// Performance monitoring queries
export const PERFORMANCE_MONITORING = {
  // Check slow queries
  slowQueries: `
    -- PostgreSQL slow query log
    SELECT 
      query,
      calls,
      total_time,
      mean_time,
      rows
    FROM pg_stat_statements
    ORDER BY mean_time DESC
    LIMIT 10;
  `,
  
  // Check index usage
  indexUsage: `
    -- Check index usage statistics
    SELECT 
      schemaname,
      tablename,
      indexname,
      idx_scan,
      idx_tup_read,
      idx_tup_fetch
    FROM pg_stat_user_indexes
    ORDER BY idx_scan DESC;
  `,
  
  // Check table statistics
  tableStats: `
    -- Check table statistics
    SELECT 
      schemaname,
      tablename,
      n_tup_ins,
      n_tup_upd,
      n_tup_del,
      n_live_tup,
      n_dead_tup
    FROM pg_stat_user_tables
    ORDER BY n_live_tup DESC;
  `
};

// Connection pool optimization
export const CONNECTION_POOL_CONFIG = {
  // Recommended connection pool settings
  recommended: {
    min: 2,
    max: 10,
    idleTimeoutMillis: 30000,
    acquireTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    createRetryIntervalMillis: 200
  },
  
  // High traffic settings
  highTraffic: {
    min: 5,
    max: 20,
    idleTimeoutMillis: 60000,
    acquireTimeoutMillis: 60000,
    reapIntervalMillis: 1000,
    createTimeoutMillis: 60000,
    destroyTimeoutMillis: 5000,
    createRetryIntervalMillis: 100
  }
}; 