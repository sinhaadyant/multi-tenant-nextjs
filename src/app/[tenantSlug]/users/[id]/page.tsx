"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import TenantUserDetailPage from '@/components/tenant/TenantUserDetailPage';

export default function UserDetailRoute() {
  const params = useParams();
  const userId = params.id as string;

  return <TenantUserDetailPage userId={userId} />;
}

