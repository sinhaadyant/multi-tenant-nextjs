import { useState, useEffect, useMemo, useCallback } from 'react';
import { storage } from '@/lib/localStorage';
import api from '@/lib/api';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  status: 'active' | 'pending' | 'suspended';
  owner: { name: string; email: string };
  createdAt: string;
  lastActive: string;
  userCount: number;
  activeUsers: number;
  plan: 'starter' | 'professional' | 'enterprise';
  region: string;
  features: string[];
  description?: string;
}

export interface FilterState {
  status: string[];
  dateRange: { start: string; end: string } | null;
  owner: string;
  search: string;
  features: string[];
  sortBy: 'name' | 'createdAt' | 'userCount' | 'status';
  sortOrder: 'asc' | 'desc';
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
}

export interface TenantsManagementState {
  tenants: Tenant[];
  filteredTenants: Tenant[];
  viewMode: 'table' | 'card';
  filters: FilterState;
  pagination: PaginationState;
  loading: boolean;
  selectedTenants: string[];
  searchTerm: string;
}

export const useTenantsManagement = () => {
  const [state, setState] = useState<TenantsManagementState>({
    tenants: [],
    filteredTenants: [],
    viewMode: 'table',
    filters: {
      status: [],
      dateRange: null,
      owner: '',
      search: '',
      features: [],
      sortBy: 'createdAt',
      sortOrder: 'desc'
    },
    pagination: {
      currentPage: 1,
      pageSize: 10,
      totalItems: 0
    },
    loading: true,
    selectedTenants: [],
    searchTerm: ''
  });

  // Load data
  useEffect(() => {
    const loadTenants = async () => {
      setState(prev => ({ ...prev, loading: true }));
      
      try {
        const response = await api.get('/superadmin/tenants');
        
        if (response.data.success) {
          setState(prev => ({
            ...prev,
            tenants: response.data.data.tenants || [],
            loading: false
          }));
        } else {
          throw new Error(response.data.message || 'Failed to fetch tenants');
        }
      } catch (error: any) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error loading tenants:', error);
        }
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    loadTenants();
  }, []);

  // Apply filters and search
  const filteredTenants = useMemo(() => {
    let filtered = [...state.tenants];

    // Status filter
    if (state.filters.status.length > 0) {
      filtered = filtered.filter(tenant => 
        state.filters.status.includes(tenant.status)
      );
    }

    // Date range filter
    if (state.filters.dateRange) {
      const { start, end } = state.filters.dateRange;
      filtered = filtered.filter(tenant => {
        const createdDate = new Date(tenant.createdAt);
        const startDate = new Date(start);
        const endDate = new Date(end);
        return createdDate >= startDate && createdDate <= endDate;
      });
    }

    // Owner filter
    if (state.filters.owner) {
      filtered = filtered.filter(tenant =>
        tenant.owner.name.toLowerCase().includes(state.filters.owner.toLowerCase()) ||
        tenant.owner.email.toLowerCase().includes(state.filters.owner.toLowerCase())
      );
    }

    // Features filter
    if (state.filters.features.length > 0) {
      filtered = filtered.filter(tenant =>
        state.filters.features.every(feature => tenant.features.includes(feature))
      );
    }

    // Search filter
    if (state.searchTerm) {
      const searchLower = state.searchTerm.toLowerCase();
      filtered = filtered.filter(tenant =>
        tenant.name.toLowerCase().includes(searchLower) ||
        tenant.slug.toLowerCase().includes(searchLower) ||
        tenant.owner.name.toLowerCase().includes(searchLower) ||
        tenant.owner.email.toLowerCase().includes(searchLower)
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (state.filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'userCount':
          aValue = a.userCount;
          bValue = b.userCount;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (state.filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [state.tenants, state.filters, state.searchTerm]);

  // Paginated tenants
  const paginatedTenants = useMemo(() => {
    const startIndex = (state.pagination.currentPage - 1) * state.pagination.pageSize;
    const endIndex = startIndex + state.pagination.pageSize;
    return filteredTenants.slice(startIndex, endIndex);
  }, [filteredTenants, state.pagination.currentPage, state.pagination.pageSize]);

  // Update pagination total
  useEffect(() => {
    setState(prev => ({
      ...prev,
      pagination: {
        ...prev.pagination,
        totalItems: filteredTenants.length
      }
    }));
  }, [filteredTenants.length]);

  // Actions
  const setViewMode = useCallback((mode: 'table' | 'card') => {
    setState(prev => ({ ...prev, viewMode: mode }));
  }, []);

  const setSearchTerm = useCallback((term: string) => {
    setState(prev => ({ 
      ...prev, 
      searchTerm: term,
      pagination: { ...prev.pagination, currentPage: 1 }
    }));
  }, []);

  const applyFilter = useCallback((filterType: keyof FilterState, value: any) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, [filterType]: value },
      pagination: { ...prev.pagination, currentPage: 1 }
    }));
  }, []);

  const clearFilter = useCallback((filterType?: keyof FilterState) => {
    if (filterType) {
      setState(prev => ({
        ...prev,
        filters: { ...prev.filters, [filterType]: Array.isArray(prev.filters[filterType]) ? [] : '' },
        pagination: { ...prev.pagination, currentPage: 1 }
      }));
    } else {
      setState(prev => ({
        ...prev,
        filters: {
          status: [],
          dateRange: null,
          owner: '',
          search: '',
          features: [],
          sortBy: 'createdAt',
          sortOrder: 'desc'
        },
        pagination: { ...prev.pagination, currentPage: 1 }
      }));
    }
  }, []);

  const changePage = useCallback((page: number) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, currentPage: page }
    }));
  }, []);

  const setPageSize = useCallback((size: number) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, pageSize: size, currentPage: 1 }
    }));
  }, []);

  const toggleTenantSelection = useCallback((tenantId: string) => {
    setState(prev => ({
      ...prev,
      selectedTenants: prev.selectedTenants.includes(tenantId)
        ? prev.selectedTenants.filter(id => id !== tenantId)
        : [...prev.selectedTenants, tenantId]
    }));
  }, []);

  const selectAllTenants = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedTenants: paginatedTenants.map(tenant => tenant.id)
    }));
  }, [paginatedTenants]);

  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedTenants: []
    }));
  }, []);

  return {
    // State
    tenants: paginatedTenants,
    allTenants: filteredTenants,
    viewMode: state.viewMode,
    filters: state.filters,
    pagination: state.pagination,
    loading: state.loading,
    selectedTenants: state.selectedTenants,
    searchTerm: state.searchTerm,
    
    // Actions
    setViewMode,
    setSearchTerm,
    applyFilter,
    clearFilter,
    changePage,
    setPageSize,
    toggleTenantSelection,
    selectAllTenants,
    clearSelection,
  };
}; 