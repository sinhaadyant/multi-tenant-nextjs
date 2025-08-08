# Superadmin Frontend Testing Guide

This document provides a comprehensive guide for the React Testing Library (RTL) + Jest test suite for the Superadmin frontend of the Next.js 15 multi-tenant application.

## Table of Contents

1. [Overview](#overview)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Test Coverage](#test-coverage)
5. [Writing Tests](#writing-tests)
6. [Best Practices](#best-practices)
7. [Common Patterns](#common-patterns)
8. [Troubleshooting](#troubleshooting)

## Overview

The test suite is designed to provide comprehensive coverage for all Superadmin modules, including:

- **Dashboard Components**: Charts, metrics, real-time data
- **Data Tables**: Tenants, Users, Audit Logs with filtering, sorting, and pagination
- **Forms**: Create/Edit forms with validation
- **Modals**: Confirmation dialogs, detail views
- **Hooks**: Custom React hooks for data fetching and state management
- **API Integration**: Mocked API calls using MSW

## Test Structure

```
src/__tests__/
├── components/
│   └── superadmin/
│       ├── DashboardClient.test.tsx
│       ├── TenantTable.test.tsx
│       ├── UserTable.test.tsx
│       ├── AuditLogsTable.test.tsx
│       └── CreateTenantForm.test.tsx
├── hooks/
│   └── useSuperadminDashboard.test.ts
├── utils/
│   ├── test-utils.tsx
│   ├── mocks.ts
│   └── server.ts
└── setup.ts
```

## Running Tests

### Prerequisites

Install dependencies:
```bash
npm install
```

### Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

### Running Specific Tests

```bash
# Run tests for a specific component
npm test -- DashboardClient

# Run tests for a specific file
npm test -- TenantTable.test.tsx

# Run tests matching a pattern
npm test -- --testNamePattern="should display"

# Run tests in a specific directory
npm test -- components/superadmin
```

## Test Coverage

The test suite aims for 80%+ coverage across:

- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

### Coverage Reports

After running `npm run test:coverage`, view the coverage report:

1. **Terminal Output**: Shows summary of coverage
2. **HTML Report**: Generated in `coverage/lcov-report/index.html`
3. **Coverage Badge**: Can be integrated into CI/CD

## Writing Tests

### Component Test Structure

```typescript
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComponentName } from '@/components/superadmin/ComponentName'

describe('ComponentName', () => {
  const defaultProps = {
    // Define default props
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render component correctly', () => {
      render(<ComponentName {...defaultProps} />)
      // Assertions
    })
  })

  describe('User Interactions', () => {
    it('should handle user actions', async () => {
      const user = userEvent.setup()
      render(<ComponentName {...defaultProps} />)
      
      // User interactions
      await user.click(screen.getByRole('button'))
      
      // Assertions
    })
  })
})
```

### Hook Test Structure

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useHookName } from '@/hooks/useHookName'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useHookName', () => {
  beforeEach(() => {
    server.listen()
  })

  afterEach(() => {
    server.resetHandlers()
  })

  afterAll(() => {
    server.close()
  })

  it('should fetch data successfully', async () => {
    // Test implementation
  })
})
```

## Best Practices

### 1. Test Organization

- **Group related tests** using `describe` blocks
- **Use descriptive test names** that explain the expected behavior
- **Follow AAA pattern**: Arrange, Act, Assert
- **Test one thing at a time** per test case

### 2. Component Testing

```typescript
// ✅ Good
it('should display user name when user data is provided', () => {
  render(<UserProfile user={{ name: 'John Doe' }} />)
  expect(screen.getByText('John Doe')).toBeInTheDocument()
})

// ❌ Bad
it('should work', () => {
  render(<UserProfile />)
  // Vague assertions
})
```

### 3. User Interaction Testing

```typescript
// ✅ Good
it('should submit form when submit button is clicked', async () => {
  const user = userEvent.setup()
  const mockOnSubmit = jest.fn()
  
  render(<Form onSubmit={mockOnSubmit} />)
  
  await user.type(screen.getByLabelText('Name'), 'John')
  await user.click(screen.getByRole('button', { name: /submit/i }))
  
  expect(mockOnSubmit).toHaveBeenCalledWith({ name: 'John' })
})
```

### 4. API Mocking

```typescript
// ✅ Good
server.use(
  rest.get('/api/users', (req, res, ctx) => {
    return res(ctx.json({ users: mockUsers }))
  })
)

// ❌ Bad
// Don't test against real APIs in unit tests
```

### 5. Accessibility Testing

```typescript
// ✅ Good
it('should be accessible', () => {
  render(<Component />)
  
  expect(screen.getByRole('button')).toBeInTheDocument()
  expect(screen.getByLabelText('Search')).toBeInTheDocument()
})
```

## Common Patterns

### 1. Testing Loading States

```typescript
it('should show loading state', () => {
  render(<Component loading={true} />)
  expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
})
```

### 2. Testing Error States

```typescript
it('should display error message', () => {
  render(<Component error="Something went wrong" />)
  expect(screen.getByText('Something went wrong')).toBeInTheDocument()
})
```

### 3. Testing Form Validation

```typescript
it('should validate required fields', async () => {
  const user = userEvent.setup()
  render(<Form />)
  
  await user.click(screen.getByRole('button', { name: /submit/i }))
  
  expect(screen.getByText('Name is required')).toBeInTheDocument()
})
```

### 4. Testing Pagination

```typescript
it('should handle page changes', async () => {
  const user = userEvent.setup()
  const mockOnPageChange = jest.fn()
  
  render(<Table onPageChange={mockOnPageChange} />)
  
  await user.click(screen.getByRole('button', { name: /next/i }))
  
  expect(mockOnPageChange).toHaveBeenCalledWith(2)
})
```

### 5. Testing Filters

```typescript
it('should filter data by status', async () => {
  const user = userEvent.setup()
  const mockOnFilter = jest.fn()
  
  render(<Table onFilter={mockOnFilter} />)
  
  await user.selectOptions(screen.getByRole('combobox'), 'active')
  
  expect(mockOnFilter).toHaveBeenCalledWith('active')
})
```

## Mock Data

### Creating Mock Data

```typescript
// In test-utils.ts
export const createMockTenant = (overrides = {}) => ({
  id: 'tenant-1',
  name: 'Test Tenant',
  slug: 'test-tenant',
  isActive: true,
  plan: 'professional',
  userCount: 25,
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides,
})
```

### Using Mock Data

```typescript
const mockTenants = [
  createMockTenant({ id: 'tenant-1', name: 'Tenant 1' }),
  createMockTenant({ id: 'tenant-2', name: 'Tenant 2' }),
]
```

## Troubleshooting

### Common Issues

1. **Tests failing due to async operations**
   ```typescript
   // Use waitFor for async operations
   await waitFor(() => {
     expect(screen.getByText('Data loaded')).toBeInTheDocument()
   })
   ```

2. **MSW not intercepting requests**
   ```typescript
   // Ensure server is set up correctly
   beforeEach(() => server.listen())
   afterEach(() => server.resetHandlers())
   afterAll(() => server.close())
   ```

3. **QueryClient errors**
   ```typescript
   // Wrap components with QueryClientProvider in tests
   const wrapper = ({ children }) => (
     <QueryClientProvider client={queryClient}>
       {children}
     </QueryClientProvider>
   )
   ```

4. **React Hook errors**
   ```typescript
   // Use renderHook for testing hooks
   const { result } = renderHook(() => useMyHook(), { wrapper })
   ```

### Debugging Tips

1. **Use screen.debug()** to see the rendered output
2. **Use screen.logTestingPlaygroundURL()** to get testing playground URL
3. **Check console for warnings** about missing dependencies
4. **Verify mock data structure** matches expected API response

### Performance Tips

1. **Mock heavy dependencies** (charts, maps, etc.)
2. **Use React.memo** for expensive components
3. **Limit test data size** for performance tests
4. **Use cleanup functions** to prevent memory leaks

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:ci
      - uses: codecov/codecov-action@v3
```

### Coverage Thresholds

```json
{
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  }
}
```

## Contributing

When adding new tests:

1. **Follow existing patterns** and conventions
2. **Add comprehensive coverage** for new features
3. **Update this guide** if introducing new patterns
4. **Ensure tests pass** in CI environment
5. **Add integration tests** for critical user flows

## Resources

- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [MSW Documentation](https://mswjs.io/docs/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library) 