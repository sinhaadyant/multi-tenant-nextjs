import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'react-redux'
import { store } from '@/store/store'
import { ThemeProvider } from '@/context/ThemeContext'
import { ToastProvider } from '@/context/ToastContext'
import { SidebarProvider } from '@/context/SidebarContext'

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ToastProvider>
            <SidebarProvider>
              {children}
            </SidebarProvider>
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Custom matchers for testing
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0))
}

// Mock data generators
export const createMockTenant = (overrides = {}) => ({
  id: 'tenant-1',
  name: 'Test Tenant',
  slug: 'test-tenant',
  domain: 'test-tenant.example.com',
  isActive: true,
  plan: 'professional',
  userCount: 25,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  isActive: true,
  lastLogin: '2024-01-01T00:00:00Z',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  tenant: {
    id: 'tenant-1',
    name: 'Test Tenant',
    slug: 'test-tenant',
  },
  role: {
    id: 'role-1',
    name: 'admin',
    description: 'Administrator role',
  },
  ...overrides,
})

export const createMockAuditLog = (overrides = {}) => ({
  id: 'audit-1',
  action: 'USER_LOGIN',
  description: 'User logged in successfully',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  userId: 'user-1',
  tenantId: 'tenant-1',
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockDashboardData = (overrides = {}) => ({
  summary: {
    totalTenants: 100,
    activeTenants: 95,
    totalUsers: 2500,
    totalSuperAdmins: 5,
    growthMetrics: {
      tenantGrowth: 15,
      userGrowth: 25,
      revenueGrowth: 30,
    },
  },
  charts: {
    userSignups: [
      { date: '2024-01-01', count: 10 },
      { date: '2024-01-02', count: 15 },
    ],
    tenantActivity: [
      { date: '2024-01-01', count: 5 },
      { date: '2024-01-02', count: 8 },
    ],
    roleDistribution: [
      { role: 'admin', count: 50 },
      { role: 'user', count: 200 },
    ],
    tenantPlanDistribution: [
      { plan: 'starter', count: 30 },
      { plan: 'professional', count: 45 },
      { plan: 'enterprise', count: 25 },
    ],
  },
  systemHealth: {
    databaseConnections: 150,
    activeSessions: 75,
    cpuUsage: 45,
    memoryUsage: 60,
    uptime: 99.9,
  },
  recentActivity: {
    auditLogs: [
      {
        id: 'audit-1',
        action: 'USER_LOGIN',
        createdAt: '2024-01-01T00:00:00Z',
        tenant: { name: 'Test Tenant', slug: 'test-tenant' },
        user: { email: 'test@example.com', name: 'Test User' },
        superAdmin: null,
      },
    ],
  },
  topTenants: [
    {
      id: 'tenant-1',
      name: 'Test Tenant',
      slug: 'test-tenant',
      userCount: 100,
      plan: 'enterprise',
    },
  ],
  ...overrides,
}) 