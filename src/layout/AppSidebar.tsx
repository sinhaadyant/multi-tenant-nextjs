"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  LayoutDashboard,
  Calendar,
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
  List,
  Table,
  FileImage,
  Video,
  AlertTriangle,
  User,
  Badge,
} from "lucide-react";
import SidebarWidget from "./SidebarWidget";

type NavItem = {
  itemName: string;
  items: {
    name: string;
    icon: React.ReactNode;
    path?: string;
    subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
  }[];
};

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  // Detect if we're in a tenant context
  const isTenantContext = pathname.includes('/[tenantSlug]') || pathname.split('/').length > 2;

  // Define navigation based on context
  const navEelements: NavItem[] = isTenantContext ? [
    {
      itemName: "Main Menu",
      items: [
        {
          icon: <LayoutDashboard className="w-5 h-5" />,
          name: "Dashboard",
          path: "/dashboard",
        },
        {
          icon: <Users className="w-5 h-5" />,
          name: "User Profile",
          path: "/profile",
        },
        {
          name: "Forms",
          icon: <List className="w-5 h-5" />,
          path: "/forms",
        },
        {
          name: "Tables",
          icon: <Table className="w-5 h-5" />,
          path: "/tables",
        },
        {
          name: "Pages",
          icon: <FileText className="w-5 h-5" />,
          subItems: [
            { name: "Blank Page", path: "/blank", pro: false },
            { name: "404 Error", path: "/error-404", pro: false },
          ],
        },
      ]
    },
    {
      itemName: "Utilities",
      items: [
        {
          icon: <Settings className="w-5 h-5" />,
          name: "Utilities",
          path: "/utilities",
        }
      ]
    },
    {
      itemName: "Additional Features",
      items: [
        {
          icon: <BarChart3 className="w-5 h-5" />,
          name: "Charts",
          subItems: [
            { name: "Line Chart", path: "/line-chart", pro: false },
            { name: "Bar Chart", path: "/bar-chart", pro: false },
          ],
        },
        {
          icon: <Building2 className="w-5 h-5" />,
          name: "UI Elements",
          subItems: [
            { name: "Alerts", path: "/alerts", pro: false },
            { name: "Avatar", path: "/avatars", pro: false },
            { name: "Badge", path: "/badge", pro: false },
            { name: "Buttons", path: "/buttons", pro: false },
            { name: "Images", path: "/images", pro: false },
            { name: "Videos", path: "/videos", pro: false },
          ],
        }
      ]
    }
  ] : [
    {
      itemName: "Main Menu",
      items: [
        {
          icon: <LayoutDashboard className="w-5 h-5" />,
          name: "Dashboard",
          path: "/dashboard",
        },
        {
          icon: <Users className="w-5 h-5" />,
          name: "User Profile",
          path: "/profile",
        },
        {
          name: "Forms",
          icon: <List className="w-5 h-5" />,
          path: "/forms",
        },
        {
          name: "Tables",
          icon: <Table className="w-5 h-5" />,
          path: "/tables",
        },
        {
          name: "Pages",
          icon: <FileText className="w-5 h-5" />,
          subItems: [
            { name: "Blank Page", path: "/blank", pro: false },
            { name: "404 Error", path: "/error-404", pro: false },
          ],
        },
      ]
    },
    {
      itemName: "Additional Features",
      items: [
        {
          icon: <BarChart3 className="w-5 h-5" />,
          name: "Charts",
          subItems: [
            { name: "Line Chart", path: "/line-chart", pro: false },
            { name: "Bar Chart", path: "/bar-chart", pro: false },
          ],
        },
        {
          icon: <Building2 className="w-5 h-5" />,
          name: "UI Elements",
          subItems: [
            { name: "Alerts", path: "/alerts", pro: false },
            { name: "Avatar", path: "/avatars", pro: false },
            { name: "Badge", path: "/badge", pro: false },
            { name: "Buttons", path: "/buttons", pro: false },
            { name: "Images", path: "/images", pro: false },
            { name: "Videos", path: "/videos", pro: false },
          ],
        }
      ]
    }
  ];

  const renderMenuItems = (navItems: NavItem[]) => (
    <>
      {navItems.map((nav, navIndex) => (
        <div key={nav.itemName} className="mb-6">
          <h2
            className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
              !isExpanded && !isHovered
                ? "lg:justify-center"
                : "justify-start"
            }`}
          >
            {isExpanded || isHovered || isMobileOpen ? (
              nav.itemName
            ) : (
              <MoreHorizontal className="w-4 h-4" />
            )}
          </h2>
          <ul className="flex flex-col gap-4">
            {nav.items.map((item, itemIndex) => (
              <li key={item.name}>
                <div>
                  {item.subItems ? (
                    <button
                      onClick={() => handleSubmenuToggle(navIndex, itemIndex)}
                      className={`menu-item group ${
                        openSubmenu?.navIndex === navIndex && openSubmenu?.itemIndex === itemIndex
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
                          openSubmenu?.navIndex === navIndex && openSubmenu?.itemIndex === itemIndex
                            ? "menu-item-icon-active"
                            : "menu-item-icon-inactive"
                        }`}
                      >
                        {item.icon}
                      </span>
                      {(isExpanded || isHovered || isMobileOpen) && (
                        <span className={`menu-item-text`}>{item.name}</span>
                      )}
                      {(isExpanded || isHovered || isMobileOpen) && (
                        <ChevronDown
                          className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                            openSubmenu?.navIndex === navIndex && openSubmenu?.itemIndex === itemIndex
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
                          {item.icon}
                        </span>
                        {(isExpanded || isHovered || isMobileOpen) && (
                          <span className={`menu-item-text`}>{item.name}</span>
                        )}
                      </Link>
                    )
                  )}
                  {item.subItems && (isExpanded || isHovered || isMobileOpen) && (
                    <div
                      ref={(el) => {
                        subMenuRefs.current[`${navIndex}-${itemIndex}`] = el;
                      }}
                      className="overflow-hidden transition-all duration-300"
                      style={{
                        height:
                          openSubmenu?.navIndex === navIndex && openSubmenu?.itemIndex === itemIndex
                            ? `${subMenuHeight[`${navIndex}-${itemIndex}`]}px`
                            : "0px",
                      }}
                    >
                      <ul className="mt-2 space-y-1 ml-9">
                        {item.subItems.map((subItem) => (
                          <li key={subItem.name}>
                            <Link
                              href={subItem.path}
                              className={`menu-dropdown-item ${
                                isActive(subItem.path)
                                  ? "menu-dropdown-item-active"
                                  : "menu-dropdown-item-inactive"
                              }`}
                            >
                              {subItem.name}
                              <span className="flex items-center gap-1 ml-auto">
                                {subItem.new && (
                                  <span
                                    className={`ml-auto ${
                                      isActive(subItem.path)
                                        ? "menu-dropdown-badge-active"
                                        : "menu-dropdown-badge-inactive"
                                    } menu-dropdown-badge`}
                                  >
                                    new
                                  </span>
                                )}
                                {subItem.pro && (
                                  <span
                                    className={`ml-auto ${
                                      isActive(subItem.path)
                                        ? "menu-dropdown-badge-active"
                                        : "menu-dropdown-badge-inactive"
                                    } menu-dropdown-badge`}
                                  >
                                    pro
                                  </span>
                                )}
                              </span>
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
        </div>
      ))}
    </>
  );

  const [openSubmenu, setOpenSubmenu] = useState<{
    navIndex: number;
    itemIndex: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    // Check if the current path matches any submenu item
    let submenuMatched = false;
    navEelements.forEach((nav, navIndex) => {
      nav.items.forEach((item, itemIndex) => {
        if (item.subItems) {
          item.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                navIndex,
                itemIndex,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    // If no submenu item matches, close the open submenu
    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive]);

  useEffect(() => {
    // Set the height of the submenu items when the submenu is opened
    if (openSubmenu !== null) {
      const key = `${openSubmenu.navIndex}-${openSubmenu.itemIndex}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (navIndex: number, itemIndex: number) => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.navIndex === navIndex &&
        prevOpenSubmenu.itemIndex === itemIndex
      ) {
        return null;
      }
      return { navIndex, itemIndex };
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
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Logo"
                width={150}
                height={40}
              />
              <Image
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <Image
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            {renderMenuItems(navEelements)}
          </div>
        </nav>
       </div>
    </aside>
  );
};

export default AppSidebar;
