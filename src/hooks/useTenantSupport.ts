import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

// Types
export interface SupportTicket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'feature-request' | 'bug-report' | 'general';
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
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
  commentsCount: number;
  attachmentsCount: number;
  lastComment?: {
    id: string;
    content: string;
    createdAt: Date;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export interface SupportTicketDetail extends SupportTicket {
  comments: SupportComment[];
  attachments: SupportAttachment[];
}

export interface SupportComment {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
  attachments: SupportAttachment[];
}

export interface SupportAttachment {
  id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  url: string;
}

export interface SupportFilters {
  search?: string;
  status?: string;
  priority?: string;
  category?: string;
}

export interface SupportStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
}

export interface SupportResponse {
  tickets: SupportTicket[];
  stats: SupportStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateTicketData {
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: 'technical' | 'billing' | 'feature-request' | 'bug-report' | 'general';
  assignedToId?: string;
}

export interface UpdateTicketData {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: 'technical' | 'billing' | 'feature-request' | 'bug-report' | 'general';
  status?: 'open' | 'in-progress' | 'resolved' | 'closed';
  assignedToId?: string;
}

export interface CreateCommentData {
  content: string;
  isInternal?: boolean;
}

// API functions
const fetchSupportTickets = async (
  tenantSlug: string,
  params: {
    page?: number;
    limit?: number;
    search?: string;
    filters?: SupportFilters;
    sortBy?: string;
    sortOrder?: string;
  }
): Promise<SupportResponse> => {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.search) searchParams.append('search', params.search);
  if (params.filters?.status) searchParams.append('status', params.filters.status);
  if (params.filters?.priority) searchParams.append('priority', params.filters.priority);
  if (params.filters?.category) searchParams.append('category', params.filters.category);
  if (params.sortBy) searchParams.append('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

  const response = await api.get(`/tenant/${tenantSlug}/support?${searchParams.toString()}`);
  return response.data;
};

const fetchSupportTicket = async (tenantSlug: string, ticketId: string): Promise<{ ticket: SupportTicketDetail }> => {
  const response = await api.get(`/tenant/${tenantSlug}/support/${ticketId}`);
  return response.data;
};

const createSupportTicket = async (tenantSlug: string, data: CreateTicketData): Promise<{ ticket: SupportTicket }> => {
  const response = await api.post(`/tenant/${tenantSlug}/support`, data);
  return response.data;
};

const updateSupportTicket = async (tenantSlug: string, ticketId: string, data: UpdateTicketData): Promise<{ ticket: SupportTicket }> => {
  const response = await api.put(`/tenant/${tenantSlug}/support/${ticketId}`, data);
  return response.data;
};

const deleteSupportTicket = async (tenantSlug: string, ticketId: string): Promise<{ message: string }> => {
  const response = await api.delete(`/tenant/${tenantSlug}/support/${ticketId}`);
  return response.data;
};

const fetchTicketComments = async (tenantSlug: string, ticketId: string, params: { page?: number; limit?: number } = {}): Promise<{ comments: SupportComment[]; pagination: any }> => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());

  const response = await api.get(`/tenant/${tenantSlug}/support/${ticketId}/comments?${searchParams.toString()}`);
  return response.data;
};

const createTicketComment = async (tenantSlug: string, ticketId: string, data: CreateCommentData): Promise<{ comment: SupportComment }> => {
  const response = await api.post(`/tenant/${tenantSlug}/support/${ticketId}/comments`, data);
  return response.data;
};

// React Query hooks
export const useSupportTickets = (
  tenantSlug: string,
  params: {
    page?: number;
    limit?: number;
    search?: string;
    filters?: SupportFilters;
    sortBy?: string;
    sortOrder?: string;
  } = {}
) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['support-tickets', tenantSlug, params],
    queryFn: () => fetchSupportTickets(tenantSlug, params),
    enabled: !!tenantSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const setPage = (page: number) => {
    queryClient.setQueryData(['support-tickets', tenantSlug, params], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pagination: { ...old.pagination, page }
      };
    });
  };

  const setPageSize = (limit: number) => {
    queryClient.setQueryData(['support-tickets', tenantSlug, params], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pagination: { ...old.pagination, limit }
      };
    });
  };

  return {
    tickets: query.data?.tickets,
    stats: query.data?.stats,
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    setPage,
    setPageSize
  };
};

export const useSupportTicket = (tenantSlug: string, ticketId: string) => {
  return useQuery({
    queryKey: ['support-ticket', tenantSlug, ticketId],
    queryFn: () => fetchSupportTicket(tenantSlug, ticketId),
    enabled: !!tenantSlug && !!ticketId,
    staleTime: 2 * 60 * 1000, // 2 minutes (shorter for ticket details)
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useTicketComments = (tenantSlug: string, ticketId: string, params: { page?: number; limit?: number } = {}) => {
  return useQuery({
    queryKey: ['ticket-comments', tenantSlug, ticketId, params],
    queryFn: () => fetchTicketComments(tenantSlug, ticketId, params),
    enabled: !!tenantSlug && !!ticketId,
    staleTime: 1 * 60 * 1000, // 1 minute (shorter for comments)
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreateTicket = (tenantSlug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTicketData) => createSupportTicket(tenantSlug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets', tenantSlug] });
      toast.success('Support ticket created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create support ticket');
    }
  });
};

export const useUpdateTicket = (tenantSlug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, data }: { ticketId: string; data: UpdateTicketData }) =>
      updateSupportTicket(tenantSlug, ticketId, data),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets', tenantSlug] });
      queryClient.invalidateQueries({ queryKey: ['support-ticket', tenantSlug, ticketId] });
      toast.success('Support ticket updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update support ticket');
    }
  });
};

export const useDeleteTicket = (tenantSlug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticketId: string) => deleteSupportTicket(tenantSlug, ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets', tenantSlug] });
      toast.success('Support ticket deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete support ticket');
    }
  });
};

export const useCreateComment = (tenantSlug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, data }: { ticketId: string; data: CreateCommentData }) =>
      createTicketComment(tenantSlug, ticketId, data),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['support-ticket', tenantSlug, ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticket-comments', tenantSlug, ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets', tenantSlug] });
      toast.success('Comment added successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    }
  });
}; 