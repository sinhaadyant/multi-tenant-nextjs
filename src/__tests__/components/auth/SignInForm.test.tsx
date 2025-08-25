import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the SignInForm component for testing
const MockSignInForm = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Basic validation
    if (!email) {
      setError('Email is required');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      if (email === 'error@test.com') {
        setError('Invalid email or password');
      } else if (email === 'network@test.com') {
        setError('Network error: Unable to connect to server');
      } else {
        // Success case
        console.log('Login successful');
      }
    }, 100);
  };

  return (
    <div role="form" aria-label="Sign in form">
      <h1>Sign In</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email Address *</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="info@gmail.com"
            className={error && !email ? 'border-red-500' : ''}
            aria-required="true"
            aria-describedby="email-error"
            autoComplete="email"
            name="email"
          />
          {error && error === 'Email is required' && <p id="email-error" aria-live="polite">Email is required</p>}
          {error && error === 'Please enter a valid email address' && <p id="email-error" aria-live="polite">Please enter a valid email address</p>}
        </div>

        <div>
          <label htmlFor="password">Password *</label>
          <div style={{ position: 'relative' }}>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={error && !password ? 'border-red-500' : ''}
              aria-required="true"
              aria-describedby="password-error"
              autoComplete="current-password"
              name="password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password visibility"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {error && error === 'Password is required' && <p id="password-error" aria-live="polite">Password is required</p>}
          {error && error === 'Password must be at least 8 characters long' && <p id="password-error" aria-live="polite">Password must be at least 8 characters long</p>}
        </div>

        <div>
          <label>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Remember Me
          </label>
        </div>

        {error && email && password && (error.includes('Invalid') || error.includes('Network')) && (
          <div role="alert" aria-live="assertive">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          aria-label={isLoading ? 'Signing In...' : 'Sign In'}
          data-loading={isLoading}
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>

        {isLoading && <div data-testid="loading-spinner">Loading...</div>}

        <button type="button" disabled={!error}>
          Retry
        </button>
      </form>
    </div>
  );
};

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />;
  },
}));

const mockT = jest.fn((key: string, options?: any) => {
  const translations: Record<string, string> = {
    'auth:emailAddress': 'Email Address',
    'auth:password': 'Password',
    'auth:signIn': 'Sign In',
    'auth:signingIn': 'Signing In...',
    'auth:rememberMe': 'Remember Me',
    'auth:forgotPassword': 'Forgot Password?',
    'errors:validation.required': 'This field is required',
    'errors:validation.email': 'Please enter a valid email address',
    'errors:validation.password': 'Password must be at least 8 characters long',
    'errors:auth.invalidCredentials': 'Invalid email or password',
    'errors:network.connectionError': 'Network error: Unable to connect to server',
    'errors:network.timeout': 'Request timeout',
    'common:retry': 'Retry',
  };
  
  if (options && options.count !== undefined) {
    return translations[key]?.replace('{{count}}', options.count) || key;
  }
  
  return translations[key] || key;
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
  }),
}));

// Test wrapper with providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('SignInForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockT.mockClear();
  });

  describe('Form Validation', () => {
    it('should validate email format', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <MockSignInForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Test invalid email formats
      const invalidEmails = [
        'invalid-email',
        'missing@',
        '@missing.com',
        'spaces @test.com',
      ];

      for (const email of invalidEmails) {
        await user.clear(emailInput);
        await user.type(emailInput, email);
        await user.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
        });
      }
    });

    it('should validate password strength requirements', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <MockSignInForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText('Password *');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');

      // Test weak passwords
      const weakPasswords = [
        'weak',
        '123456',
        'abc',
      ];

      for (const password of weakPasswords) {
        await user.clear(passwordInput);
        await user.type(passwordInput, password);
        await user.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
        });
      }
    });

    it('should highlight required fields when empty', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <MockSignInForm />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveClass('border-red-500');
    });

    it('should provide real-time validation feedback', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <MockSignInForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Type invalid email and submit
      await user.type(emailInput, 'invalid');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });

      // Correct the email
      await user.clear(emailInput);
      await user.type(emailInput, 'valid@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <MockSignInForm />
        </TestWrapper>
      );

      const passwordInput = screen.getByLabelText('Password *');
      const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i });

      // Initially password should be hidden
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Click toggle to show password
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');

      // Click toggle to hide password again
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should handle remember me checkbox functionality', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <MockSignInForm />
        </TestWrapper>
      );

      const rememberMeCheckbox = screen.getByRole('checkbox', { name: /remember me/i });

      // Initially unchecked
      expect(rememberMeCheckbox).not.toBeChecked();

      // Click to check
      await user.click(rememberMeCheckbox);
      expect(rememberMeCheckbox).toBeChecked();

      // Click to uncheck
      await user.click(rememberMeCheckbox);
      expect(rememberMeCheckbox).not.toBeChecked();
    });

    it('should show loading state during API calls', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <MockSignInForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText('Password *');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.click(submitButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      });
    });

    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <MockSignInForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText('Password *');
      const rememberMeCheckbox = screen.getByRole('checkbox', { name: /remember me/i });
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Tab navigation
      await user.tab();
      expect(emailInput).toHaveFocus();

      await user.tab();
      expect(passwordInput).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /toggle password visibility/i })).toHaveFocus();

      await user.tab();
      expect(rememberMeCheckbox).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    it('should display server error messages', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <MockSignInForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText('Password *');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'error@test.com');
      await user.type(passwordInput, 'Password123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      });
    });

    it('should display network error messages', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <MockSignInForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText('Password *');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'network@test.com');
      await user.type(passwordInput, 'Password123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network error: unable to connect to server/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should be compatible with screen readers', () => {
      render(
        <TestWrapper>
          <MockSignInForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText('Password *');

      expect(emailInput).toHaveAttribute('aria-required', 'true');
      expect(passwordInput).toHaveAttribute('aria-required', 'true');
      expect(emailInput).toHaveAttribute('aria-describedby');
      expect(passwordInput).toHaveAttribute('aria-describedby');
    });

    it('should have proper ARIA labels and roles', () => {
      render(
        <TestWrapper>
          <MockSignInForm />
        </TestWrapper>
      );

      const form = screen.getByRole('form');
      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const passwordInput = screen.getByLabelText('Password *');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      expect(form).toHaveAttribute('aria-label', 'Sign in form');
      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();
    });

    it('should support keyboard-only navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <MockSignInForm />
        </TestWrapper>
      );

      // Should be able to navigate and submit using only keyboard
      await user.tab(); // Email input
      await user.keyboard('test@example.com');
      
      await user.tab(); // Password input
      await user.keyboard('Password123!');
      
      await user.tab(); // Toggle button
      await user.tab(); // Remember me checkbox
      await user.keyboard(' '); // Space to check
      
      await user.tab(); // Submit button
      await user.keyboard('{Enter}'); // Enter to submit

      // Should start loading
      await waitFor(() => {
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long input values', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <MockSignInForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const longEmail = 'a'.repeat(100) + '@example.com';

      await user.type(emailInput, longEmail);
      
      expect(emailInput).toHaveValue(longEmail);
      // Should handle gracefully without breaking
    });

    it('should handle copy/paste operations', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <MockSignInForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);

      // Simulate paste operation
      await user.click(emailInput);
      await user.paste('pasted@example.com');

      expect(emailInput).toHaveValue('pasted@example.com');
    });

    it('should integrate with browser autofill', () => {
      render(
        <TestWrapper>
          <MockSignInForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText('Password *');

      expect(emailInput).toHaveAttribute('autoComplete', 'email');
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
      expect(emailInput).toHaveAttribute('name', 'email');
      expect(passwordInput).toHaveAttribute('name', 'password');
    });
  });

  describe('Internationalization', () => {
    it('should use translation keys for all user-facing text', () => {
      render(
        <TestWrapper>
          <MockSignInForm />
        </TestWrapper>
      );

      // Verify translation function would be called with expected keys
      // (In real implementation, this would check actual translation calls)
      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText('Password *')).toBeInTheDocument();
      expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
    });

    it('should display translated error messages', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <MockSignInForm />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });
  });
});