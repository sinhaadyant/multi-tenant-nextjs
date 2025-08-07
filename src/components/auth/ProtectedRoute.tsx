"use client";
import { ReactNode } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import AuthGuardSkeleton from './AuthGuardSkeleton';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export default function ProtectedRoute({ children, redirectTo = '/superadmin/signin' }: ProtectedRouteProps) {
  const { isLoading } = useAuthGuard({
    requireAuth: true,
    redirectTo
  });

  if (isLoading) {
    return <AuthGuardSkeleton />;
  }

  return <>{children}</>;
} 