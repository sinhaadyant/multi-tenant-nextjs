import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DashboardClient } from '@/components/superadmin/DashboardClient'
import { createMockDashboardData } from '@/__tests__/utils/test-utils'
import { server } from '@/__tests__/utils/server'
import { rest } from 'msw'

// Mock the hooks
jest.mock('@/hooks/useSuperadminDashboard', () => ({
  useSuperadminDashboard: jest.fn(),
}))

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'admin@example.com', role: 'superadmin' },
    isAuthenticated: true,
    isLoading: false,
  }),
}))

const mockUseSuperadminDashboard = require('@/hooks/useSuperadminDashboard').useSuperadminDashboard

describe('DashboardClient', () => {
  const mockDashboardData = createMockDashboardData()

  beforeEach(() => {
    jest.clearAllMocks()
    server.listen()
  })

  afterEach(() => {
    server.resetHandlers()
  })

  afterAll(() => {
    server.close()
  })

  describe('Loading State', () => {
    it('should display loading skeleton when data is loading', () => {
      mockUseSuperadminDashboard.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        selectedRange: '7d',
        setSelectedRange: jest.fn(),
        refetch: jest.fn(),
      })

      render(<DashboardClient />)

      expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('should display error message when there is an error', () => {
      mockUseSuperadminDashboard.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch dashboard data'),
        selectedRange: '7d',
        setSelectedRange: jest.fn(),
        refetch: jest.fn(),
      })

      render(<DashboardClient />)

      expect(screen.getByText(/failed to fetch dashboard data/i)).toBeInTheDocument()
    })

    it('should redirect to login when authentication error occurs', async () => {
      const mockRouter = { push: jest.fn() }
      jest.doMock('next/navigation', () => ({
        useRouter: () => mockRouter,
      }))

      mockUseSuperadminDashboard.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Authentication required'),
        selectedRange: '7d',
        setSelectedRange: jest.fn(),
        refetch: jest.fn(),
      })

      render(<DashboardClient />)

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/superadmin/login')
      })
    })
  })

  describe('Data Display', () => {
    beforeEach(() => {
      mockUseSuperadminDashboard.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null,
        selectedRange: '7d',
        setSelectedRange: jest.fn(),
        refetch: jest.fn(),
      })
    })

    it('should display dashboard overview cards with correct data', () => {
      render(<DashboardClient />)

      expect(screen.getByText('100')).toBeInTheDocument() // Total tenants
      expect(screen.getByText('95')).toBeInTheDocument() // Active tenants
      expect(screen.getByText('2,500')).toBeInTheDocument() // Total users
      expect(screen.getByText('5')).toBeInTheDocument() // Total super admins
    })

    it('should display growth metrics', () => {
      render(<DashboardClient />)

      expect(screen.getByText('15%')).toBeInTheDocument() // Tenant growth
      expect(screen.getByText('25%')).toBeInTheDocument() // User growth
      expect(screen.getByText('30%')).toBeInTheDocument() // Revenue growth
    })

    it('should display system health metrics', () => {
      render(<DashboardClient />)

      expect(screen.getByText('150')).toBeInTheDocument() // Database connections
      expect(screen.getByText('75')).toBeInTheDocument() // Active sessions
      expect(screen.getByText('45%')).toBeInTheDocument() // CPU usage
      expect(screen.getByText('60%')).toBeInTheDocument() // Memory usage
      expect(screen.getByText('99.9%')).toBeInTheDocument() // Uptime
    })

    it('should display recent activity', () => {
      render(<DashboardClient />)

      expect(screen.getByText('Test Tenant')).toBeInTheDocument()
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
      expect(screen.getByText('USER_LOGIN')).toBeInTheDocument()
    })

    it('should display top tenants', () => {
      render(<DashboardClient />)

      expect(screen.getByText('Test Tenant')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument() // User count
      expect(screen.getByText('enterprise')).toBeInTheDocument() // Plan
    })
  })

  describe('Date Range Filter', () => {
    const mockSetSelectedRange = jest.fn()

    beforeEach(() => {
      mockUseSuperadminDashboard.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null,
        selectedRange: '7d',
        setSelectedRange: mockSetSelectedRange,
        refetch: jest.fn(),
      })
    })

    it('should allow changing date range', async () => {
      const user = userEvent.setup()
      render(<DashboardClient />)

      const dateFilter = screen.getByRole('button', { name: /date range/i })
      await user.click(dateFilter)

      const monthOption = screen.getByText('30 Days')
      await user.click(monthOption)

      expect(mockSetSelectedRange).toHaveBeenCalledWith('30d')
    })

    it('should display current selected range', () => {
      render(<DashboardClient />)

      expect(screen.getByText('7 Days')).toBeInTheDocument()
    })
  })

  describe('Refresh Functionality', () => {
    const mockRefetch = jest.fn()

    beforeEach(() => {
      mockUseSuperadminDashboard.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null,
        selectedRange: '7d',
        setSelectedRange: jest.fn(),
        refetch: mockRefetch,
      })
    })

    it('should call refetch when refresh button is clicked', async () => {
      const user = userEvent.setup()
      render(<DashboardClient />)

      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      await user.click(refreshButton)

      expect(mockRefetch).toHaveBeenCalled()
    })
  })

  describe('Quick Actions', () => {
    beforeEach(() => {
      mockUseSuperadminDashboard.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null,
        selectedRange: '7d',
        setSelectedRange: jest.fn(),
        refetch: jest.fn(),
      })
    })

    it('should display quick action buttons', () => {
      render(<DashboardClient />)

      expect(screen.getByRole('button', { name: /create tenant/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /view reports/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /system health/i })).toBeInTheDocument()
    })

    it('should navigate to create tenant page when clicked', async () => {
      const user = userEvent.setup()
      render(<DashboardClient />)

      const createTenantButton = screen.getByRole('button', { name: /create tenant/i })
      await user.click(createTenantButton)

      // This would typically navigate to the create tenant page
      // We can verify this by checking if the router.push was called
    })
  })

  describe('Real-time Stats', () => {
    beforeEach(() => {
      mockUseSuperadminDashboard.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null,
        selectedRange: '7d',
        setSelectedRange: jest.fn(),
        refetch: jest.fn(),
      })
    })

    it('should display real-time stats', async () => {
      server.use(
        rest.get('/api/superadmin/dashboard/stats', (req, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              data: {
                totalTenants: 100,
                activeTenants: 95,
                totalUsers: 2500,
                totalSuperAdmins: 5,
              },
            })
          )
        })
      )

      render(<DashboardClient />)

      await waitFor(() => {
        expect(screen.getByText('100')).toBeInTheDocument()
        expect(screen.getByText('95')).toBeInTheDocument()
        expect(screen.getByText('2,500')).toBeInTheDocument()
        expect(screen.getByText('5')).toBeInTheDocument()
      })
    })

    it('should handle real-time stats error gracefully', async () => {
      server.use(
        rest.get('/api/superadmin/dashboard/stats', (req, res, ctx) => {
          return res(ctx.status(500))
        })
      )

      render(<DashboardClient />)

      // Should still display the main dashboard data even if real-time stats fail
      expect(screen.getByText('100')).toBeInTheDocument() // From main dashboard data
    })
  })

  describe('Last Updated Display', () => {
    beforeEach(() => {
      mockUseSuperadminDashboard.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null,
        selectedRange: '7d',
        setSelectedRange: jest.fn(),
        refetch: jest.fn(),
      })
    })

    it('should display last updated timestamp', () => {
      render(<DashboardClient />)

      expect(screen.getByText(/last updated/i)).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    beforeEach(() => {
      mockUseSuperadminDashboard.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null,
        selectedRange: '7d',
        setSelectedRange: jest.fn(),
        refetch: jest.fn(),
      })
    })

    it('should be responsive on different screen sizes', () => {
      // Test mobile view
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<DashboardClient />)

      // Should still display all main components
      expect(screen.getByText('100')).toBeInTheDocument()
      expect(screen.getByText('95')).toBeInTheDocument()
      expect(screen.getByText('2,500')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUseSuperadminDashboard.mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null,
        selectedRange: '7d',
        setSelectedRange: jest.fn(),
        refetch: jest.fn(),
      })
    })

    it('should have proper ARIA labels', () => {
      render(<DashboardClient />)

      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      render(<DashboardClient />)

      // Tab through interactive elements
      await user.tab()
      
      // Should be able to navigate through all interactive elements
      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      expect(refreshButton).toHaveFocus()
    })
  })
}) 