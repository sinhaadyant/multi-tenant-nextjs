import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';

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
  createdBy?: string;
  createdByType?: 'user' | 'superadmin';
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
  createdBySuperAdmin?: {
    id: string;
    name: string;
    email: string;
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
  commenterType: 'user' | 'admin' | 'superadmin';
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

// Fetch support tickets list for SuperAdmin
export const useSuperadminSupportTickets = (filters: SupportTicketsFilters = {}) => {
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
      return response.data?.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Fetch single support ticket for SuperAdmin
export const useSuperadminSupportTicket = (id: string) => {
  return useQuery({
    queryKey: ['superadmin-support-ticket', id],
    queryFn: async (): Promise<{ ticket: SupportTicket }> => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🎫 Fetching SuperAdmin support ticket:', id);
      }
      
      const response = await api.get(`/superadmin/support-tickets/${id}`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🎫 SuperAdmin support ticket response:', {
          success: response.data.success,
          hasTicket: !!response.data.data?.ticket,
          ticketId: response.data.data?.ticket?.id,
          attachmentsCount: response.data.data?.ticket?.attachments?.length || 0,
          commentsCount: response.data.data?.ticket?.comments?.length || 0,
          _count: response.data.data?.ticket?._count
        });
      }
      
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Create support ticket
export const useCreateSuperadminSupportTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTicketData) => {
      const response = await api.post('/superadmin/support-tickets', data);
      return response.data;
    },
            onSuccess: (data) => {
          toast.success('Support ticket created successfully!');
          queryClient.invalidateQueries({ queryKey: ['superadmin-support-tickets'], exact: false });
          queryClient.invalidateQueries({ queryKey: ['support-stats'] });
          return data;
        },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create support ticket';
      toast.error(message);
    },
  });
};

// Update support ticket
export const useUpdateSuperadminSupportTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTicketData }) => {
      const response = await api.put(`/superadmin/support-tickets/${id}`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      toast.success('Support ticket updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['superadmin-support-tickets'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['superadmin-support-ticket', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['support-stats'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update support ticket';
      toast.error(message);
    },
  });
};

// Delete support ticket
export const useDeleteSuperadminSupportTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/superadmin/support-tickets/${id}`);
      return response.data;
    },
    onSuccess: (data, variables) => {
      toast.success('Support ticket deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['superadmin-support-tickets'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['support-stats'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete support ticket';
      toast.error(message);
    },
  });
};

// Add reply to support ticket
export const useAddSuperadminReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ReplyData }) => {
      const response = await api.post(`/superadmin/support-tickets/${id}/replies`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      toast.success('Reply added successfully!');
      queryClient.invalidateQueries({ queryKey: ['superadmin-support-tickets'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['superadmin-support-ticket', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['support-stats'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to add reply';
      toast.error(message);
    },
  });
};

// Update support ticket status
export const useUpdateSuperadminTicketStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await api.patch(`/superadmin/support-tickets/${id}/status`, { status });
      return response.data;
    },
    onSuccess: (data, variables) => {
      toast.success('Support ticket status updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['superadmin-support-tickets'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['superadmin-support-ticket', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['support-stats'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update ticket status';
      toast.error(message);
    },
  });
};

// Upload file attachment for SuperAdmin
export const useUploadSuperadminAttachment = () => {
  return useMutation({
    mutationFn: async (file: File): Promise<{ filename: string; path: string; originalName: string; mimeType: string; size: number }> => {
      const formData = new FormData();
      formData.append('files', file);
      
      const response = await api.post('/superadmin/support-tickets/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Handle the response structure properly
      if (response.data.success && response.data.data.files && response.data.data.files.length > 0) {
        return response.data.data.files[0];
      } else {
        throw new Error('File upload failed or no files returned');
      }
    },
  });
};
