"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import UserDetailPage from '@/components/superadmin/UserDetailPage';
import { UserErrorBoundaryWrapper } from '@/components/superadmin/UserErrorBoundary';

export default function UserDetailRoute() {
  const params = useParams();
  const userId = params.id as string;

  return (
    <UserErrorBoundaryWrapper>
      <UserDetailPage userId={userId} />
    </UserErrorBoundaryWrapper>
  );
}

