import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Types
export interface SupportTicket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'pending' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'general' | 'technical' | 'billing' | 'feature-request' | 'bug-report';
  createdAt: string;
  updatedAt: string;
  userId?: string;
  tenantId?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };
  attachments: SupportTicketAttachment[];
  comments: SupportTicketComment[];
  _count: {
    comments: number;
    attachments: number;
  };
}

export interface SupportTicketAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  createdAt: string;
}

export interface SupportTicketComment {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  ticketId: string;
  commentedBy: string;
  commenterType: 'user' | 'admin';
  attachments: SupportTicketCommentAttachment[];
}

export interface SupportTicketCommentAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  createdAt: string;
}

export interface SupportTicketsFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  priority?: string;
  category?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'status' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export interface SupportTicketsResponse {
  tickets: SupportTicket[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface CreateTicketData {
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: 'general' | 'technical' | 'billing' | 'feature-request' | 'bug-report';
  attachments?: Array<{
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    path: string;
  }>;
}

export interface UpdateTicketData {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: 'general' | 'technical' | 'billing' | 'feature-request' | 'bug-report';
  status?: 'open' | 'pending' | 'closed';
}

export interface ReplyData {
  text: string;
  attachments?: Array<{
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    path: string;
  }>;
}

// Fetch support tickets list
export const useSupportTickets = (filters: SupportTicketsFilters = {}) => {
  return useQuery({
    queryKey: ['superadmin-support-tickets', filters],
    queryFn: async (): Promise<SupportTicketsResponse> => {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/superadmin/support-tickets?${params.toString()}`);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Fetch single support ticket
export const useSupportTicket = (id: string) => {
  return useQuery({
    queryKey: ['superadmin-support-ticket', id],
    queryFn: async (): Promise<{ ticket: SupportTicket }> => {
      const response = await api.get(`/superadmin/support-tickets/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Create support ticket
export const useCreateSupportTicket = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateTicketData): Promise<{ message: string; ticket: SupportTicket }> => {
      const response = await api.post('/superadmin/support-tickets', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-support-tickets'] });
    },
  });
};

// Update support ticket
export const useUpdateSupportTicket = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTicketData }): Promise<{ message: string; ticket: SupportTicket }> => {
      const response = await api.put(`/superadmin/support-tickets/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['superadmin-support-ticket', id] });
    },
  });
};

// Delete support ticket
export const useDeleteSupportTicket = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<{ message: string }> => {
      const response = await api.delete(`/superadmin/support-tickets/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-support-tickets'] });
    },
  });
};

// Add reply to support ticket
export const useAddReply = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ReplyData }): Promise<{ message: string; comment: SupportTicketComment }> => {
      const response = await api.post(`/superadmin/support-tickets/${id}/comments`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-support-ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['superadmin-support-tickets'] });
    },
  });
}; 