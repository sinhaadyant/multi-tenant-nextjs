// Real authentication service for SuperAdmin

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    refreshToken: string;
    expiresAt: number;
    user: any;
  };
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
  token?: string; // Only for development - remove in production
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

/**
 * Login SuperAdmin
 * Makes actual API call to backend
 */
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await fetch('/api/superadmin/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok) {
      return {
        success: true,
        message: result.data?.message || 'Login successful.',
        data: result.data,
      };
    } else {
      return {
        success: false,
        message: result.error || 'Login failed.',
      };
    }
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'Network error. Please check your connection and try again.',
    };
  }
};

/**
 * Request password reset for SuperAdmin
 * Makes actual API call to backend
 */
export const requestPasswordReset = async (email: string): Promise<PasswordResetResponse> => {
  try {
    const response = await fetch('/api/superadmin/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        message: data.data?.message || 'Password reset instructions have been sent.',
        token: data.data?.token, // Only for development
      };
    } else {
      return {
        success: false,
        message: data.error || 'Failed to process password reset request.',
      };
    }
  } catch (error) {
    console.error('Password reset request error:', error);
    return {
      success: false,
      message: 'Network error. Please check your connection and try again.',
    };
  }
};

/**
 * Reset password using token
 * Makes actual API call to backend
 */
export const resetPassword = async (
  token: string,
  newPassword: string,
  confirmPassword: string
): Promise<ResetPasswordResponse> => {
  try {
    const response = await fetch('/api/superadmin/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        newPassword,
        confirmPassword,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        message: data.data?.message || 'Password has been successfully updated.',
      };
    } else {
      return {
        success: false,
        message: data.error || 'Failed to reset password.',
      };
    }
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      message: 'Network error. Please check your connection and try again.',
    };
  }
};

/**
 * Logout SuperAdmin
 * Clears all authentication data
 */
export const logout = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Call logout API if needed
    await fetch('/api/superadmin/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Clear cookie
    document.cookie = 'superadmin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    
    return {
      success: true,
      message: 'Logged out successfully',
    };
  } catch (error) {
    console.error('Logout error:', error);
    // Even if API fails, clear local data
    document.cookie = 'superadmin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }
};

/**
 * Validate password strength
 * Returns strength score and validation checks
 */
export const validatePasswordStrength = (password: string) => {
  if (!password) {
    return null;
  }

  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;
  
  let strength = 'Very Weak';
  let color = 'text-red-600';
  
  if (score >= 4) {
    strength = 'Strong';
    color = 'text-green-600';
  } else if (score >= 3) {
    strength = 'Medium';
    color = 'text-yellow-600';
  } else if (score >= 2) {
    strength = 'Weak';
    color = 'text-orange-600';
  }

  return {
    score,
    strength,
    color,
    checks,
  };
};