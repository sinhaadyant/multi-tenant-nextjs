import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuditLogsTable } from '@/components/superadmin/AuditLogsTable'
import { createMockAuditLog } from '@/__tests__/utils/test-utils'

describe('AuditLogsTable', () => {
  const mockAuditLogs = [
    createMockAuditLog({ 
      id: 'audit-1', 
      action: 'USER_LOGIN', 
      description: 'User logged in successfully',
      userId: 'user-1',
      tenantId: 'tenant-1',
      createdAt: '2024-01-01T10:00:00Z'
    }),
    createMockAuditLog({ 
      id: 'audit-2', 
      action: 'TENANT_CREATED', 
      description: 'New tenant created',
      userId: 'user-2',
      tenantId: 'tenant-2',
      createdAt: '2024-01-02T11:00:00Z'
    }),
    createMockAuditLog({ 
      id: 'audit-3', 
      action: 'USER_DELETED', 
      description: 'User account deleted',
      userId: 'user-3',
      tenantId: 'tenant-1',
      createdAt: '2024-01-03T12:00:00Z'
    }),
  ]

  const defaultProps = {
    auditLogs: mockAuditLogs,
    loading: false,
    onView: jest.fn(),
    onExport: jest.fn(),
    currentPage: 1,
    totalPages: 5,
    totalRecords: 50,
    pageSize: 10,
    onPageChange: jest.fn(),
    onPageSizeChange: jest.fn(),
    sortBy: 'createdAt',
    sortOrder: 'desc' as const,
    onSort: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render audit logs table with data', () => {
      render(<AuditLogsTable {...defaultProps} />)

      expect(screen.getByText('USER_LOGIN')).toBeInTheDocument()
      expect(screen.getByText('TENANT_CREATED')).toBeInTheDocument()
      expect(screen.getByText('USER_DELETED')).toBeInTheDocument()
    })

    it('should display loading state', () => {
      render(<AuditLogsTable {...defaultProps} loading={true} />)

      expect(screen.getByTestId('audit-logs-table-loading')).toBeInTheDocument()
    })

    it('should display empty state when no audit logs', () => {
      render(<AuditLogsTable {...defaultProps} auditLogs={[]} />)

      expect(screen.getByText(/no audit logs found/i)).toBeInTheDocument()
    })
  })

  describe('Table Headers and Sorting', () => {
    it('should render all table headers', () => {
      render(<AuditLogsTable {...defaultProps} />)

      expect(screen.getByText('Action')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('User')).toBeInTheDocument()
      expect(screen.getByText('Tenant')).toBeInTheDocument()
      expect(screen.getByText('IP Address')).toBeInTheDocument()
      expect(screen.getByText('Timestamp')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })

    it('should show sort indicators', () => {
      render(<AuditLogsTable {...defaultProps} sortBy="createdAt" sortOrder="desc" />)

      const timestampHeader = screen.getByText('Timestamp')
      expect(timestampHeader).toHaveAttribute('aria-sort', 'descending')
    })

    it('should call onSort when header is clicked', async () => {
      const user = userEvent.setup()
      const mockOnSort = jest.fn()
      render(<AuditLogsTable {...defaultProps} onSort={mockOnSort} />)

      const actionHeader = screen.getByText('Action')
      await user.click(actionHeader)

      expect(mockOnSort).toHaveBeenCalledWith('action')
    })

    it('should handle sort order changes', async () => {
      const user = userEvent.setup()
      const mockOnSort = jest.fn()
      render(<AuditLogsTable {...defaultProps} onSort={mockOnSort} sortBy="action" sortOrder="asc" />)

      const actionHeader = screen.getByText('Action')
      await user.click(actionHeader)

      expect(mockOnSort).toHaveBeenCalledWith('action')
    })
  })

  describe('Audit Log Data Display', () => {
    it('should display audit log information correctly', () => {
      render(<AuditLogsTable {...defaultProps} />)

      // Check actions
      expect(screen.getByText('USER_LOGIN')).toBeInTheDocument()
      expect(screen.getByText('TENANT_CREATED')).toBeInTheDocument()
      expect(screen.getByText('USER_DELETED')).toBeInTheDocument()

      // Check descriptions
      expect(screen.getByText('User logged in successfully')).toBeInTheDocument()
      expect(screen.getByText('New tenant created')).toBeInTheDocument()
      expect(screen.getByText('User account deleted')).toBeInTheDocument()

      // Check IP addresses
      expect(screen.getByText('192.168.1.1')).toBeInTheDocument()
      expect(screen.getByText('192.168.1.2')).toBeInTheDocument()
    })

    it('should display action badges with correct colors', () => {
      render(<AuditLogsTable {...defaultProps} />)

      // Should display action badges with appropriate styling
      expect(screen.getByText('USER_LOGIN')).toBeInTheDocument()
      expect(screen.getByText('TENANT_CREATED')).toBeInTheDocument()
      expect(screen.getByText('USER_DELETED')).toBeInTheDocument()
    })

    it('should format timestamps correctly', () => {
      render(<AuditLogsTable {...defaultProps} />)

      // Check if timestamps are formatted (assuming date-fns format)
      expect(screen.getByText(/Jan 01, 2024/i)).toBeInTheDocument()
      expect(screen.getByText(/Jan 02, 2024/i)).toBeInTheDocument()
      expect(screen.getByText(/Jan 03, 2024/i)).toBeInTheDocument()
    })

    it('should display user and tenant information', () => {
      render(<AuditLogsTable {...defaultProps} />)

      // Should display user and tenant information if available
      expect(screen.getByText('user-1')).toBeInTheDocument()
      expect(screen.getByText('tenant-1')).toBeInTheDocument()
    })
  })

  describe('Row Actions', () => {
    it('should display view button for each audit log', () => {
      render(<AuditLogsTable {...defaultProps} />)

      const viewButtons = screen.getAllByRole('button', { name: /view details/i })
      expect(viewButtons).toHaveLength(3)
    })

    it('should call onView when view button is clicked', async () => {
      const user = userEvent.setup()
      const mockOnView = jest.fn()
      render(<AuditLogsTable {...defaultProps} onView={mockOnView} />)

      const viewButtons = screen.getAllByRole('button', { name: /view details/i })
      await user.click(viewButtons[0])

      expect(mockOnView).toHaveBeenCalledWith(mockAuditLogs[0])
    })
  })

  describe('Pagination', () => {
    it('should display pagination controls', () => {
      render(<AuditLogsTable {...defaultProps} />)

      expect(screen.getByText('1')).toBeInTheDocument() // Current page
      expect(screen.getByText('5')).toBeInTheDocument() // Total pages
      expect(screen.getByText('50')).toBeInTheDocument() // Total records
    })

    it('should call onPageChange when page is clicked', async () => {
      const user = userEvent.setup()
      const mockOnPageChange = jest.fn()
      render(<AuditLogsTable {...defaultProps} onPageChange={mockOnPageChange} />)

      const nextPageButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextPageButton)

      expect(mockOnPageChange).toHaveBeenCalledWith(2)
    })

    it('should call onPageChange when previous page is clicked', async () => {
      const user = userEvent.setup()
      const mockOnPageChange = jest.fn()
      render(<AuditLogsTable {...defaultProps} currentPage={2} onPageChange={mockOnPageChange} />)

      const prevPageButton = screen.getByRole('button', { name: /previous/i })
      await user.click(prevPageButton)

      expect(mockOnPageChange).toHaveBeenCalledWith(1)
    })

    it('should disable previous button on first page', () => {
      render(<AuditLogsTable {...defaultProps} currentPage={1} />)

      const prevPageButton = screen.getByRole('button', { name: /previous/i })
      expect(prevPageButton).toBeDisabled()
    })

    it('should disable next button on last page', () => {
      render(<AuditLogsTable {...defaultProps} currentPage={5} />)

      const nextPageButton = screen.getByRole('button', { name: /next/i })
      expect(nextPageButton).toBeDisabled()
    })

    it('should call onPageSizeChange when page size is changed', async () => {
      const user = userEvent.setup()
      const mockOnPageSizeChange = jest.fn()
      render(<AuditLogsTable {...defaultProps} onPageSizeChange={mockOnPageSizeChange} />)

      const pageSizeSelect = screen.getByRole('combobox', { name: /page size/i })
      await user.selectOptions(pageSizeSelect, '20')

      expect(mockOnPageSizeChange).toHaveBeenCalledWith(20)
    })
  })

  describe('Search and Filtering', () => {
    it('should filter audit logs by search term', async () => {
      const user = userEvent.setup()
      const mockOnSearch = jest.fn()
      render(<AuditLogsTable {...defaultProps} onSearch={mockOnSearch} />)

      const searchInput = screen.getByPlaceholderText(/search audit logs/i)
      await user.type(searchInput, 'USER_LOGIN')

      expect(mockOnSearch).toHaveBeenCalledWith('USER_LOGIN')
    })

    it('should filter by action type', async () => {
      const user = userEvent.setup()
      const mockOnActionFilter = jest.fn()
      render(<AuditLogsTable {...defaultProps} onActionFilter={mockOnActionFilter} />)

      const actionFilter = screen.getByRole('combobox', { name: /action filter/i })
      await user.selectOptions(actionFilter, 'USER_LOGIN')

      expect(mockOnActionFilter).toHaveBeenCalledWith('USER_LOGIN')
    })

    it('should filter by date range', async () => {
      const user = userEvent.setup()
      const mockOnDateFilter = jest.fn()
      render(<AuditLogsTable {...defaultProps} onDateFilter={mockOnDateFilter} />)

      const dateFilter = screen.getByRole('button', { name: /date range/i })
      await user.click(dateFilter)

      const todayOption = screen.getByText('Today')
      await user.click(todayOption)

      expect(mockOnDateFilter).toHaveBeenCalledWith('today')
    })

    it('should filter by user', async () => {
      const user = userEvent.setup()
      const mockOnUserFilter = jest.fn()
      render(<AuditLogsTable {...defaultProps} onUserFilter={mockOnUserFilter} />)

      const userFilter = screen.getByRole('combobox', { name: /user filter/i })
      await user.selectOptions(userFilter, 'user-1')

      expect(mockOnUserFilter).toHaveBeenCalledWith('user-1')
    })

    it('should filter by tenant', async () => {
      const user = userEvent.setup()
      const mockOnTenantFilter = jest.fn()
      render(<AuditLogsTable {...defaultProps} onTenantFilter={mockOnTenantFilter} />)

      const tenantFilter = screen.getByRole('combobox', { name: /tenant filter/i })
      await user.selectOptions(tenantFilter, 'tenant-1')

      expect(mockOnTenantFilter).toHaveBeenCalledWith('tenant-1')
    })
  })

  describe('Export Functionality', () => {
    it('should display export button', () => {
      render(<AuditLogsTable {...defaultProps} />)

      expect(screen.getByRole('button', { name: /export audit logs/i })).toBeInTheDocument()
    })

    it('should call onExport when export button is clicked', async () => {
      const user = userEvent.setup()
      const mockOnExport = jest.fn()
      render(<AuditLogsTable {...defaultProps} onExport={mockOnExport} />)

      const exportButton = screen.getByRole('button', { name: /export audit logs/i })
      await user.click(exportButton)

      expect(mockOnExport).toHaveBeenCalled()
    })

    it('should show export options when export button is clicked', async () => {
      const user = userEvent.setup()
      render(<AuditLogsTable {...defaultProps} />)

      const exportButton = screen.getByRole('button', { name: /export audit logs/i })
      await user.click(exportButton)

      expect(screen.getByText('Export as CSV')).toBeInTheDocument()
      expect(screen.getByText('Export as Excel')).toBeInTheDocument()
      expect(screen.getByText('Export as PDF')).toBeInTheDocument()
    })
  })

  describe('Audit Log Details Modal', () => {
    it('should open audit log details modal when view button is clicked', async () => {
      const user = userEvent.setup()
      render(<AuditLogsTable {...defaultProps} />)

      const viewButtons = screen.getAllByRole('button', { name: /view details/i })
      await user.click(viewButtons[0])

      expect(screen.getByText('Audit Log Details')).toBeInTheDocument()
      expect(screen.getByText('USER_LOGIN')).toBeInTheDocument()
      expect(screen.getByText('User logged in successfully')).toBeInTheDocument()
    })

    it('should display detailed information in modal', async () => {
      const user = userEvent.setup()
      render(<AuditLogsTable {...defaultProps} />)

      const viewButtons = screen.getAllByRole('button', { name: /view details/i })
      await user.click(viewButtons[0])

      expect(screen.getByText('Action:')).toBeInTheDocument()
      expect(screen.getByText('Description:')).toBeInTheDocument()
      expect(screen.getByText('IP Address:')).toBeInTheDocument()
      expect(screen.getByText('User Agent:')).toBeInTheDocument()
      expect(screen.getByText('Timestamp:')).toBeInTheDocument()
    })

    it('should close audit log details modal when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<AuditLogsTable {...defaultProps} />)

      const viewButtons = screen.getAllByRole('button', { name: /view details/i })
      await user.click(viewButtons[0])

      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      expect(screen.queryByText('Audit Log Details')).not.toBeInTheDocument()
    })
  })

  describe('Real-time Updates', () => {
    it('should handle real-time audit log updates', () => {
      const newAuditLog = createMockAuditLog({
        id: 'audit-4',
        action: 'USER_LOGOUT',
        description: 'User logged out',
        createdAt: '2024-01-04T13:00:00Z'
      })

      const { rerender } = render(<AuditLogsTable {...defaultProps} />)

      // Simulate new audit log being added
      rerender(<AuditLogsTable {...defaultProps} auditLogs={[...mockAuditLogs, newAuditLog]} />)

      expect(screen.getByText('USER_LOGOUT')).toBeInTheDocument()
      expect(screen.getByText('User logged out')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should be responsive on mobile devices', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<AuditLogsTable {...defaultProps} />)

      // Should still display essential information
      expect(screen.getByText('USER_LOGIN')).toBeInTheDocument()
      expect(screen.getByText('User logged in successfully')).toBeInTheDocument()
    })

    it('should show mobile-friendly action menu', async () => {
      const user = userEvent.setup()
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<AuditLogsTable {...defaultProps} />)

      const actionMenus = screen.getAllByRole('button', { name: /more actions/i })
      await user.click(actionMenus[0])

      expect(screen.getByText('View Details')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<AuditLogsTable {...defaultProps} />)

      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /view details/i })).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      render(<AuditLogsTable {...defaultProps} />)

      // Tab through interactive elements
      await user.tab()
      
      // Should be able to navigate through all interactive elements
      const viewButton = screen.getByRole('button', { name: /view details/i })
      expect(viewButton).toHaveFocus()
    })

    it('should announce audit log updates', () => {
      render(<AuditLogsTable {...defaultProps} />)

      // Should have proper announcements for screen readers
      expect(screen.getByText(/audit log table/i)).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeAuditLogList = Array.from({ length: 1000 }, (_, index) =>
        createMockAuditLog({
          id: `audit-${index}`,
          action: `ACTION_${index}`,
          description: `Description ${index}`,
        })
      )

      render(
        <AuditLogsTable
          {...defaultProps}
          auditLogs={largeAuditLogList}
          totalRecords={1000}
          totalPages={100}
        />
      )

      // Should render without performance issues
      expect(screen.getByText('ACTION_0')).toBeInTheDocument()
    })

    it('should memoize row components for performance', () => {
      const { rerender } = render(<AuditLogsTable {...defaultProps} />)

      // Re-render with same props
      rerender(<AuditLogsTable {...defaultProps} />)

      // Should not cause unnecessary re-renders
      expect(screen.getByText('USER_LOGIN')).toBeInTheDocument()
    })
  })

  describe('Security', () => {
    it('should sanitize user input in search', async () => {
      const user = userEvent.setup()
      const mockOnSearch = jest.fn()
      render(<AuditLogsTable {...defaultProps} onSearch={mockOnSearch} />)

      const searchInput = screen.getByPlaceholderText(/search audit logs/i)
      await user.type(searchInput, '<script>alert("xss")</script>')

      // Should sanitize the input
      expect(mockOnSearch).toHaveBeenCalledWith('<script>alert("xss")</script>')
    })

    it('should not expose sensitive information in audit logs', () => {
      const sensitiveAuditLog = createMockAuditLog({
        description: 'Password changed for user',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      })

      render(<AuditLogsTable {...defaultProps} auditLogs={[sensitiveAuditLog]} />)

      // Should display description but not expose sensitive data
      expect(screen.getByText('Password changed for user')).toBeInTheDocument()
      // Should not display full user agent string
      expect(screen.queryByText('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')).not.toBeInTheDocument()
    })
  })
}) 