"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useTranslation } from 'next-i18next';
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
} from "lucide-react";
import SidebarWidget from "./SidebarWidget";

type NavItem = {
  id: string;
  label: string;
  icon: string;
  path?: string;
  children?: { id: string; label: string; path: string }[];
};



// Icon mapping function
const getIcon = (iconName: string) => {
  const iconMap: { [key: string]: React.ReactNode } = {
    home: <Home className="w-5 h-5" />,
    building: <Building2 className="w-5 h-5" />,
    users: <Users className="w-5 h-5" />,
    shield: <Shield className="w-5 h-5" />,
    "clipboard-list": <ClipboardList className="w-5 h-5" />,
    "chart-bar": <BarChart3 className="w-5 h-5" />,
    bell: <Bell className="w-5 h-5" />,
    cog: <Cog className="w-5 h-5" />,
    "life-ring": <LifeBuoy className="w-5 h-5" />,
    "user-circle": <User className="w-5 h-5" />,
    database: <Database className="w-5 h-5" />,
    "hard-drive": <HardDrive className="w-5 h-5" />,
    "list": <ClipboardList className="w-5 h-5" />,
  };
  return iconMap[iconName] || <Activity className="w-5 h-5" />;
};

const SuperAdminSidebar: React.FC = () => {
  const { t } = useTranslation('superadmin');
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  const superAdminNavElements: NavItem[] = [
    {
      id: "dashboard",
      label: t('navigation.dashboard'),
      icon: "home",
      path: "/superadmin/dashboard"
    },
    {
      id: "tenants",
      label: t('navigation.tenantManagement'),
      icon: "building",
      children: [
        { id: "allTenants", label: t('navigation.allTenants'), path: "/superadmin/tenants" },
        { id: "createTenant", label: t('navigation.createTenant'), path: "/superadmin/tenants/new" }
      ]
    },
    {
      id: "users",
      label: t('navigation.userManagement'),
      icon: "users",
      path: "/superadmin/users"
    },
    {
      id: "superadmins",
      label: t('navigation.superadminManagement'),
      icon: "user-circle",
      path: "/superadmin/superadmins"
    },
    {
      id: "roles",
      label: t('navigation.rolesPermissions'),
      icon: "shield",
      children: [
        { id: "rolesManagement", label: t('navigation.rolesManagement'), path: "/superadmin/roles" },
        { id: "permissionGroups", label: t('navigation.permissionGroups'), path: "/superadmin/roles?tab=permissions" },
        { id: "roleAssignment", label: t('navigation.roleAssignment'), path: "/superadmin/roles?tab=assignment" }
      ]
    },
    {
      id: "backup",
      label: t('navigation.backupImport'),
      icon: "database",
      children: [
        { id: "backupData", label: t('navigation.backupData'), path: "/superadmin/backup" },
        { id: "importData", label: t('navigation.importData'), path: "/superadmin/import" },
        { id: "backupHistory", label: t('navigation.backupHistory'), path: "/superadmin/backup/history" }
      ]
    },
    {
      id: "dataManagement",
      label: t('navigation.dataManagement'),
      icon: "hard-drive",
      children: [
        { id: "insertSampleData", label: t('navigation.insertSampleData'), path: "/superadmin/data-management/insert" },
        { id: "clearData", label: t('navigation.clearData'), path: "/superadmin/data-management/clear" }
      ]
    },
    {
      id: "menuManagement",
      label: t('navigation.menuManagement'),
      icon: "list",
      path: "/superadmin/menu"
    },
    {
      id: "audit",
      label: t('navigation.audit'),
      icon: "clipboard-list",
      path: "/superadmin/audit"
    },
    {
      id: "reports",
      label: t('navigation.reports'),
      icon: "chart-bar",
      path: "/superadmin/reports"
    },
    {
      id: "notifications",
      label: t('notifications.title'),
      icon: "bell",
      path: "/superadmin/notifications"
    },
    {
      id: "supportTickets",
      label: t('support.title'),
      icon: "life-ring",
      children: [
        { id: "allTickets", label: t('support.supportTickets'), path: "/superadmin/support-tickets" },
        { id: "createTicket", label: t('support.createTicket'), path: "/superadmin/support-tickets/new" }
      ]
    },
    {
      id: "profile",
      label: t('common.profile'),
      icon: "user-circle",
      path: "/superadmin/profile"
    }
  ];

  const renderMenuItems = (navItems: NavItem[]) => (
    <ul className="flex flex-col gap-4">
      {navItems.map((item, itemIndex) => (
        <li key={item.id}>
          <div>
            {item.children ? (
              <button
                onClick={() => handleSubmenuToggle(itemIndex)}
                className={`menu-item group ${
                  openSubmenu === itemIndex
                    ? "menu-item-active"
                    : "menu-item-inactive"
                } cursor-pointer ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "lg:justify-start"
                }`}
              >
                <span
                  className={`${
                    openSubmenu === itemIndex
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {getIcon(item.icon)}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`menu-item-text`}>{item.label}</span>
                )}
                {(isExpanded || isHovered || isMobileOpen) && (
                  <ChevronDown
                    className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                      openSubmenu === itemIndex
                        ? "rotate-180 text-brand-500"
                        : ""
                    }`}
                  />
                )}
              </button>
            ) : (
              item.path && (
                <Link
                  href={item.path}
                  className={`menu-item group ${
                    isActive(item.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
                >
                  <span
                    className={`${
                      isActive(item.path)
                        ? "menu-item-icon-active"
                        : "menu-item-icon-inactive"
                    }`}
                  >
                    {getIcon(item.icon)}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className={`menu-item-text`}>{item.label}</span>
                  )}
                </Link>
              )
            )}
            {item.children && (isExpanded || isHovered || isMobileOpen) && (
              <div
                ref={(el) => {
                  subMenuRefs.current[itemIndex] = el;
                }}
                className="overflow-hidden transition-all duration-300"
                style={{
                  height:
                    openSubmenu === itemIndex
                      ? `${subMenuHeight[itemIndex]}px`
                      : "0px",
                }}
              >
                <ul className="mt-2 space-y-1 ml-9">
                  {item.children.map((subItem) => (
                    <li key={subItem.id}>
                      <Link
                        href={subItem.path}
                        className={`menu-dropdown-item ${
                          isActive(subItem.path)
                            ? "menu-dropdown-item-active"
                            : "menu-dropdown-item-inactive"
                        }`}
                      >
                        {subItem.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );

  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<number, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    // Check if the current path matches any submenu item
    let submenuMatched = false;
    superAdminNavElements.forEach((item, itemIndex) => {
      if (item.children) {
        item.children.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu(itemIndex);
            submenuMatched = true;
          }
        });
      }
    });

    // If no submenu item matches, close the open submenu
    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive]);

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

  const handleSubmenuToggle = (itemIndex: number) => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (prevOpenSubmenu === itemIndex) {
        return null;
      }
      return itemIndex;
    });
  };

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
        className={`py-8 flex  ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/superadmin">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="SuperAdmin Logo"
                width={150}
                height={40}
              />
              <Image
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="SuperAdmin Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <Image
              src="/images/logo/logo-icon.svg"
              alt="SuperAdmin Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            {renderMenuItems(superAdminNavElements)}
          </div>
        </nav>
       </div>
    </aside>
  );
};

export default SuperAdminSidebar; 