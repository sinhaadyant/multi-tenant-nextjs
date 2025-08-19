"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SeparatorProps {
  orientation?: "horizontal" | "vertical";
  className?: string;
}

const Separator: React.FC<SeparatorProps> = ({
  orientation = "horizontal",
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "shrink-0 bg-gray-200 dark:bg-gray-700",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  );
};

export { Separator };
