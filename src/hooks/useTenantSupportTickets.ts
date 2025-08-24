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
  const token = localStorage.getItem('tenant_auth_token') || localStorage.getItem('auth_token');
  
  if (!token) {
    console.warn('No authentication token found. User may need to log in again.');
  }
  
  return token;
};

// Hook to fetch support tickets list
export const useTenantSupportTickets = (tenantSlug: string, filters: SupportTicketsFilters = {}) => {
  return useQuery({
    queryKey: ['tenant-support-tickets', tenantSlug, filters],
    queryFn: async (): Promise<SupportTicketsResponse> => {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
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
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error?.response?.status === 401) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    }
  });
};

// Hook to fetch a single support ticket
export const useTenantSupportTicket = (tenantSlug: string, ticketId: string) => {
  return useQuery({
    queryKey: ['tenant-support-ticket', tenantSlug, ticketId],
    queryFn: async () => {
      const token = getAuthToken();
      const response = await axios.get(`/api/tenant/${tenantSlug}/support/${ticketId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data.data;
    },
    enabled: !!tenantSlug && !!ticketId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to fetch support ticket comments
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
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook to create a support ticket comment
export const useCreateTenantSupportTicketComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      ticketId: string;
      content: string;
      attachments: Array<{
        filename: string;
        originalName: string;
        mimeType: string;
        size: number;
        path: string;
      }>;
    }) => {
      const token = getAuthToken();
      const params = new URLSearchParams();
      params.append('tenantSlug', 'current'); // Will be replaced by middleware
      
      const response = await axios.post(`/api/tenant/current/support/${data.ticketId}/comments?${params.toString()}`, {
        content: data.content,
        attachments: data.attachments
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch comments for this ticket
      queryClient.invalidateQueries({ 
        queryKey: ['tenant-support-ticket-comments', 'current', variables.ticketId] 
      });
    }
  });
};

// Hook to create a support ticket
export const useCreateTenantSupportTicket = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high' | 'urgent';
      category: 'general' | 'technical' | 'billing' | 'feature-request' | 'bug-report';
      attachments: Array<{
        filename: string;
        originalName: string;
        mimeType: string;
        size: number;
        path: string;
      }>;
    }) => {
      const token = getAuthToken();
      const params = new URLSearchParams();
      params.append('tenantSlug', 'current'); // Will be replaced by middleware
      
      const response = await axios.post(`/api/tenant/current/support?${params.toString()}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate and refetch tickets list
      queryClient.invalidateQueries({ queryKey: ['tenant-support-tickets'] });
    }
  });
};

// Hook to update a support ticket
export const useUpdateTenantSupportTicket = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      id: string;
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high' | 'urgent';
      category: 'general' | 'technical' | 'billing' | 'feature-request' | 'bug-report';
      attachments: Array<{
        filename: string;
        originalName: string;
        mimeType: string;
        size: number;
        path: string;
      }>;
    }) => {
      const token = getAuthToken();
      const params = new URLSearchParams();
      params.append('tenantSlug', 'current'); // Will be replaced by middleware
      
      const response = await axios.put(`/api/tenant/current/support/${data.id}?${params.toString()}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate and refetch tickets list and specific ticket
      queryClient.invalidateQueries({ queryKey: ['tenant-support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-support-ticket'] });
    }
  });
};

// Hook to delete a support ticket
export const useDeleteTenantSupportTicket = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ticketId: string) => {
      const token = getAuthToken();
      const params = new URLSearchParams();
      params.append('tenantSlug', 'current'); // Will be replaced by middleware
      
      const response = await axios.delete(`/api/tenant/current/support/${ticketId}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate and refetch tickets list
      queryClient.invalidateQueries({ queryKey: ['tenant-support-tickets'] });
    }
  });
};

