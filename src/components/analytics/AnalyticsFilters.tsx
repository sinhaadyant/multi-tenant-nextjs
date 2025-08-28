"use client";

import React, { useState } from 'react';
import { useAnalytics } from '@/context/AnalyticsContext';
import { useReduxAuth } from '@/hooks/useReduxAuth';
import {
  Calendar,
  Filter,
  RefreshCw,
  X,
  ChevronDown,
  CalendarDays,
  BarChart3,
  Users,
  Activity
} from 'lucide-react';
import { Dropdown } from '@/components/ui/dropdown/Dropdown';
import { DropdownItem } from '@/components/ui/dropdown/DropdownItem';
import Button from '@/components/ui/button/Button';

export interface AnalyticsFiltersProps {
  className?: string;
  showDateRange?: boolean;
  showCategory?: boolean;
  showPeriod?: boolean;
  showModule?: boolean;
  showUser?: boolean;
  onRefresh?: () => void;
}

export const AnalyticsFilters: React.FC<AnalyticsFiltersProps> = ({
  className = '',
  showDateRange = true,
  showCategory = true,
  showPeriod = true,
  showModule = true,
  showUser = false,
  onRefresh
}) => {
  const { user, tenant } = useReduxAuth();
  const {
    filters,
    updateFilters,
    dateRange,
    setDateRange,
    resetFilters,
    isRefreshing,
    setIsRefreshing
  } = useAnalytics();

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [isModuleOpen, setIsModuleOpen] = useState(false);

  // Predefined date ranges
  const dateRanges = [
    { label: 'Last 7 Days', value: '7d', start: 7 },
    { label: 'Last 30 Days', value: '30d', start: 30 },
    { label: 'Last 60 Days', value: '60d', start: 60 },
    { label: 'Last 90 Days', value: '90d', start: 90 },
    { label: 'All Time', value: 'all', start: null },
    { label: 'Custom', value: 'custom', start: null }
  ];

  // Categories
  const categories = [
    { label: 'All Categories', value: '' },
    { label: 'User Management', value: 'user-management' },
    { label: 'Role Management', value: 'role-management' },
    { label: 'System Activity', value: 'system-activity' },
    { label: 'Performance', value: 'performance' },
    { label: 'Security', value: 'security' }
  ];

  // Periods
  const periods = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' }
  ];

  // Modules (dynamic based on tenant)
  const modules = [
    { label: 'All Modules', value: '' },
    { label: 'Dashboard', value: 'dashboard' },
    { label: 'Users', value: 'users' },
    { label: 'Roles', value: 'roles' },
    { label: 'Analytics', value: 'analytics' },
    { label: 'Settings', value: 'settings' },
    { label: 'Support', value: 'support' }
  ];

  // Handle date range selection
  const handleDateRangeSelect = (range: typeof dateRanges[0]) => {
    if (range.value === 'custom') {
      setIsDatePickerOpen(true);
      return;
    }

    const end = new Date();
    let start: Date;

    if (range.value === 'all') {
      // For "All Time", set start date to a very old date (e.g., 5 years ago)
      start = new Date();
      start.setFullYear(start.getFullYear() - 5);
    } else {
      start = new Date();
      start.setDate(start.getDate() - (range.start || 0));
    }

    const newRange = {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };

    setDateRange(newRange);
    setIsDatePickerOpen(false);
  };

  // Handle custom date input
  const handleCustomDateChange = (field: 'start' | 'end', value: string) => {
    const newRange = { ...dateRange, [field]: value };
    setDateRange(newRange);
  };

  // Handle category selection
  const handleCategorySelect = (category: string) => {
    updateFilters({ category });
    setIsCategoryOpen(false);
  };

  // Handle period selection
  const handlePeriodSelect = (period: string) => {
    updateFilters({ period: period as 'daily' | 'weekly' | 'monthly' | 'yearly' });
    setIsPeriodOpen(false);
  };

  // Handle module selection
  const handleModuleSelect = (module: string) => {
    updateFilters({ module });
    setIsModuleOpen(false);
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      onRefresh?.();
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  // Get current date range label
  const getCurrentDateRangeLabel = () => {
    const range = dateRanges.find(r => {
      if (r.value === 'custom' || r.value === 'all') return false;
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - (r.start || 0));
      return start.toISOString().split('T')[0] === dateRange.start && 
             end.toISOString().split('T')[0] === dateRange.end;
    });
    return range?.label || 'Custom Range';
  };

  // Get current category label
  const getCurrentCategoryLabel = () => {
    const category = categories.find(c => c.value === filters.category);
    return category?.label || 'All Categories';
  };

  // Get current period label
  const getCurrentPeriodLabel = () => {
    const period = periods.find(p => p.value === filters.period);
    return period?.label || 'Daily';
  };

  // Get current module label
  const getCurrentModuleLabel = () => {
    const module = modules.find(m => m.value === filters.module);
    return module?.label || 'All Modules';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <div className="flex flex-wrap items-center gap-3">
        {/* Date Range Filter */}
        {showDateRange && (
          <div className="relative">
            <button 
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              <Calendar className="w-4 h-4 mr-2" />
              {getCurrentDateRangeLabel()}
              <ChevronDown className="w-4 h-4 ml-2" />
            </button>
            <Dropdown
              isOpen={isDatePickerOpen}
              onClose={() => setIsDatePickerOpen(false)}
            >
            {dateRanges.map((range) => (
              <DropdownItem
                key={range.value}
                onClick={() => handleDateRangeSelect(range)}
                className="flex items-center space-x-2"
              >
                <CalendarDays className="w-4 h-4" />
                <span>{range.label}</span>
              </DropdownItem>
            ))}
            </Dropdown>
          </div>
        )}

        {/* Category Filter */}
        {showCategory && (
          <div className="relative">
            <button 
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              <Filter className="w-4 h-4 mr-2" />
              {getCurrentCategoryLabel()}
              <ChevronDown className="w-4 h-4 ml-2" />
            </button>
            <Dropdown
              isOpen={isCategoryOpen}
              onClose={() => setIsCategoryOpen(false)}
            >
              {categories.map((category) => (
                <DropdownItem
                  key={category.value}
                  onClick={() => handleCategorySelect(category.value)}
                  className="flex items-center space-x-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>{category.label}</span>
                </DropdownItem>
              ))}
            </Dropdown>
          </div>
        )}

        {/* Period Filter */}
        {showPeriod && (
          <div className="relative">
            <button 
              onClick={() => setIsPeriodOpen(!isPeriodOpen)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              <Activity className="w-4 h-4 mr-2" />
              {getCurrentPeriodLabel()}
              <ChevronDown className="w-4 h-4 ml-2" />
            </button>
            <Dropdown
              isOpen={isPeriodOpen}
              onClose={() => setIsPeriodOpen(false)}
            >
              {periods.map((period) => (
                <DropdownItem
                  key={period.value}
                  onClick={() => handlePeriodSelect(period.value)}
                  className="flex items-center space-x-2"
                >
                  <Activity className="w-4 h-4" />
                  <span>{period.label}</span>
                </DropdownItem>
              ))}
            </Dropdown>
          </div>
        )}

        {/* Module Filter */}
        {showModule && (
          <div className="relative">
            <button 
              onClick={() => setIsModuleOpen(!isModuleOpen)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              <Users className="w-4 h-4 mr-2" />
              {getCurrentModuleLabel()}
              <ChevronDown className="w-4 h-4 ml-2" />
            </button>
            <Dropdown
              isOpen={isModuleOpen}
              onClose={() => setIsModuleOpen(false)}
            >
            {modules.map((module) => (
              <DropdownItem
                key={module.value}
                onClick={() => handleModuleSelect(module.value)}
                className="flex items-center space-x-2"
              >
                <Users className="w-4 h-4" />
                <span>{module.label}</span>
              </DropdownItem>
            ))}
            </Dropdown>
          </div>
        )}

        {/* Custom Date Range Inputs */}
        {isDatePickerOpen && (
          <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => handleCustomDateChange('start', e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-600 dark:border-gray-500 dark:text-white"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => handleCustomDateChange('end', e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-600 dark:border-gray-500 dark:text-white"
            />
            <button
              onClick={() => setIsDatePickerOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 ml-auto">
          <Button
            onClick={resetFilters}
            variant="outline"
            size="sm"
            className="text-gray-600 dark:text-gray-300"
          >
            Reset
          </Button>
          
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="text-gray-600 dark:text-gray-300"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Active Filters Summary */}
      {(filters.category || filters.module || filters.period !== 'daily') && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Active filters:</span>
            {filters.category && (
              <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs dark:bg-blue-900 dark:text-blue-200">
                Category: {getCurrentCategoryLabel()}
              </span>
            )}
            {filters.module && (
              <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs dark:bg-green-900 dark:text-green-200">
                Module: {getCurrentModuleLabel()}
              </span>
            )}
            {filters.period !== 'daily' && (
              <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs dark:bg-purple-900 dark:text-purple-200">
                Period: {getCurrentPeriodLabel()}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
