"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  SkeletonLoader,
  SkeletonCard,
  SkeletonTable,
  SkeletonUserCard,
  SkeletonStats,
  SkeletonForm,
  SkeletonChart,
  SkeletonList,
} from "./skeleton/SkeletonLoader";

interface LoadingWrapperProps {
  children: ReactNode;
  isLoading: boolean;
  skeleton?:
    | "basic"
    | "card"
    | "table"
    | "user"
    | "stats"
    | "form"
    | "chart"
    | "list";
  skeletonProps?: {
    count?: number;
    rows?: number;
    columns?: number;
    fields?: number;
    items?: number;
    height?: string;
  };
  className?: string;
  fallback?: ReactNode;
}

export function LoadingWrapper({
  children,
  isLoading,
  skeleton = "basic",
  skeletonProps = {},
  className,
  fallback,
}: LoadingWrapperProps) {
  if (isLoading) {
    if (fallback) {
      return <>{fallback}</>;
    }

    const skeletonComponents = {
      basic: <SkeletonLoader {...skeletonProps} />,
      card: <SkeletonCard className={className} />,
      table: <SkeletonTable {...skeletonProps} className={className} />,
      user: <SkeletonUserCard />,
      stats: <SkeletonStats count={skeletonProps.count} />,
      form: <SkeletonForm fields={skeletonProps.fields} />,
      chart: <SkeletonChart height={skeletonProps.height} />,
      list: <SkeletonList items={skeletonProps.items} />,
    };

    return (
      <div className={cn("animate-pulse", className)}>
        {skeletonComponents[skeleton]}
      </div>
    );
  }

  return <>{children}</>;
}
