"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useMenu } from "@/hooks/useMenu";
import { useAuth } from "@/hooks/useAuth";
import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
} from "../icons/index";
import SidebarWidget from "./SidebarWidget";

// Icon mapping for dynamic menu items
const getIconComponent = (iconName?: string) => {
  if (!iconName) return <GridIcon />;

  const iconMap: Record<string, React.ReactNode> = {
    dashboard: <GridIcon />,
    users: <UserCircleIcon />,
    roles: <ListIcon />,
    tenants: <BoxCubeIcon />,
    modules: <PageIcon />,
    support: <PlugInIcon />,
    audit: <TableIcon />,
    analytics: <PieChartIcon />,
    calendar: <CalenderIcon />,
    settings: <HorizontaLDots />,
  };

  return iconMap[iconName.toLowerCase()] || <GridIcon />;
};

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const { menuItems, isLoading, isMenuItemActive } = useMenu();
  const { isAuthenticated } = useAuth();

  const renderMenuItems = () => {
    if (isLoading) {
      return (
        <ul className="flex flex-col gap-4">
          {[...Array(6)].map((_, index) => (
            <li key={index}>
              <div className="menu-item group menu-item-inactive animate-pulse">
                <div className="w-5 h-5 bg-gray-300 rounded"></div>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <div className="h-4 bg-gray-300 rounded w-20"></div>
                )}
              </div>
            </li>
          ))}
        </ul>
      );
    }

    if (!menuItems.length) {
      return (
        <div className="p-4 text-center text-gray-500">
          No menu items available
        </div>
      );
    }

    return (
      <ul className="flex flex-col gap-4">
        {menuItems.map((item, index) => (
          <li key={item.id}>
            {item.children && item.children.length > 0 ? (
              <button
                onClick={() => handleSubmenuToggle(index, "main")}
                className={`menu-item group ${
                  openSubmenu?.type === "main" && openSubmenu?.index === index
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
                    openSubmenu?.type === "main" && openSubmenu?.index === index
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {getIconComponent(item.icon)}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`menu-item-text`}>{item.name}</span>
                )}
                {(isExpanded || isHovered || isMobileOpen) && (
                  <ChevronDownIcon
                    className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                      openSubmenu?.type === "main" &&
                      openSubmenu?.index === index
                        ? "rotate-180 text-brand-500"
                        : ""
                    }`}
                  />
                )}
              </button>
            ) : (
              item.route && (
                <Link
                  href={item.route}
                  className={`menu-item group ${
                    isMenuItemActive(item, pathname)
                      ? "menu-item-active"
                      : "menu-item-inactive"
                  }`}
                >
                  <span
                    className={`${
                      isMenuItemActive(item, pathname)
                        ? "menu-item-icon-active"
                        : "menu-item-icon-inactive"
                    }`}
                  >
                    {getIconComponent(item.icon)}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className={`menu-item-text`}>{item.name}</span>
                  )}
                </Link>
              )
            )}
            {item.children &&
              item.children.length > 0 &&
              (isExpanded || isHovered || isMobileOpen) && (
                <div
                  ref={el => {
                    subMenuRefs.current[`main-${index}`] = el;
                  }}
                  className="overflow-hidden transition-all duration-300"
                  style={{
                    height:
                      openSubmenu?.type === "main" &&
                      openSubmenu?.index === index
                        ? `${subMenuHeight[`main-${index}`]}px`
                        : "0px",
                  }}
                >
                  <ul className="mt-2 space-y-1 ml-9">
                    {item.children.map(subItem => (
                      <li key={subItem.id}>
                        <Link
                          href={subItem.route || "#"}
                          className={`menu-dropdown-item ${
                            isMenuItemActive(subItem, pathname)
                              ? "menu-dropdown-item-active"
                              : "menu-dropdown-item-inactive"
                          }`}
                        >
                          {subItem.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </li>
        ))}
      </ul>
    );
  };

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => path === pathname;
  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    // Check if the current path matches any submenu item
    let submenuMatched = false;
    menuItems.forEach((item, index) => {
      if (item.children && item.children.length > 0) {
        item.children.forEach(subItem => {
          if (subItem.route && isActive(subItem.route)) {
            setOpenSubmenu({
              type: "main" as "main" | "others",
              index,
            });
            submenuMatched = true;
          }
        });
      }
    });

    // If no submenu item matches, close the open submenu
    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive, menuItems]);

  useEffect(() => {
    // Set the height of the submenu items when the submenu is opened
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight(prevHeights => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu(prevOpenSubmenu => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
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
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Navigation"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems()}
            </div>
          </div>
        </nav>
        {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}
      </div>
    </aside>
  );
};

export default AppSidebar;
