import React from 'react';
import { render, screen } from '@testing-library/react';
import { DynamicPermissionsProvider, useDynamicPermissions } from '@/context/DynamicPermissionsContext';

// Mock component to test the context
const TestComponent = () => {
  const { 
    userPermissions, 
    isLoading, 
    error, 
    isInitialized,
    hasAccess,
    hasPermission,
    hasAnyPermission,
    hasRole,
    canAccessModule,
    canPerformAction,
    getMenuItems,
    getModulePermissions
  } = useDynamicPermissions();

  return (
    <div>
      <div data-testid="user-permissions">
        {userPermissions ? 'Has permissions' : 'No permissions'}
      </div>
      <div data-testid="is-loading">{isLoading ? 'Loading' : 'Not loading'}</div>
      <div data-testid="error">{error || 'No error'}</div>
      <div data-testid="is-initialized">{isInitialized ? 'Initialized' : 'Not initialized'}</div>
      <div data-testid="has-access">{hasAccess ? 'Has access' : 'No access'}</div>
      <div data-testid="menu-items-count">{getMenuItems().length}</div>
      <div data-testid="module-permissions-count">{getModulePermissions('dashboard').length}</div>
    </div>
  );
};

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useParams: () => ({ tenantSlug: 'test-tenant' })
}));

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn()
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

describe('DynamicPermissionsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    sessionStorageMock.getItem.mockReturnValue(null);
  });

  it('should render without throwing errors when no permissions are available', () => {
    // This test ensures that the context doesn't throw "Cannot read properties of undefined"
    expect(() => {
      render(
        <DynamicPermissionsProvider>
          <TestComponent />
        </DynamicPermissionsProvider>
      );
    }).not.toThrow();
  });

  it('should provide fallback values when no permissions are loaded', async () => {
    render(
      <DynamicPermissionsProvider>
        <TestComponent />
      </DynamicPermissionsProvider>
    );

    // Wait for the context to initialize
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(screen.getByTestId('user-permissions')).toHaveTextContent('No permissions');
    expect(screen.getByTestId('is-loading')).toHaveTextContent('Not loading');
    expect(screen.getByTestId('error')).toHaveTextContent('No error');
    expect(screen.getByTestId('is-initialized')).toHaveTextContent('Initialized');
    expect(screen.getByTestId('has-access')).toHaveTextContent('No access');
    expect(screen.getByTestId('menu-items-count')).toHaveTextContent('0');
    expect(screen.getByTestId('module-permissions-count')).toHaveTextContent('0');
  });

  it('should handle permission checks safely when userPermissions is null', () => {
    const PermissionTestComponent = () => {
      const context = useDynamicPermissions();
      
      // These should not throw errors even when userPermissions is null
      expect(context.hasPermission('dashboard', 'view')).toBe(false);
      expect(context.hasAnyPermission('dashboard')).toBe(false);
      expect(context.hasRole('admin')).toBe(false);
      expect(context.canAccessModule('dashboard')).toBe(false);
      expect(context.canPerformAction('dashboard', 'view')).toBe(false);
      expect(context.getMenuItems()).toEqual([]);
      expect(context.getModulePermissions('dashboard')).toEqual([]);
      
      return <div>Test completed</div>;
    };

    render(
      <DynamicPermissionsProvider>
        <PermissionTestComponent />
      </DynamicPermissionsProvider>
    );
  });

  it('should handle permission checks safely when userPermissions has missing properties', () => {
    // Mock userPermissions with missing properties
    const mockUserPermissions = {
      user: null,
      permissions: null,
      modulePermissions: null,
      accessibleModules: null,
      menuItems: null,
      hasAccess: null,
      totalPermissions: 0,
      totalModules: 0
    };

    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'user_permissions') {
        return JSON.stringify(mockUserPermissions);
      }
      return null;
    });

    const PermissionTestComponent = () => {
      const context = useDynamicPermissions();
      
      // These should not throw errors even with missing properties
      expect(context.hasPermission('dashboard', 'view')).toBe(false);
      expect(context.hasAnyPermission('dashboard')).toBe(false);
      expect(context.hasRole('admin')).toBe(false);
      expect(context.canAccessModule('dashboard')).toBe(false);
      expect(context.canPerformAction('dashboard', 'view')).toBe(false);
      expect(context.getMenuItems()).toEqual([]);
      expect(context.getModulePermissions('dashboard')).toEqual([]);
      
      return <div>Test completed</div>;
    };

    render(
      <DynamicPermissionsProvider>
        <PermissionTestComponent />
      </DynamicPermissionsProvider>
    );
  });

  it('should handle permission checks safely when arrays are not actually arrays', () => {
    // Mock userPermissions with non-array properties that should be arrays
    const mockUserPermissions = {
      user: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        isActive: true,
        createdAt: new Date().toISOString(),
        tenant: {
          id: '1',
          name: 'Test Tenant',
          slug: 'test',
          isActive: true
        },
        roles: 'not-an-array' // This should be an array but isn't
      },
      permissions: 'not-an-array', // This should be an array but isn't
      modulePermissions: {},
      accessibleModules: 'not-an-array', // This should be an array but isn't
      menuItems: 'not-an-array', // This should be an array but isn't
      hasAccess: true,
      totalPermissions: 0,
      totalModules: 0
    };

    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'user_permissions') {
        return JSON.stringify(mockUserPermissions);
      }
      return null;
    });

    const PermissionTestComponent = () => {
      const context = useDynamicPermissions();
      
      // These should not throw errors even when properties are not arrays
      expect(context.hasPermission('dashboard', 'view')).toBe(false);
      expect(context.hasAnyPermission('dashboard')).toBe(false);
      expect(context.hasRole('admin')).toBe(false);
      expect(context.canAccessModule('dashboard')).toBe(false);
      expect(context.canPerformAction('dashboard', 'view')).toBe(false);
      expect(context.getMenuItems()).toEqual([]);
      expect(context.getModulePermissions('dashboard')).toEqual([]);
      
      return <div>Test completed</div>;
    };

    render(
      <DynamicPermissionsProvider>
        <PermissionTestComponent />
      </DynamicPermissionsProvider>
    );
  });

  it('should handle permission checks safely when array elements are invalid', () => {
    // This test verifies that our defensive checks prevent errors
    // even when the data structure is malformed
    const PermissionTestComponent = () => {
      const context = useDynamicPermissions();
      
      // These should not throw errors even when userPermissions is null or malformed
      expect(() => context.hasPermission('dashboard', 'view')).not.toThrow();
      expect(() => context.hasAnyPermission('dashboard')).not.toThrow();
      expect(() => context.hasRole('admin')).not.toThrow();
      expect(() => context.canAccessModule('dashboard')).not.toThrow();
      expect(() => context.canPerformAction('dashboard', 'view')).not.toThrow();
      expect(() => context.getMenuItems()).not.toThrow();
      expect(() => context.getModulePermissions('dashboard')).not.toThrow();
      
      // All should return safe default values
      expect(context.hasPermission('dashboard', 'view')).toBe(false);
      expect(context.hasAnyPermission('dashboard')).toBe(false);
      expect(context.hasRole('admin')).toBe(false);
      expect(context.canAccessModule('dashboard')).toBe(false);
      expect(context.canPerformAction('dashboard', 'view')).toBe(false);
      expect(context.getMenuItems()).toEqual([]);
      expect(context.getModulePermissions('dashboard')).toEqual([]);
      
      return <div>Test completed</div>;
    };

    render(
      <DynamicPermissionsProvider>
        <PermissionTestComponent />
      </DynamicPermissionsProvider>
    );
  });
}); 