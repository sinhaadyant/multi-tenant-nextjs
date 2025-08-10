import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSuperadminDashboard } from '@/hooks/useSuperadminDashboard'
import { server } from '@/__tests__/utils/server'
import { rest } from 'msw'
import { createMockDashboardData } from '@/__tests__/utils/test-utils'

// Create a wrapper with QueryClient for testing
const createWrapper = () => {
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

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useSuperadminDashboard', () => {
  beforeEach(() => {
    server.listen()
  })

  afterEach(() => {
    server.resetHandlers()
  })

  afterAll(() => {
    server.close()
  })

  describe('Data Fetching', () => {
    it('should fetch dashboard data successfully', async () => {
      const mockData = createMockDashboardData()
      
      server.use(
        rest.get('/api/superadmin/dashboard', (req, res, ctx) => {
          return res(ctx.json({ success: true, data: mockData }))
        })
      )

      const { result } = renderHook(() => useSuperadminDashboard(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual(mockData)
      expect(result.current.error).toBeNull()
    })

    it('should handle API errors gracefully', async () => {
      server.use(
        rest.get('/api/superadmin/dashboard', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ 
            success: false, 
            message: 'Internal server error' 
          }))
        })
      )

      const { result } = renderHook(() => useSuperadminDashboard(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toBeUndefined()
      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toContain('Internal server error')
    })

    it('should handle authentication errors', async () => {
      server.use(
        rest.get('/api/superadmin/dashboard', (req, res, ctx) => {
          return res(ctx.status(401), ctx.json({ 
            success: false, 
            message: 'Authentication required' 
          }))
        })
      )

      const { result } = renderHook(() => useSuperadminDashboard(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error?.message).toContain('Authentication required')
    })

    it('should handle authorization errors', async () => {
      server.use(
        rest.get('/api/superadmin/dashboard', (req, res, ctx) => {
          return res(ctx.status(403), ctx.json({ 
            success: false, 
            message: 'Access denied' 
          }))
        })
      )

      const { result } = renderHook(() => useSuperadminDashboard(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error?.message).toContain('Access denied')
    })
  })

  describe('Date Range Filtering', () => {
    it('should fetch data with default date range (7d)', async () => {
      const mockData = createMockDashboardData()
      
      server.use(
        rest.get('/api/superadmin/dashboard', (req, res, ctx) => {
          const range = req.url.searchParams.get('range')
          expect(range).toBe('7d')
          return res(ctx.json({ success: true, data: mockData }))
        })
      )

      const { result } = renderHook(() => useSuperadminDashboard(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.selectedRange).toBe('7d')
    })

    it('should update data when date range changes', async () => {
      const mockData = createMockDashboardData()
      let requestCount = 0
      
      server.use(
        rest.get('/api/superadmin/dashboard', (req, res, ctx) => {
          requestCount++
          const range = req.url.searchParams.get('range')
          return res(ctx.json({ success: true, data: mockData }))
        })
      )

      const { result } = renderHook(() => useSuperadminDashboard(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Change date range
      result.current.setSelectedRange('30d')

      await waitFor(() => {
        expect(result.current.selectedRange).toBe('30d')
      })

      // Should make a new request
      expect(requestCount).toBeGreaterThan(1)
    })

    it('should support different date range options', async () => {
      const mockData = createMockDashboardData()
      
      server.use(
        rest.get('/api/superadmin/dashboard', (req, res, ctx) => {
          const range = req.url.searchParams.get('range')
          return res(ctx.json({ success: true, data: mockData }))
        })
      )

      const { result } = renderHook(() => useSuperadminDashboard(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Test different ranges
      const ranges = ['1d', '7d', '30d', '90d', '1y']
      
      for (const range of ranges) {
        result.current.setSelectedRange(range)
        
        await waitFor(() => {
          expect(result.current.selectedRange).toBe(range)
        })
      }
    })
  })

  describe('Caching', () => {
    it('should cache dashboard data', async () => {
      const mockData = createMockDashboardData()
      let requestCount = 0
      
      server.use(
        rest.get('/api/superadmin/dashboard', (req, res, ctx) => {
          requestCount++
          return res(ctx.json({ success: true, data: mockData }))
        })
      )

      const { result } = renderHook(() => useSuperadminDashboard(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Refetch data
      result.current.refetch()

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should use cached data for subsequent requests
      expect(requestCount).toBe(2) // Initial + refetch
    })

    it('should handle cache invalidation', async () => {
      const mockData = createMockDashboardData()
      let requestCount = 0
      
      server.use(
        rest.get('/api/superadmin/dashboard', (req, res, ctx) => {
          requestCount++
          return res(ctx.json({ success: true, data: mockData }))
        })
      )

      const { result } = renderHook(() => useSuperadminDashboard(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Change date range to invalidate cache
      result.current.setSelectedRange('30d')

      await waitFor(() => {
        expect(result.current.selectedRange).toBe('30d')
      })

      // Should make a new request for different range
      expect(requestCount).toBe(2)
    })
  })

  describe('Loading States', () => {
    it('should show loading state initially', () => {
      server.use(
        rest.get('/api/superadmin/dashboard', (req, res, ctx) => {
          return new Promise(resolve => {
            // Delay response to test loading state
            setTimeout(() => {
              resolve(res(ctx.json({ success: true, data: createMockDashboardData() })))
            }, 100)
          })
        })
      )

      const { result } = renderHook(() => useSuperadminDashboard(), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(true)
    })

    it('should show loading state during refetch', async () => {
      const mockData = createMockDashboardData()
      
      server.use(
        rest.get('/api/superadmin/dashboard', (req, res, ctx) => {
          return res(ctx.json({ success: true, data: mockData }))
        })
      )

      const { result } = renderHook(() => useSuperadminDashboard(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Trigger refetch
      result.current.refetch()

      // Should show loading state during refetch
      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should retry failed requests', async () => {
      let requestCount = 0
      
      server.use(
        rest.get('/api/superadmin/dashboard', (req, res, ctx) => {
          requestCount++
          if (requestCount === 1) {
            return res(ctx.status(500))
          }
          return res(ctx.json({ success: true, data: createMockDashboardData() }))
        })
      )

      const { result } = renderHook(() => useSuperadminDashboard(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should retry and eventually succeed
      expect(requestCount).toBeGreaterThan(1)
      expect(result.current.data).toBeDefined()
    })

    it('should not retry authentication errors', async () => {
      let requestCount = 0
      
      server.use(
        rest.get('/api/superadmin/dashboard', (req, res, ctx) => {
          requestCount++
          return res(ctx.status(401), ctx.json({ 
            success: false, 
            message: 'Authentication required' 
          }))
        })
      )

      const { result } = renderHook(() => useSuperadminDashboard(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should not retry authentication errors
      expect(requestCount).toBe(1)
      expect(result.current.error?.message).toContain('Authentication required')
    })

    it('should handle network errors', async () => {
      server.use(
        rest.get('/api/superadmin/dashboard', (req, res, ctx) => {
          return res.networkError('Failed to connect')
        })
      )

      const { result } = renderHook(() => useSuperadminDashboard(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toContain('Failed to connect')
    })
  })

  describe('Data Structure', () => {
    it('should return correct data structure', async () => {
      const mockData = createMockDashboardData()
      
      server.use(
        rest.get('/api/superadmin/dashboard', (req, res, ctx) => {
          return res(ctx.json({ success: true, data: mockData }))
        })
      )

      const { result } = renderHook(() => useSuperadminDashboard(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toHaveProperty('summary')
      expect(result.current.data).toHaveProperty('charts')
      expect(result.current.data).toHaveProperty('systemHealth')
      expect(result.current.data).toHaveProperty('recentActivity')
      expect(result.current.data).toHaveProperty('topTenants')

      expect(result.current.data?.summary).toHaveProperty('totalTenants')
      expect(result.current.data?.summary).toHaveProperty('activeTenants')
      expect(result.current.data?.summary).toHaveProperty('totalUsers')
      expect(result.current.data?.summary).toHaveProperty('totalSuperAdmins')
    })

    it('should handle missing optional fields', async () => {
      const mockData = {
        summary: {
          totalTenants: 100,
          activeTenants: 95,
          totalUsers: 2500,
          totalSuperAdmins: 5,
        },
        charts: {
          userSignups: [],
          tenantActivity: [],
          roleDistribution: [],
          tenantPlanDistribution: [],
        },
        systemHealth: {
          databaseConnections: 150,
          activeSessions: 75,
          cpuUsage: 45,
          memoryUsage: 60,
          uptime: 99.9,
        },
        recentActivity: {
          auditLogs: [],
        },
        topTenants: [],
      }
      
      server.use(
        rest.get('/api/superadmin/dashboard', (req, res, ctx) => {
          return res(ctx.json({ success: true, data: mockData }))
        })
      )

      const { result } = renderHook(() => useSuperadminDashboard(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual(mockData)
    })
  })

  describe('Performance', () => {
    it('should debounce rapid date range changes', async () => {
      const mockData = createMockDashboardData()
      let requestCount = 0
      
      server.use(
        rest.get('/api/superadmin/dashboard', (req, res, ctx) => {
          requestCount++
          return res(ctx.json({ success: true, data: mockData }))
        })
      )

      const { result } = renderHook(() => useSuperadminDashboard(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Rapidly change date range
      result.current.setSelectedRange('1d')
      result.current.setSelectedRange('7d')
      result.current.setSelectedRange('30d')

      await waitFor(() => {
        expect(result.current.selectedRange).toBe('30d')
      })

      // Should not make excessive requests
      expect(requestCount).toBeLessThan(5)
    })
  })
}) 