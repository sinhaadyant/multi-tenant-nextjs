"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200 dark:bg-gray-700",
        className
      )}
      {...props}
    />
  );
};

export { Skeleton };
