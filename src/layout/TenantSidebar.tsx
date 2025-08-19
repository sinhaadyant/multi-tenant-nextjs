"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useParams } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useTenantAuth } from "@/hooks/useTenantAuth";
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
    modules,
    modulesLoading,
    modulesError
  } = useTenantAuth();

  console.log('🔍 TenantSidebar rendered with:', {
    user: user?.name,
    permissionsCount: permissions?.length,
    rolesCount: roles?.length,
    tenantName: tenant?.name,
    modulesCount: modules?.length,
    modulesLoading,
    modulesError,
    isExpanded, isMobileOpen, isHovered
  });

  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<number, number>>({});
  const subMenuRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Dynamic navigation items based on modules from Redux
  const getTenantNavElements = useCallback((): NavItem[] => {
    console.log('🔍 Building sidebar navigation from Redux modules:', {
      user: user?.name,
      modulesCount: modules?.length,
      modulesLoading,
      modulesError
    });

    if (modulesLoading) {
      console.log('⏳ Loading modules from Redux...');
      return [];
    }

    if (modulesError) {
      console.error('❌ Error loading modules from Redux:', modulesError);
      return [];
    }

    if (!modules || modules.length === 0) {
      console.log('⚠️ No modules found in Redux state');
      return [];
    }

    // Filter modules based on visibility and permissions
    const visibleModules = modules.filter(module => {
      // Check if module is visible in tenant
      if (!module.isVisibleInTenant) {
        console.log(`❌ Module ${module.moduleKey} is not visible in tenant`);
        return false;
      }

      // Check if module is enabled
      if (!module.isEnabled) {
        console.log(`❌ Module ${module.moduleKey} is not enabled`);
        return false;
      }

      // Check if module is visible globally
      if (!module.isVisible) {
        console.log(`❌ Module ${module.moduleKey} is not visible globally`);
        return false;
      }

      // Special handling for modules that should be available to all users
      if (['dashboard', 'profile', 'support'].includes(module.moduleKey)) {
        console.log(`✅ Module ${module.moduleKey} is available to all users`);
        return true;
      }

      // Check user permissions for other modules
      const hasModulePermission = hasAnyPermission(module.moduleKey);
      if (hasModulePermission) {
        console.log(`✅ Module ${module.moduleKey} - user has permissions`);
      } else {
        console.log(`❌ Module ${module.moduleKey} - no permissions`);
      }
      return hasModulePermission;
    });

    // Convert modules to navigation items
    const navItems: NavItem[] = visibleModules.map(module => {
      const navItem: NavItem = {
        id: module.moduleKey,
        label: module.moduleName,
        icon: module.icon || 'home',
        path: module.path ? `/${tenantSlug}${module.path}` : undefined
      };

      // Add children if module has child modules
      if (module.childModules && module.childModules.length > 0) {
        navItem.children = module.childModules
          .filter(child => child.isVisible && child.isEnabled)
          .map(child => ({
            id: child.moduleKey,
            label: child.moduleName,
            path: `/${tenantSlug}${child.path || `/${child.moduleKey}`}`,
            requiredPermission: `${child.moduleKey}:read`
          }));
      }

      // Special handling for modules that need custom children
      if (module.moduleKey === 'support') {
        navItem.children = [
          { 
            id: "allTickets", 
            label: "All Tickets", 
            path: `/${tenantSlug}/support-tickets`
          },
          { 
            id: "createTicket", 
            label: "Create Ticket", 
            path: `/${tenantSlug}/support-tickets/new`
          }
        ];
      }

      return navItem;
    });

    console.log('🔍 Final navigation items:', navItems.map(item => ({ id: item.id, label: item.label })));
    return navItems;
  }, [modules, modulesLoading, modulesError, user?.name, tenantSlug, hasAnyPermission]);

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
        {renderMenuItems(navItems)}
      </nav>

      {/* User Info */}
      {user && (isExpanded || isHovered || isMobileOpen) && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
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
        </div>
      )}
    </aside>
  );
};

export default TenantSidebar;
