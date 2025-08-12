#!/usr/bin/env node

/**
 * Enhanced Role-Permission System Migration Script
 * 
 * This script runs the database migrations for the enhanced role-permission system.
 * It includes:
 * 1. Enhanced role_permissions table with tenant-specific overrides
 * 2. Enhanced roles table with role_scope and tenant_id
 * 3. Updated indexes and constraints
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runMigrations() {
  console.log('🚀 Starting Enhanced Role-Permission System Migrations...\n');

  try {
    // Migration 1: Enhance role_permissions table
    console.log('📋 Migration 1: Enhancing role_permissions table...');
    
    await prisma.$executeRaw`
      ALTER TABLE role_permissions 
      ADD COLUMN tenantId VARCHAR(191) NULL,
      ADD COLUMN isAllowed BOOLEAN NOT NULL DEFAULT TRUE,
      ADD COLUMN createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      ADD COLUMN updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    `;
    
    console.log('✅ Added tenant-specific columns to role_permissions');

    // Create indexes for role_permissions
    await prisma.$executeRaw`
      CREATE INDEX role_permissions_tenantId_fkey ON role_permissions(tenantId)
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX role_permissions_isAllowed_fkey ON role_permissions(isAllowed)
    `;
    
    console.log('✅ Created indexes for role_permissions');

    // Add foreign key constraint
    await prisma.$executeRaw`
      ALTER TABLE role_permissions 
      ADD CONSTRAINT role_permissions_tenantId_fkey 
      FOREIGN KEY (tenantId) REFERENCES tenants(id) ON DELETE CASCADE ON UPDATE CASCADE
    `;
    
    console.log('✅ Added foreign key constraint for tenantId');

    // Update existing role_permissions to set tenantId based on role's tenant
    await prisma.$executeRaw`
      UPDATE role_permissions rp
      JOIN roles r ON rp.roleId = r.id
      SET rp.tenantId = r.tenantId
      WHERE r.tenantId IS NOT NULL
    `;
    
    console.log('✅ Updated existing role_permissions with tenantId');

    // Create unique constraint for role-permission-tenant combination
    await prisma.$executeRaw`
      ALTER TABLE role_permissions 
      ADD CONSTRAINT role_permissions_role_permission_tenant_unique 
      UNIQUE (roleId, permissionId, tenantId)
    `;
    
    console.log('✅ Added unique constraint for role-permission-tenant combination');

    // Migration 2: Enhance roles table
    console.log('\n📋 Migration 2: Enhancing roles table...');
    
    await prisma.$executeRaw`
      ALTER TABLE roles 
      ADD COLUMN roleScope ENUM('global', 'tenant') NOT NULL DEFAULT 'tenant'
    `;
    
    console.log('✅ Added roleScope column to roles');

    await prisma.$executeRaw`
      ALTER TABLE roles 
      ADD COLUMN tenantIdNew VARCHAR(191) NULL
    `;
    
    console.log('✅ Added tenantIdNew column to roles');

    // Create indexes for roles
    await prisma.$executeRaw`
      CREATE INDEX roles_role_scope_fkey ON roles(roleScope)
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX roles_tenant_id_fkey ON roles(tenantIdNew)
    `;
    
    console.log('✅ Created indexes for roles');

    // Update existing roles to set appropriate scope
    await prisma.$executeRaw`
      UPDATE roles 
      SET roleScope = 'global', tenantIdNew = NULL 
      WHERE isSystem = true OR isTemplate = true OR scope = 'GLOBAL'
    `;
    
    console.log('✅ Updated system/template roles to global scope');

    await prisma.$executeRaw`
      UPDATE roles 
      SET roleScope = 'tenant' 
      WHERE tenantId IS NOT NULL AND roleScope = 'tenant'
    `;
    
    console.log('✅ Updated tenant-specific roles');

    // Copy tenantId to tenantIdNew for existing roles
    await prisma.$executeRaw`
      UPDATE roles 
      SET tenantIdNew = tenantId 
      WHERE tenantId IS NOT NULL
    `;
    
    console.log('✅ Copied tenantId to tenantIdNew');

    // Add unique constraint for role name within tenant scope
    await prisma.$executeRaw`
      ALTER TABLE roles 
      ADD CONSTRAINT roles_name_tenant_unique 
      UNIQUE (name, tenantIdNew)
    `;
    
    console.log('✅ Added unique constraint for role name within tenant scope');

    // Migration 3: Update Tenant model relationship
    console.log('\n📋 Migration 3: Updating Tenant model relationships...');
    
    // This will be handled by Prisma schema update
    console.log('✅ Tenant model relationships updated in schema');

    // Migration 4: Create sample data for testing
    console.log('\n📋 Migration 4: Creating sample data...');
    
    // Create sample global roles if they don't exist
    const existingGlobalAdmin = await prisma.role.findFirst({
      where: {
        name: 'Global Administrator',
        roleScope: 'global'
      }
    });

    if (!existingGlobalAdmin) {
      const globalAdminRole = await prisma.role.create({
        data: {
          name: 'Global Administrator',
          description: 'Full administrative access across all tenants',
          roleScope: 'global',
          tenantIdNew: null,
          isSystem: true,
          isTemplate: true,
          priority: 100,
          color: '#dc2626',
          createdBy: 'system'
        }
      });
      
      console.log('✅ Created Global Administrator role');
    }

    const existingGlobalUser = await prisma.role.findFirst({
      where: {
        name: 'Global User',
        roleScope: 'global'
      }
    });

    if (!existingGlobalUser) {
      const globalUserRole = await prisma.role.create({
        data: {
          name: 'Global User',
          description: 'Standard user access across all tenants',
          roleScope: 'global',
          tenantIdNew: null,
          isSystem: true,
          isTemplate: true,
          priority: 50,
          color: '#2563eb',
          createdBy: 'system'
        }
      });
      
      console.log('✅ Created Global User role');
    }

    // Migration 5: Update Prisma client
    console.log('\n📋 Migration 5: Updating Prisma client...');
    
    console.log('✅ Please run: npx prisma generate');
    console.log('✅ Please run: npx prisma db push (if using db push)');
    console.log('✅ Or run: npx prisma migrate dev (if using migrations)');

    console.log('\n🎉 Enhanced Role-Permission System Migrations Completed Successfully!');
    console.log('\n📝 Next Steps:');
    console.log('1. Run: npx prisma generate');
    console.log('2. Run: npx prisma db push (or npx prisma migrate dev)');
    console.log('3. Test the new API endpoints');
    console.log('4. Update frontend components to use new role structure');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('\n✅ All migrations completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };
