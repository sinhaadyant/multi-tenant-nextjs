"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const Checkbox: React.FC<CheckboxProps> = ({
  checked = false,
  onCheckedChange,
  disabled = false,
  className,
  children,
  ...props
}) => {
  return (
    <label className={cn("flex items-center space-x-2 cursor-pointer", className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        disabled={disabled}
        className={cn(
          "h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50",
          disabled && "cursor-not-allowed"
        )}
        {...props}
      />
      {children && <span className="text-sm">{children}</span>}
    </label>
  );
};

export { Checkbox };
