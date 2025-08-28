import api from '@/lib/api';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

export interface AnalyticsFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  category?: string;
  tenant?: string;
  userId?: string;
  module?: string;
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  limit?: number;
}

export interface AnalyticsData {
  userActivity: Array<{
    date: string;
    users: number;
    activities: number;
    sessions: number;
  }>;
  roleDistribution: Array<{
    role: string;
    count: number;
    percentage: number;
  }>;
  moduleUsage: Array<{
    module: string;
    usage: number;
    users: number;
  }>;
  systemMetrics: Array<{
    date: string;
    cpu: number;
    memory: number;
    storage: number;
    responseTime: number;
  }>;
  userGrowth: Array<{
    date: string;
    count: number;
    newUsers: number;
    activeUsers: number;
  }>;
  auditLogs: Array<{
    date: string;
    action: string;
    count: number;
    users: number;
  }>;
  performanceMetrics: Array<{
    date: string;
    pageLoadTime: number;
    apiResponseTime: number;
    errorRate: number;
  }>;
}

export interface AnalyticsSummary {
  totalUsers: number;
  activeUsers: number;
  totalActivities: number;
  systemHealth: number;
  averageResponseTime: number;
  errorRate: number;
  storageUsed: number;
  storageTotal: number;
}

class AnalyticsApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/tenant';
  }

  /**
   * Get analytics summary for the tenant
   */
  async getAnalyticsSummary(tenantSlug: string, filters?: AnalyticsFilters): Promise<AnalyticsSummary> {
    try {
      const response = await api.get(`${this.baseUrl}/${tenantSlug}/analytics`, {
        params: { endpoint: 'summary', ...filters }
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch analytics summary');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching analytics summary:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch analytics summary');
    }
  }

  /**
   * Get user activity data
   */
  async getUserActivity(tenantSlug: string, filters?: AnalyticsFilters): Promise<AnalyticsData['userActivity']> {
    try {
      const response = await api.get(`${this.baseUrl}/${tenantSlug}/analytics`, {
        params: { endpoint: 'user-activity', ...filters }
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch user activity data');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching user activity data:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch user activity data');
    }
  }

  /**
   * Get role distribution data
   */
  async getRoleDistribution(tenantSlug: string, filters?: AnalyticsFilters): Promise<AnalyticsData['roleDistribution']> {
    try {
      const response = await api.get(`${this.baseUrl}/${tenantSlug}/analytics`, {
        params: { endpoint: 'role-distribution', ...filters }
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch role distribution data');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching role distribution data:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch role distribution data');
    }
  }

  /**
   * Get module usage data
   */
  async getModuleUsage(tenantSlug: string, filters?: AnalyticsFilters): Promise<AnalyticsData['moduleUsage']> {
    try {
      const response = await api.get(`${this.baseUrl}/${tenantSlug}/analytics`, {
        params: { endpoint: 'module-usage', ...filters }
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch module usage data');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching module usage data:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch module usage data');
    }
  }

  /**
   * Get system metrics data
   */
  async getSystemMetrics(tenantSlug: string, filters?: AnalyticsFilters): Promise<AnalyticsData['systemMetrics']> {
    try {
      const response = await api.get(`${this.baseUrl}/${tenantSlug}/analytics`, {
        params: { endpoint: 'system-metrics', ...filters }
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch system metrics data');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching system metrics data:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch system metrics data');
    }
  }

  /**
   * Get user growth data
   */
  async getUserGrowth(tenantSlug: string, filters?: AnalyticsFilters): Promise<AnalyticsData['userGrowth']> {
    try {
      const response = await api.get(`${this.baseUrl}/${tenantSlug}/analytics`, {
        params: { endpoint: 'user-growth', ...filters }
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch user growth data');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching user growth data:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch user growth data');
    }
  }

  /**
   * Get audit logs analytics
   */
  async getAuditLogsAnalytics(tenantSlug: string, filters?: AnalyticsFilters): Promise<AnalyticsData['auditLogs']> {
    try {
      const response = await api.get(`${this.baseUrl}/${tenantSlug}/analytics`, {
        params: { endpoint: 'audit-logs', ...filters }
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch audit logs analytics');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching audit logs analytics:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch audit logs analytics');
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(tenantSlug: string, filters?: AnalyticsFilters): Promise<AnalyticsData['performanceMetrics']> {
    try {
      const response = await api.get(`${this.baseUrl}/${tenantSlug}/analytics`, {
        params: { endpoint: 'performance', ...filters }
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch performance metrics');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching performance metrics:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch performance metrics');
    }
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(tenantSlug: string, format: 'png' | 'pdf' | 'csv', chartId?: string, filters?: AnalyticsFilters): Promise<Blob> {
    try {
      const response = await api.get(`${this.baseUrl}/${tenantSlug}/analytics/export`, {
        params: { 
          ...filters, 
          format,
          chartId 
        },
        responseType: 'blob'
      });

      return response.data;
    } catch (error: any) {
      console.error('Error exporting analytics data:', error);
      throw new Error(error.response?.data?.message || 'Failed to export analytics data');
    }
  }

  /**
   * Get real-time analytics data
   */
  async getRealTimeAnalytics(tenantSlug: string): Promise<{
    activeUsers: number;
    currentSessions: number;
    systemLoad: number;
    recentActivities: Array<{
      id: string;
      action: string;
      user: string;
      timestamp: string;
    }>;
  }> {
    try {
      const response = await api.get(`${this.baseUrl}/${tenantSlug}/analytics`, {
        params: { endpoint: 'realtime' }
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch real-time analytics');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching real-time analytics:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch real-time analytics');
    }
  }
}

export const analyticsApi = new AnalyticsApiService();
export default analyticsApi;
