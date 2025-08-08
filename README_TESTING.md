# Superadmin Frontend Test Suite

A comprehensive React Testing Library (RTL) + Jest test suite for the Superadmin frontend of a Next.js 15 multi-tenant application.

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

## 📋 Test Coverage

The test suite provides comprehensive coverage for all Superadmin modules:

### ✅ Components Tested

- **DashboardClient** - Main dashboard with charts, metrics, and real-time data
- **TenantTable** - Tenant management with filtering, sorting, and pagination
- **UserTable** - User management with bulk actions and role assignment
- **AuditLogsTable** - Audit trail with detailed logging and export
- **CreateTenantForm** - Tenant creation with validation and real-time feedback
- **Pagination** - Reusable pagination component

### ✅ Hooks Tested

- **useSuperadminDashboard** - Dashboard data fetching with caching and error handling

### ✅ Features Covered

- **Data Display** - Rendering of tables, charts, and metrics
- **User Interactions** - Clicking, typing, form submissions
- **Filtering & Sorting** - All filter buttons and sort functionality
- **Pagination** - Page navigation and size changes
- **Form Validation** - Real-time and submission validation
- **Error Handling** - API errors, network issues, validation errors
- **Loading States** - Loading spinners and skeleton components
- **Responsive Design** - Mobile and desktop layouts
- **Accessibility** - ARIA labels, keyboard navigation, screen reader support
- **Performance** - Large datasets, memoization, efficient rendering

## 🏗️ Test Architecture

### Test Structure

```
src/__tests__/
├── components/
│   ├── auth/
│   │   ├── SuperAdminLogin.test.tsx      # Login authentication
│   │   ├── ForgotPassword.test.tsx       # Password reset request
│   │   ├── ResetPassword.test.tsx        # Password reset form
│   │   └── SuperAdminSignUpForm.test.tsx # Signup with invite token
│   └── superadmin/
│       ├── DashboardClient.test.tsx      # Dashboard functionality
│       ├── TenantTable.test.tsx          # Tenant management
│       ├── UserTable.test.tsx            # User management
│       ├── AuditLogsTable.test.tsx       # Audit logging
│       ├── CreateTenantForm.test.tsx     # Form validation
│       └── Pagination.test.tsx           # Pagination controls
├── hooks/
│   └── useSuperadminDashboard.test.ts    # Data fetching hooks
├── utils/
│   ├── test-utils.tsx                    # Test utilities and providers
│   ├── mocks.ts                          # API mock data
│   └── server.ts                         # MSW server setup
└── setup.ts                              # Global test configuration
```

### Key Technologies

- **React Testing Library** - Component testing with user-centric approach
- **Jest** - Test runner and assertion library
- **MSW (Mock Service Worker)** - API mocking for reliable tests
- **@testing-library/user-event** - Advanced user interaction simulation
- **@tanstack/react-query** - Data fetching and caching testing

## 🧪 Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in CI environment
npm run test:ci
```

### Advanced Usage

```bash
# Run specific test file
npm test -- TenantTable.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should display"

# Run tests in specific directory
npm test -- components/superadmin

# Run tests with verbose output
npm test -- --verbose

# Run tests with specific Jest configuration
npm test -- --config=jest.config.js
```

### Coverage Reports

After running `npm run test:coverage`:

1. **Terminal Output** - Shows coverage summary
2. **HTML Report** - Detailed coverage in `coverage/lcov-report/index.html`
3. **Coverage Badge** - Can be integrated into CI/CD

## 📊 Test Categories

### 1. Component Tests

Each component is tested for:

- **Rendering** - Correct display of data and UI elements
- **User Interactions** - Clicking, typing, form submissions
- **State Changes** - Loading, error, success states
- **Props Handling** - Different prop combinations
- **Edge Cases** - Empty data, large datasets, error conditions

### 2. Integration Tests

- **API Integration** - Mocked API calls and responses
- **Data Flow** - Component communication and state management
- **User Workflows** - Complete user journeys (create tenant, manage users)
- **Authentication Flow** - Login, signup, password reset workflows

### 3. Accessibility Tests

- **ARIA Labels** - Proper accessibility attributes
- **Keyboard Navigation** - Tab order and keyboard interactions
- **Screen Reader Support** - Semantic HTML and announcements

### 4. Performance Tests

- **Large Datasets** - Handling thousands of records
- **Memory Usage** - Preventing memory leaks
- **Rendering Performance** - Efficient component updates

## 🔧 Test Utilities

### Custom Render Function

```typescript
import { render } from '@/__tests__/utils/test-utils'

// Automatically includes all providers
render(<Component />)
```

### Mock Data Generators

```typescript
import { createMockTenant, createMockUser } from '@/__tests__/utils/test-utils'

const mockTenant = createMockTenant({ name: 'Custom Tenant' })
const mockUser = createMockUser({ email: 'test@example.com' })
```

### API Mocking

```typescript
import { server } from '@/__tests__/utils/server'
import { rest } from 'msw'

server.use(
  rest.get('/api/tenants', (req, res, ctx) => {
    return res(ctx.json({ tenants: mockTenants }))
  })
)
```

## 📝 Writing New Tests

### Component Test Template

```typescript
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComponentName } from '@/components/superadmin/ComponentName'

describe('ComponentName', () => {
  const defaultProps = {
    // Define props
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render correctly', () => {
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

### Hook Test Template

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
  beforeEach(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  it('should fetch data successfully', async () => {
    // Test implementation
  })
})
```

## 🎯 Best Practices

### 1. Test Organization

- Group related tests using `describe` blocks
- Use descriptive test names that explain expected behavior
- Follow AAA pattern: Arrange, Act, Assert
- Test one thing at a time per test case

### 2. User-Centric Testing

```typescript
// ✅ Good - Tests user behavior
it('should display user name when user data is provided', () => {
  render(<UserProfile user={{ name: 'John Doe' }} />)
  expect(screen.getByText('John Doe')).toBeInTheDocument()
})

// ❌ Bad - Tests implementation details
it('should set user state', () => {
  // Testing internal state
})
```

### 3. Accessibility Testing

```typescript
// ✅ Good - Tests accessibility
it('should be accessible', () => {
  render(<Component />)
  expect(screen.getByRole('button')).toBeInTheDocument()
  expect(screen.getByLabelText('Search')).toBeInTheDocument()
})
```

### 4. API Mocking

```typescript
// ✅ Good - Mock API responses
server.use(
  rest.get('/api/users', (req, res, ctx) => {
    return res(ctx.json({ users: mockUsers }))
  })
)

// ❌ Bad - Don't test against real APIs
```

## 🚨 Troubleshooting

### Common Issues

1. **Tests failing due to async operations**
   ```typescript
   await waitFor(() => {
     expect(screen.getByText('Data loaded')).toBeInTheDocument()
   })
   ```

2. **MSW not intercepting requests**
   ```typescript
   beforeEach(() => server.listen())
   afterEach(() => server.resetHandlers())
   afterAll(() => server.close())
   ```

3. **QueryClient errors**
   ```typescript
   const wrapper = ({ children }) => (
     <QueryClientProvider client={queryClient}>
       {children}
     </QueryClientProvider>
   )
   ```

### Debugging Tips

- Use `screen.debug()` to see rendered output
- Use `screen.logTestingPlaygroundURL()` for testing playground
- Check console for warnings about missing dependencies
- Verify mock data structure matches expected API response

## 📈 CI/CD Integration

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

## 📚 Resources

- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [MSW Documentation](https://mswjs.io/docs/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 🤝 Contributing

When adding new tests:

1. Follow existing patterns and conventions
2. Add comprehensive coverage for new features
3. Update documentation if introducing new patterns
4. Ensure tests pass in CI environment
5. Add integration tests for critical user flows

## 📄 License

This test suite is part of the multi-tenant Next.js application and follows the same licensing terms. 