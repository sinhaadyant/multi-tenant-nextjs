"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDownIcon, ChevronRightIcon, Building } from "lucide-react";
import { useMenu } from "@/hooks/useMenu";
import { cn } from "@/lib/utils";
import type { MenuItem } from "@/hooks/useMenu";

interface NavigationMenuProps {
  className?: string;
  collapsed?: boolean;
}

interface MenuItemProps {
  item: MenuItem;
  level?: number;
  collapsed?: boolean;
  isActive?: boolean;
  onToggle?: (itemId: string) => void;
  expandedItems?: Set<string>;
}

const MenuItemComponent: React.FC<MenuItemProps> = ({
  item,
  level = 0,
  collapsed = false,
  isActive = false,
  onToggle,
  expandedItems = new Set(),
}) => {
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedItems.has(item.id);
  const pathname = usePathname();

  const handleClick = (e: React.MouseEvent) => {
    if (hasChildren) {
      e.preventDefault();
      onToggle?.(item.id);
    }
  };

  const getIconComponent = (iconName?: string) => {
    if (!iconName) return null;

    // Map icon names to Lucide React icons
    const iconMap: Record<string, React.ComponentType<any>> = {
      // Add more icon mappings as needed
      dashboard: () => <div className="w-4 h-4 bg-blue-500 rounded" />,
      users: () => <div className="w-4 h-4 bg-green-500 rounded" />,
      settings: () => <div className="w-4 h-4 bg-gray-500 rounded" />,
      analytics: () => <div className="w-4 h-4 bg-purple-500 rounded" />,
      support: () => <div className="w-4 h-4 bg-orange-500 rounded" />,
      audit: () => <div className="w-4 h-4 bg-red-500 rounded" />,
      building: () => <Building className="w-4 h-4" />,
    };

    const IconComponent = iconMap[iconName.toLowerCase()];
    return IconComponent ? (
      <IconComponent />
    ) : (
      <div className="w-4 h-4 bg-gray-400 rounded" />
    );
  };

  return (
    <div>
      <Link
        href={item.route || "#"}
        onClick={handleClick}
        className={cn(
          "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
          "hover:bg-gray-100 dark:hover:bg-gray-800",
          isActive &&
            "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
          !isActive && "text-gray-700 dark:text-gray-300",
          level > 0 && "ml-4",
          collapsed && "justify-center px-2"
        )}
      >
        {/* Icon */}
        <div className="flex-shrink-0">{getIconComponent(item.icon)}</div>

        {/* Text - hidden when collapsed */}
        {!collapsed && (
          <>
            <span className="flex-1">{item.name}</span>

            {/* Expand/Collapse arrow */}
            {hasChildren && (
              <ChevronDownIcon
                className={cn(
                  "w-4 h-4 transition-transform",
                  isExpanded && "rotate-180"
                )}
              />
            )}
          </>
        )}
      </Link>

      {/* Children */}
      {hasChildren && isExpanded && !collapsed && (
        <div className="mt-1 space-y-1">
          {item.children!.map(child => (
            <MenuItemComponent
              key={child.id}
              item={child}
              level={level + 1}
              collapsed={collapsed}
              isActive={child.route === pathname}
              onToggle={onToggle}
              expandedItems={expandedItems}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const NavigationMenu: React.FC<NavigationMenuProps> = ({
  className,
  collapsed = false,
}) => {
  const { menuItems, isLoading, isMenuItemActive } = useMenu();
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const handleToggle = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!menuItems.length) {
    return (
      <div className={cn("p-4 text-center text-gray-500", className)}>
        No menu items available
      </div>
    );
  }

  return (
    <nav className={cn("space-y-1", className)}>
      {menuItems.map(item => (
        <MenuItemComponent
          key={item.id}
          item={item}
          collapsed={collapsed}
          isActive={isMenuItemActive(item, pathname)}
          onToggle={handleToggle}
          expandedItems={expandedItems}
        />
      ))}
    </nav>
  );
};
