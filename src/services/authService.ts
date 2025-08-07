import api from '@/lib/api';
import { User } from '@/store/slices/authSlice';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  contactNumber: string;
  token: string;
}

export interface LoginResponse {
  success: boolean;
  status: number;
  message: string;
  data: {
    token: string;
    user: User;
  };
  meta: {
    timestamp: string;
  };
}

export interface SignupResponse {
  success: boolean;
  status: number;
  message: string;
  data: {
    token: string;
    user: User;
  };
  meta: {
    timestamp: string;
  };
}

export interface VerifyTokenResponse {
  success: boolean;
  status: number;
  message: string;
  data: {
    isValid: boolean;
    email?: string;
  };
  meta: {
    timestamp: string;
  };
}

export const authService = {
  // Login
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await api.post('/superadmin/auth/login', credentials);
    return response.data;
  },

  // Signup
  signup: async (data: SignupData): Promise<SignupResponse> => {
    const response = await api.post('/superadmin/auth/signup', data);
    return response.data;
  },

  // Verify invite token
  verifyToken: async (token: string): Promise<VerifyTokenResponse> => {
    const response = await api.get(`/superadmin/auth/verify-token?token=${token}`);
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/superadmin/profile');
    return response.data;
  },

  // Update profile
  updateProfile: async (data: { name?: string; email?: string; currentPassword?: string; newPassword?: string }) => {
    const response = await api.put('/superadmin/profile', data);
    return response.data;
  },
}; 