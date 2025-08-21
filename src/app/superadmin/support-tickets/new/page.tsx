"use client";

import React from 'react';
import { SuperAdminTicketForm } from '@/components/superadmin/support/SuperAdminTicketForm';
import Head from 'next/head';

export default function SuperAdminNewSupportTicketPage() {
  return (
    <>
      <Head>
        <title>Create Support Ticket | SuperAdmin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 py-8">
        <SuperAdminTicketForm
          mode="create"
        />
      </div>
    </>
  );
}
