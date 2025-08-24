import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export interface SupportTicket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'pending' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'general' | 'technical' | 'billing' | 'feature-request' | 'bug-report';
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  attachments: Array<{
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    path: string;
  }>;
  comments: Array<{
    id: string;
    content: string;
    createdAt: string;
    author: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface SupportTicketsFilters {
  page?: number;
  limit?: number;
  status?: 'open' | 'pending' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: 'general' | 'technical' | 'billing' | 'feature-request' | 'bug-report';
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'status' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export interface SupportTicketsResponse {
  tickets: SupportTicket[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats: {
    total: number;
    open: number;
    pending: number;
    closed: number;
  };
}

// Get auth token for tenant requests
const getAuthToken = () => {
  return localStorage.getItem('tenant_auth_token') || localStorage.getItem('auth_token');
};

// Hook to fetch support tickets list
export const useTenantSupportTickets = (tenantSlug: string, filters: SupportTicketsFilters = {}) => {
  return useQuery({
    queryKey: ['tenant-support-tickets', tenantSlug, filters],
    queryFn: async (): Promise<SupportTicketsResponse> => {
      const token = getAuthToken();
      const response = await axios.get(`/api/tenant/${tenantSlug}/support`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: filters
      });
      return response.data.data;
    },
    enabled: !!tenantSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to fetch a single support ticket
export const useTenantSupportTicket = (tenantSlug: string, ticketId: string) => {
  return useQuery({
    queryKey: ['tenant-support-ticket', tenantSlug, ticketId],
    queryFn: async (): Promise<{ ticket: SupportTicket }> => {
      const token = getAuthToken();
      const response = await axios.get(`/api/tenant/${tenantSlug}/support/${ticketId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data.data;
    },
    enabled: !!tenantSlug && !!ticketId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook to fetch ticket comments
export const useTenantSupportTicketComments = (tenantSlug: string, ticketId: string) => {
  return useQuery({
    queryKey: ['tenant-support-ticket-comments', tenantSlug, ticketId],
    queryFn: async () => {
      const token = getAuthToken();
      const response = await axios.get(`/api/tenant/${tenantSlug}/support/${ticketId}/comments`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data.data;
    },
    enabled: !!tenantSlug && !!ticketId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};