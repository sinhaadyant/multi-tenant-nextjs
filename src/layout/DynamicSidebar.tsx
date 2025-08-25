"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useDynamicPermissions, MenuItem } from "../context/DynamicPermissionsContext";
import { useTenantAuth } from "../context/TenantAuthContext";
import { useParams } from "next/navigation";
import {
  LayoutDashboard,
  ChevronDown,
  MoreHorizontal,
  Users,
  FileText,
  Shield,
  BarChart3,
  Settings,
  Building2,
  Activity,
  Key,
  Database,
  Mail,
  HardDrive,
  Home,
  ClipboardList,
  Bell,
  Cog,
  LifeBuoy,
  User,
  Download,
  Upload,
  UserCheck,
  ShieldCheck,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import SidebarWidget from "./SidebarWidget";
import RoleBadge from "@/components/ui/RoleBadge";

// Icon mapping
const iconMap: { [key: string]: React.ReactNode } = {
  LayoutDashboard: <LayoutDashboard className="w-5 h-5" />,
  Users: <Users className="w-5 h-5" />,
  Shield: <Shield className="w-5 h-5" />,
  BarChart3: <BarChart3 className="w-5 h-5" />,
  Settings: <Settings className="w-5 h-5" />,
  Bell: <Bell className="w-5 h-5" />,
  ClipboardList: <ClipboardList className="w-5 h-5" />,
  LifeBuoy: <LifeBuoy className="w-5 h-5" />,
  FileText: <FileText className="w-5 h-5" />,
  Activity: <Activity className="w-5 h-5" />,
  UserCheck: <UserCheck className="w-5 h-5" />,
  ShieldCheck: <ShieldCheck className="w-5 h-5" />,
  Key: <Key className="w-5 h-5" />,
  Cog: <Cog className="w-5 h-5" />,
  Home: <Home className="w-5 h-5" />,
  User: <User className="w-5 h-5" />,
  Building2: <Building2 className="w-5 h-5" />,
  Database: <Database className="w-5 h-5" />,
  Mail: <Mail className="w-5 h-5" />,
  HardDrive: <HardDrive className="w-5 h-5" />,
  Download: <Download className="w-5 h-5" />,
  Upload: <Upload className="w-5 h-5" />,
  AlertTriangle: <AlertTriangle className="w-5 h-5" />,
};

// Fallback menu items when permissions API fails or returns empty
const getFallbackMenuItems = (tenantSlug: string): MenuItem[] => [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "LayoutDashboard",
    path: `/${tenantSlug}/dashboard`,
    description: "Main dashboard with overview and analytics",
    permissions: ["dashboard:view"],
    hasChildren: false
  },
  {
    id: "users",
    label: "Users",
    icon: "Users",
    path: `/${tenantSlug}/users`,
    description: "Manage users and their roles",
    permissions: ["users:view"],
    hasChildren: false
  },
  {
    id: "roles",
    label: "Roles",
    icon: "Shield",
    path: `/${tenantSlug}/roles`,
    description: "Manage roles and permissions",
    permissions: ["roles:view"],
    hasChildren: false
  },
  {
    id: "audit",
    label: "Audit Logs",
    icon: "ClipboardList",
    path: `/${tenantSlug}/audit`,
    description: "View system audit logs",
    permissions: ["audit:view"],
    hasChildren: false
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: "Bell",
    path: `/${tenantSlug}/notifications`,
    description: t('tables:filters.manageNotifications'),
    permissions: ["notifications:view"],
    hasChildren: false
  },
  {
    id: "settings",
    label: "Settings",
    icon: "Settings",
    path: `/${tenantSlug}/settings`,
    description: "System and tenant settings",
    permissions: ["settings:view"],
    hasChildren: false
  },
  {
    id: "supportTickets",
    label: "Support Tickets",
    icon: "LifeBuoy",
    path: `/${tenantSlug}/support-tickets`,
    description: "Manage support tickets and requests",
    permissions: ["support:view"],
    hasChildren: false
  }
];

interface DynamicSidebarProps {
  isAuthPage?: boolean;
}

const DynamicSidebar: React.FC<DynamicSidebarProps> = ({ isAuthPage = false }) => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const { getMenuItems, isLoading, error, hasAccess } = useDynamicPermissions();
  const { tenant, user } = useTenantAuth();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  

  

  
  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);
  const [subMenuHeights, setSubMenuHeight] = useState<{ [key: number]: number }>({});
  const subMenuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Move useEffect to the top, before any conditional logic
  useEffect(() => {
    // Set the height of the submenu items when the submenu is opened
    if (openSubmenu !== null) {
      if (subMenuRefs.current[openSubmenu]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [openSubmenu]: subMenuRefs.current[openSubmenu]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const menuItems = getMenuItems();
  
  // Use fallback menu items if the API returns empty or fails
  const displayMenuItems = menuItems.length > 0 ? menuItems : getFallbackMenuItems(tenantSlug);

  // If it's an auth page, don't render the sidebar
  if (isAuthPage) {
    return null;
  }

  // Define renderMenuItem function before it's used
  const renderMenuItem = (item: MenuItem, index: number, level: number = 0): React.ReactNode => {
    const isActive = pathname === item.path;
    const hasChildren = item.children && item.children.length > 0;
    const isSubmenuOpen = openSubmenu === index;
    
    const itemClasses = `
      flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200
      ${isActive 
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
      }
      ${level > 0 ? 'ml-4' : ''}
    `;

    const iconElement = item.icon ? iconMap[item.icon] : <FileText className="w-5 h-5" />;

    if (hasChildren) {
      return (
        <div key={item.id} className="space-y-1">
          <button
            onClick={() => setOpenSubmenu(isSubmenuOpen ? null : index)}
            className={itemClasses}
          >
            <div className="flex items-center space-x-3">
              {iconElement}
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="truncate">{item.label}</span>
              )}
            </div>
            {(isExpanded || isHovered || isMobileOpen) && (
              <ChevronDown className={`w-4 h-4 transition-transform ${isSubmenuOpen ? 'rotate-180' : ''}`} />
            )}
          </button>
          {(isExpanded || isHovered || isMobileOpen) && isSubmenuOpen && (
            <div className="ml-4 space-y-1">
              {item.children?.map((child, childIndex) => 
                renderMenuItem(child, childIndex, level + 1)
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.id}
        href={item.path || '#'}
        className={itemClasses}
        onClick={() => {
          if (isMobileOpen) {
            // Close mobile sidebar when item is clicked
            // You might need to add a closeMobileSidebar function to your sidebar context
          }
        }}
      >
        <div className="flex items-center space-x-3">
          {iconElement}
          {(isExpanded || isHovered || isMobileOpen) && (
            <span className="truncate">{item.label}</span>
          )}
        </div>
        {/* Badge support can be added later if needed */}
      </Link>
    );
  };

  // Handle no access scenario - but still show fallback menu
  if (!isLoading && !hasAccess && menuItems.length === 0) {
    return (
      <aside className="fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 w-[290px]">
         {/* Tenant and User Info */}
        <div className="py-6 flex justify-start">
          {user && <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">
                {tenant?.name ? tenant.name.charAt(0).toUpperCase() : tenantSlug ? tenantSlug.charAt(0).toUpperCase() : 'T'}  
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {tenant?.name || (tenantSlug ? tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1) : 'Admin')}
               </h2>
             
            </div>
          </div>}
        </div>
        
       
         
        
        <div className="flex-1 overflow-y-auto">
          <nav className="space-y-2">
            {getFallbackMenuItems(tenantSlug).map((item: MenuItem, index: number) => renderMenuItem(item, index))}
          </nav>
        </div>
        {(isExpanded || isHovered || isMobileOpen) && (
          <div className="pb-6">
            <SidebarWidget />
          </div>
        )}
      </aside>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <aside className="fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 w-[290px]">
        <div className="py-8 flex justify-start">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Loading...
            </span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Loading Menu
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Please wait while we load your permissions...
            </p>
          </div>
        </div>
      </aside>
    );
  }

  // Error state - show fallback menu instead of error
  if (error && menuItems.length === 0) {
    return (
      <aside className="fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 w-[290px]">
        <div className="py-6 flex justify-start">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">
                {tenant?.name ? tenant.name.charAt(0).toUpperCase() : 
                 tenantSlug ? tenantSlug.charAt(0).toUpperCase() : 'T'}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {tenant?.name || (tenantSlug ? tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1) : 'Admin')}
              </h2>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.roles && user.roles.length > 0 
                    ? user.roles.map(role => role.name).join(', ')
                    : 'User'}
                </p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <nav className="space-y-2">
            {getFallbackMenuItems(tenantSlug).map((item: MenuItem, index: number) => renderMenuItem(item, index))}
          </nav>
        </div>
        {(isExpanded || isHovered || isMobileOpen) && (
          <div className="pb-6">
            <SidebarWidget />
          </div>
        )}
      </aside>
    );
  }

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
      <div
        className={`py-6 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href={`/${tenantSlug}/dashboard`}>
          {isExpanded || isHovered || isMobileOpen ? (
            <div className="flex items-center space-x-3">
              {/* Tenant Logo */}
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {tenant?.name ? tenant.name.charAt(0).toUpperCase() : 
                   tenantSlug ? tenantSlug.charAt(0).toUpperCase() : 'T'}
                </span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {tenant?.name || (tenantSlug ? tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1) : 'Admin')}
                </h2>
                <div className="flex items-center space-x-2">
                  {user?.roles && user.roles.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role, index) => (
                        <span
                          key={role.id}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-200"
                        >
                          {role.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                      {user?.roles ? `No roles (${user.roles.length})` : 'User'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {tenant?.name ? tenant.name.charAt(0).toUpperCase() : 
                   tenantSlug ? tenantSlug.charAt(0).toUpperCase() : 'T'}
                </span>
              </div>
              {user?.roles && user.roles.length > 0 && (
                <div className="w-8 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 text-xs font-medium">
                    {user.roles.length > 1 ? `${user.roles.length}R` : user.roles[0].name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          )}
        </Link>
      </div>

      {/* User Info Section */}
      {user && (isExpanded || isHovered || isMobileOpen) && (
        <div className="px-3 py-4 mb-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 text-xs font-medium">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user.name}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                {user.roles && user.roles.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((role, index) => (
                      <span
                        key={role.id}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-200"
                      >
                        {role.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                    {user.roles ? `No roles (${user.roles.length})` : 'User'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <nav className="space-y-2">
          {displayMenuItems.map((item: MenuItem, index: number) => renderMenuItem(item, index))}
        </nav>
      </div>

      {/* Sidebar Widget */}
      {(isExpanded || isHovered || isMobileOpen) && (
        <div className="pb-6">
          <SidebarWidget />
          
        </div>
      )}
    </aside>
  );
};

export default DynamicSidebar; 