"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { useSidebar } from "../context/SidebarContext";
import { useTenantAuth } from "@/hooks/useTenantAuth";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import {
  ChevronDown,
  Users,
  Shield,
  BarChart3,
  Settings,
  Activity,
  ClipboardList,
  Bell,
  Cog,
  LifeBuoy,
  User,
  Home,
  FileText,
  Building2,
  Wrench,
  Bug,
  TestTube,
  Info,
  Database,
  HardDrive,
  Mail,
  Key,
  RefreshCw,
  UserPlus,
  LogIn,
  LayoutDashboard,
  Languages,
} from "lucide-react";

type NavItem = {
  id: string;
  label: string;
  icon: string;
  path?: string;
  children?: { id: string; label: string; path: string; requiredPermission?: string }[];
  requiredPermission?: string;
  requiredRole?: string;
};

const TenantSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { 
    user, 
    permissions, 
    roles, 
    hasPermission, 
    hasAnyPermission, 
    hasRole, 
    tenant,
    modules: apiModules, 
    modulesLoading, 
    modulesError
  } = useTenantAuth();

  // Get the full userPermissions object from Redux
  const userPermissions = useSelector((state: any) => state.permissions.userPermissions);

  console.log('🔍 TenantSidebar rendered with:', {
    user: user?.name,
    permissionsAvailable: !!userPermissions,
    accessibleModulesCount: userPermissions?.accessibleModules?.length || 0,
    permissionsCount: userPermissions?.permissions?.length || 0,
    modulePermissionsCount: Object.keys(userPermissions?.modulePermissions || {}).length,
    rolesCount: roles?.length,
    tenantName: tenant?.name,
    modulesCount: apiModules?.length,
    modulesLoading,
    modulesError,
    isExpanded, isMobileOpen, isHovered
  });



  // Check if we have modules from either source
  const hasModulesFromAPI = apiModules && apiModules.length > 0;
  const hasModulesFromUserPermissions = userPermissions?.modules && userPermissions.modules.length > 0;
  




  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<number, number>>({});
  const subMenuRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Custom permission checking function for API permissions
  const checkApiPermission = useCallback((moduleKey: string): boolean => {
    // Always allow dashboard and profile
    if (['dashboard', 'profile'].includes(moduleKey)) {
      return true;
    }
    
    // Check if user has permissions for this module
    if (!userPermissions) {
      return false;
    }

    // Check if module is in accessible modules list
    if (userPermissions.accessibleModules && userPermissions.accessibleModules.includes(moduleKey)) {
      return true;
    }

    // Check if user has any permission for this module (read, create, update, delete)
    const modulePermissions = userPermissions.modulePermissions?.[moduleKey];
    if (modulePermissions && modulePermissions.length > 0) {
      return true;
    }

    // Check if user has any permission that matches this module
    const hasAnyModulePermission = userPermissions.permissions?.some((permission: any) => 
      permission.moduleKey === moduleKey && (permission.canRead || permission.canCreate || permission.canUpdate || permission.canDelete)
    );
    
    if (hasAnyModulePermission) {
      return true;
    }

    return false;
  }, [userPermissions]);

  // Dynamic navigation items based on modules from API
  const getTenantNavElements = useCallback((): NavItem[] => {
    if (modulesLoading) {
      return [];
    }

    if (modulesError) {
      return [];
    }

    // Use modules from userPermissions if apiModules is not available
    const modulesToUse = apiModules ? (apiModules.length > 0 ? apiModules : (userPermissions?.modules || [])) : (userPermissions?.modules || []);
    
    if (!modulesToUse || modulesToUse.length === 0) {
      console.log('⚠️ No modules found in API response or userPermissions');
      return [];
    }

    // Filter modules based on visibility and permissions
    const visibleModules = modulesToUse.filter((module: any) => {
      const moduleKey = module.moduleKey;
      
      // Explicitly exclude module-management from sidebar
      if (['module-management', 'modules'].includes(moduleKey)) {
        console.log(`❌ Module ${moduleKey} - explicitly excluded from sidebar`);
        return false;
      }
      
      // Check if module is visible in tenant
      if (module.isVisibleInTenant === false) {
        console.log(`❌ Module ${moduleKey} is not visible in tenant`);
        return false;
      }

      // Check if module is enabled
      if (module.isEnabled === false) {
        console.log(`❌ Module ${moduleKey} is not enabled`);
        return false;
      }

      // Check if module is visible globally
      if (module.isVisible === false) {
        console.log(`❌ Module ${moduleKey} is not visible globally`);
        return false;
      }

      // Special handling for modules that should be available to all users
      if (['dashboard', 'profile'].includes(moduleKey)) {
        console.log(`✅ Module ${moduleKey} is available to all users`);
        return true;
      }

      // For all other modules, check if user has ANY permission (read, create, update, delete)
      const hasModulePermission = checkApiPermission(moduleKey);
      if (hasModulePermission) {
        console.log(`✅ Module ${moduleKey} - user has permissions`);
      } else {
        console.log(`❌ Module ${moduleKey} - no permissions, excluding from sidebar`);
      }
      return hasModulePermission;
    });

    // Convert modules to navigation items with correct route mapping
    const navItems: NavItem[] = visibleModules.map((module: any) => {
      const moduleKey = module.moduleKey;
      
      // Map module keys to correct route paths (excluding module-management)
      const routeMapping: { [key: string]: string } = {
        'dashboard': `/${tenantSlug}/dashboard`,
        'user-management': `/${tenantSlug}/users`,
        'users': `/${tenantSlug}/users`,
        'roles-permissions': `/${tenantSlug}/roles`,
        'roles': `/${tenantSlug}/roles`,
        'audit-logs': `/${tenantSlug}/audit`,
        'audit': `/${tenantSlug}/audit`,
        'notifications': `/${tenantSlug}/notifications`,
        'support': `/${tenantSlug}/support`,
        'support-tickets': `/${tenantSlug}/support`,
        'reports-analytics': `/${tenantSlug}/reports`,
        'reports': `/${tenantSlug}/reports`,
        'profile': `/${tenantSlug}/profile`,
        'tenant-management': `/${tenantSlug}/tenants`,
        'tenants': `/${tenantSlug}/tenants`,
        'menu-management': `/${tenantSlug}/menu`,
        'menu': `/${tenantSlug}/menu`,
        'backup-import': `/${tenantSlug}/backup`,
        'backup': `/${tenantSlug}/backup`,
        'data-management': `/${tenantSlug}/data-management`,
        'import': `/${tenantSlug}/import`,
        'content-management': `/${tenantSlug}/content-management`,
        'analytics': `/${tenantSlug}/analytics`
      };

      const navItem: NavItem = {
        id: moduleKey,
        label: module.moduleName,
        icon: module.icon || 'home',
        path: routeMapping[moduleKey] || `/${tenantSlug}/${moduleKey}`
      };

      // Attach data-tour ids for known modules
      if (moduleKey === 'dashboard') (navItem as any).dataTour = 'tour-dashboard';
      if (moduleKey === 'users' || moduleKey === 'user-management') (navItem as any).dataTour = 'tour-users';
      if (moduleKey === 'roles' || moduleKey === 'roles-permissions') (navItem as any).dataTour = 'tour-roles';
      if (moduleKey === 'modules' || moduleKey === 'module-management') (navItem as any).dataTour = 'tour-modules';
      if (moduleKey === 'billing' || moduleKey === 'subscription') (navItem as any).dataTour = 'tour-billing';
      if (moduleKey === 'reports' || moduleKey === 'analytics' || moduleKey === 'reports-analytics') (navItem as any).dataTour = 'tour-reports';

      // Add children if module has child modules
      if (module.childModules && module.childModules.length > 0) {
        navItem.children = module.childModules
          .filter((child: any) => child.isVisible && child.isEnabled)
          .map((child: any) => {
            const childKey = child.moduleKey;
            const childPath = routeMapping[childKey] || `/${tenantSlug}/${childKey}`;
            return {
              id: childKey,
              label: child.moduleName,
              path: childPath,
              requiredPermission: `${childKey}:read`
            };
          });
      }

      // Special handling for modules that need custom children
      if (moduleKey === 'support' || moduleKey === 'support-tickets') {
        navItem.children = [
          { 
            id: "allTickets", 
            label: "All Tickets", 
            path: `/${tenantSlug}/support`
          }
        ];
      }

      // Special handling for backup/import module
      if (moduleKey === 'backup-import' || moduleKey === 'backup') {
        navItem.children = [
          { 
            id: "backup", 
            label: "Backup Data", 
            path: `/${tenantSlug}/backup`
          },
          { 
            id: "import", 
            label: "Import Data", 
            path: `/${tenantSlug}/import`
          }
        ];
      }

      // Special handling for data management module
      if (moduleKey === 'data-management') {
        navItem.children = [
          { 
            id: "insertData", 
            label: "Insert Sample Data", 
            path: `/${tenantSlug}/data-management`
          },
          { 
            id: "clearData", 
            label: "Clear Data", 
            path: `/${tenantSlug}/data-management`
          }
        ];
      }

      return navItem;
    });

    console.log('🔍 Final navigation items:', navItems.map(item => ({ id: item.id, label: item.label })));
    console.log('🔍 Modules source:', apiModules && apiModules.length > 0 ? 'API' : 'userPermissions');
    console.log('🔍 Total modules available:', modulesToUse.length);
    console.log('🔍 Visible modules after filtering:', visibleModules.length);
    
    // If no modules are available, provide fallback navigation
    if (navItems.length === 0) {
      console.log('⚠️ No modules available, providing fallback navigation');
      return [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: 'dashboard',
          path: `/${tenantSlug}/dashboard`
        },
        {
          id: 'profile',
          label: 'Profile',
          icon: 'user',
          path: `/${tenantSlug}/profile`
        }
      ];
    }
    
    return navItems;
  }, [apiModules, modulesLoading, modulesError, user?.name, tenantSlug, checkApiPermission]);

  // Get icon component based on icon name
  const getIconComponent = useCallback((iconName: string) => {
    const iconMap: { [key: string]: React.ComponentType<any> } = {
      home: Home,
      users: Users,
      shield: Shield,
      "clipboard-list": ClipboardList,
      "chart-bar": BarChart3,
      bell: Bell,
      "life-ring": LifeBuoy,
      cog: Cog,
      database: Database,
      wrench: Wrench,
      bug: Bug,
      "test-tube": TestTube,
      info: Info,
      user: User,
      "file-text": FileText,
      building: Building2,
      mail: Mail,
      key: Key,
      "refresh-cw": RefreshCw,
      "user-plus": UserPlus,
      "log-in": LogIn,
      dashboard: LayoutDashboard,
    };
    return iconMap[iconName] || Home;
  }, []);

  // Check if user has permission for a specific nav item
  const checkPermission = useCallback((item: NavItem): boolean => {
    if (!item.requiredPermission) return true;
    
    const [module, action] = item.requiredPermission.split(':');
    return hasPermission(module, action);
  }, [hasPermission]);

  // Check if user has required role for a specific nav item
  const checkRole = useCallback((item: NavItem): boolean => {
    if (!item.requiredRole) return true;
    return hasRole(item.requiredRole);
  }, [hasRole]);

  // Render menu items
  const renderMenuItems = useCallback((items: NavItem[]) => {
    return items
      .filter(item => checkPermission(item) && checkRole(item))
      .map((item, index) => {
        const IconComponent = getIconComponent(item.icon);
        const isActive = pathname === item.path;
        const hasChildren = item.children && item.children.length > 0;
        const isSubmenuOpen = openSubmenu === index;

        return (
          <div key={item.id} className="relative">
            <Link
              href={item.path || '#'}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                isActive
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              } ${!isExpanded && !isMobileOpen ? 'justify-center' : ''}`}
              data-tour={(item as any).dataTour || undefined}
              onClick={(e) => {
                if (hasChildren) {
                  e.preventDefault();
                  setOpenSubmenu(isSubmenuOpen ? null : index);
                }
              }}
            >
              <IconComponent className="w-5 h-5 mr-3 flex-shrink-0" />
              {(isExpanded || isMobileOpen) && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {hasChildren && (
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isSubmenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </>
              )}
            </Link>

            {/* Submenu */}
            {hasChildren && isSubmenuOpen && (isExpanded || isMobileOpen) && (
              <div
                ref={(el) => {
                  subMenuRefs.current[index] = el;
                }}
                className="ml-4 mt-1 space-y-1"
                style={{
                  maxHeight: subMenuHeight[index] || 'auto',
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease-in-out'
                }}
              >
                {item.children
                  ?.filter(child => checkPermission({ ...item, requiredPermission: child.requiredPermission }))
                  .map((child) => {
                    const isChildActive = pathname === child.path;
                    return (
                      <Link
                        key={child.id}
                        href={child.path}
                        className={`block px-3 py-2 text-sm rounded-md transition-colors duration-200 ${
                          isChildActive
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-800 dark:text-blue-300'
                            : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
                        }`}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
              </div>
            )}
          </div>
        );
      });
  }, [pathname, isExpanded, isMobileOpen, openSubmenu, subMenuHeight, checkPermission, checkRole, getIconComponent]);

  // Update submenu heights when submenu opens/closes
  useEffect(() => {
    if (openSubmenu !== null && subMenuRefs.current[openSubmenu]) {
      const element = subMenuRefs.current[openSubmenu];
      if (element) {
        const height = element.scrollHeight;
        setSubMenuHeight(prev => ({ ...prev, [openSubmenu]: height }));
      }
    }
  }, [openSubmenu]);

  const navItems = getTenantNavElements();

  return (
     <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
        {(isExpanded || isHovered || isMobileOpen) ? (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {tenant?.name || 'Tenant'}
            </span>
          </div>
        ) : (
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
            <Building2 className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      {/* Tenant Info */}
      {tenant && (isExpanded || isHovered || isMobileOpen) && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-gray-500" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {tenant.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {tenant.plan} Plan
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {modulesLoading ? (
          // Loading state
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center px-3 py-2">
                <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mr-3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-1" />
              </div>
            ))}
          </div>
        ) : modulesError ? (
          // Error state
          <div className="px-3 py-2 text-sm text-red-500 dark:text-red-400">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4">⚠️</div>
              <span>{t('common:errorLoadingModules')}</span>
            </div>
          </div>
        ) : navItems.length === 0 ? (
          // No modules state
          <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4">ℹ️</div>
              <span>{t('common:noModulesAvailable')}</span>
            </div>
          </div>
        ) : (
          // Normal navigation
          renderMenuItems(navItems)
        )}
      </nav>

      {/* User Info */}
      {user && (isExpanded || isHovered || isMobileOpen) && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user.role}
              </p>
            </div>
          </div>
          
          {/* Language Switcher */}
          <div className="flex items-center space-x-2 pt-2 border-t border-gray-100 dark:border-gray-600" data-tour="tour-language-switcher">
            <Languages className="w-4 h-4 text-gray-500" />
            <div className="flex-1">
              <LanguageSwitcher 
                userId={user.id}
                userType="user"
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default TenantSidebar;
