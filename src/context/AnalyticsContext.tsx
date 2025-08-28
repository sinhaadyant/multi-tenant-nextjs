"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AnalyticsFilters } from '@/services/analyticsApi';

export interface AnalyticsContextType {
  // Global filters
  filters: AnalyticsFilters;
  setFilters: (filters: AnalyticsFilters) => void;
  updateFilters: (updates: Partial<AnalyticsFilters>) => void;
  
  // Date range
  dateRange: {
    start: string;
    end: string;
  };
  setDateRange: (range: { start: string; end: string }) => void;
  
  // Chart states
  fullscreenChart: string | null;
  setFullscreenChart: (chartId: string | null) => void;
  
  // Export state
  isExporting: boolean;
  setIsExporting: (exporting: boolean) => void;
  
  // Refresh state
  isRefreshing: boolean;
  setIsRefreshing: (refreshing: boolean) => void;
  
  // Chart configurations
  chartConfigs: Record<string, any>;
  updateChartConfig: (chartId: string, config: any) => void;
  
  // Utility functions
  resetFilters: () => void;
  getDefaultDateRange: () => { start: string; end: string };
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

interface AnalyticsProviderProps {
  children: ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  // Default date range (last 30 days)
  const getDefaultDateRange = useCallback(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  }, []);

  // State management
  const [filters, setFiltersState] = useState<AnalyticsFilters>({
    period: 'daily',
    limit: 50
  });
  
  const [dateRange, setDateRangeState] = useState(getDefaultDateRange());
  const [fullscreenChart, setFullscreenChartState] = useState<string | null>(null);
  const [isExporting, setIsExportingState] = useState(false);
  const [isRefreshing, setIsRefreshingState] = useState(false);
  const [chartConfigs, setChartConfigsState] = useState<Record<string, any>>({});

  // Set filters with date range integration
  const setFilters = useCallback((newFilters: AnalyticsFilters) => {
    setFiltersState(newFilters);
  }, []);

  // Update filters partially
  const updateFilters = useCallback((updates: Partial<AnalyticsFilters>) => {
    setFiltersState(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  // Set date range and update filters
  const setDateRange = useCallback((range: { start: string; end: string }) => {
    setDateRangeState(range);
    setFiltersState(prev => ({
      ...prev,
      dateRange: range
    }));
  }, []);

  // Set fullscreen chart
  const setFullscreenChart = useCallback((chartId: string | null) => {
    setFullscreenChartState(chartId);
  }, []);

  // Update chart configuration
  const updateChartConfig = useCallback((chartId: string, config: any) => {
    setChartConfigsState(prev => ({
      ...prev,
      [chartId]: {
        ...prev[chartId],
        ...config
      }
    }));
  }, []);

  // Reset filters to default
  const resetFilters = useCallback(() => {
    const defaultRange = getDefaultDateRange();
    setDateRangeState(defaultRange);
    setFiltersState({
      period: 'daily',
      limit: 50,
      dateRange: defaultRange
    });
  }, [getDefaultDateRange]);

  const contextValue: AnalyticsContextType = {
    filters,
    setFilters,
    updateFilters,
    dateRange,
    setDateRange,
    fullscreenChart,
    setFullscreenChart,
    isExporting,
    setIsExporting: setIsExportingState,
    isRefreshing,
    setIsRefreshing: setIsRefreshingState,
    chartConfigs,
    updateChartConfig,
    resetFilters,
    getDefaultDateRange
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
};
