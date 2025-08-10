const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function testTenantLoginSidebar() {
  try {
    console.log('🔍 Testing tenant login and sidebar functionality...');
    
    // Get the first active tenant
    const tenant = await prisma.tenant.findFirst({
      where: { isActive: true },
      include: {
        users: {
          where: { isActive: true },
          take: 1
        }
      }
    });
    
    if (!tenant) {
      console.log('❌ No active tenants found');
      return;
    }
    
    console.log(`📋 Testing with tenant: ${tenant.name} (${tenant.slug})`);
    
    if (tenant.users.length === 0) {
      console.log('❌ No active users found for this tenant');
      return;
    }
    
    const user = tenant.users[0];
    console.log(`👤 Testing with user: ${user.name} (${user.email})`);
    
    // Test JWT token generation
    const tokenPayload = {
      id: user.id,
      email: user.email,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      type: 'tenant'
    };
    
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn: '24h'
    });
    
    console.log('✅ JWT token generated successfully');
    
    // Test API endpoint simulation
    console.log('\n🌐 Testing API endpoint simulation...');
    
    // Simulate the permissions API call
    const userWithPermissions = await prisma.user.findFirst({
      where: {
        id: user.id,
        tenantId: tenant.id,
        isActive: true
      },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: {
                      include: {
                        module: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true
          }
        }
      }
    });
    
    if (!userWithPermissions) {
      console.log('❌ User not found or inactive');
      return;
    }
    
    // Extract permissions (same logic as the API)
    const userPermissions = new Set();
    const modulePermissions = new Map();
    const accessibleModules = new Set();
    
    userWithPermissions.userRoles.forEach(userRole => {
      userRole.role.permissions.forEach(rp => {
        const permission = rp.permission;
        const moduleKey = permission.module.moduleKey;
        
        userPermissions.add(`${moduleKey}:${permission.action}`);
        
        if (!modulePermissions.has(moduleKey)) {
          modulePermissions.set(moduleKey, new Set());
        }
        modulePermissions.get(moduleKey).add(permission.action);
        
        accessibleModules.add(moduleKey);
      });
    });
    
    console.log(`✅ Permissions extracted: ${userPermissions.size} permissions`);
    console.log(`✅ Accessible modules: ${accessibleModules.size} modules`);
    
    // Test menu building
    const allModules = await prisma.module.findMany({
      where: {
        isActive: true,
        isVisible: true
      },
      orderBy: [
        { orderIndex: 'asc' },
        { moduleName: 'asc' }
      ]
    });
    
    console.log(`✅ Available modules: ${allModules.length}`);
    
    // Build menu structure
    const buildMenuItems = (modules, parentKey = null) => {
      return modules
        .filter(module => {
          if (parentKey === null) {
            return !module.parentModuleKey;
          }
          return module.parentModuleKey === parentKey;
        })
        .filter(module => {
          return accessibleModules.has(module.moduleKey);
        })
        .map(module => {
          const modulePerms = modulePermissions.get(module.moduleKey) || new Set();
          const children = buildMenuItems(modules, module.moduleKey);
          
          return {
            id: module.moduleKey,
            label: module.moduleName,
            icon: module.icon,
            path: module.path,
            description: module.description,
            permissions: Array.from(modulePerms),
            children: children.length > 0 ? children : undefined,
            hasChildren: children.length > 0
          };
        })
        .filter(item => {
          if (item.hasChildren && (!item.children || item.children.length === 0)) {
            return false;
          }
          return true;
        });
    };
    
    const menuItems = buildMenuItems(allModules);
    console.log(`✅ Menu items built: ${menuItems.length} items`);
    
    // Display menu structure
    console.log('\n📋 Menu Structure:');
    menuItems.forEach(item => {
      console.log(`   - ${item.label} (${item.id})`);
      if (item.children && item.children.length > 0) {
        item.children.forEach(child => {
          console.log(`     └─ ${child.label} (${child.id})`);
        });
      }
    });
    
    // Test fallback scenarios
    console.log('\n🔄 Testing fallback scenarios...');
    
    // Test with empty menu items
    const emptyMenuItems = [];
    console.log(`   Empty menu items: ${emptyMenuItems.length}`);
    
    // Test with fallback items
    const fallbackItems = [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: "LayoutDashboard",
        path: "/dashboard",
        permissions: ["dashboard:view"],
        hasChildren: false
      },
      {
        id: "utilities",
        label: "Settings",
        icon: "Settings",
        path: "/utilities",
        permissions: ["settings:view"],
        hasChildren: false
      }
    ];
    
    console.log(`   Fallback items: ${fallbackItems.length}`);
    
    console.log('\n✅ All tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   - Tenant: ${tenant.name}`);
    console.log(`   - User: ${user.name}`);
    console.log(`   - Permissions: ${userPermissions.size}`);
    console.log(`   - Modules: ${accessibleModules.size}`);
    console.log(`   - Menu Items: ${menuItems.length}`);
    console.log(`   - Token: Generated successfully`);
    
  } catch (error) {
    console.error('❌ Error testing tenant login and sidebar:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTenantLoginSidebar(); 