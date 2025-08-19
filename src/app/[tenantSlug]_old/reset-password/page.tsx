"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { notFound } from 'next/navigation';
import ResetPasswordClient from './ResetPasswordClient';
import axios from 'axios';

interface TokenValidation {
  isValid: boolean;
  email?: string;
  error?: string;
  data?: {
    tenantSlug: string;
  };
}

export default function TenantResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tokenValidation, setTokenValidation] = useState<TokenValidation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setTokenValidation({ isValid: false, error: 'No token provided' });
      setIsLoading(false);
      return;
    }

    validateToken(token);
  }, [token]);

  const validateToken = async (token: string) => {
    try {
      console.log('🔍 Validating tenant token with axios:', token);
      
      const response = await axios.get(`/api/tenant/auth/verify-reset-token`, {
        params: { token },
        timeout: 10000 // 10 second timeout
      });

      console.log('🔍 Axios response:', response.data);

      if (response.data.success) {
        console.log('✅ Token is valid');
        setTokenValidation({
          isValid: true,
          email: response.data.email,
          data: response.data
        });
      } else {
        console.log('❌ Token is invalid:', response.data.message);
        setTokenValidation({
          isValid: false,
          error: response.data.message || 'Invalid or expired reset token'
        });
      }
    } catch (error: any) {
      console.log('❌ Token validation error:', error);
      
      let errorMessage = 'Failed to verify reset token';
      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Network error - no response from server';
      } else {
        // Something else happened
        errorMessage = error.message || errorMessage;
      }
      
      setTokenValidation({
        isValid: false,
        error: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Debug logging
  console.log('🔍 Current state:', {
    isLoading,
    tokenValidation,
    token,
    shouldRenderClient: tokenValidation?.isValid && tokenValidation.email && token
  });

  if (isLoading) {
    console.log('🔄 Rendering loading state');
    return (
      <div className="flex flex-col flex-1 w-full">
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto space-y-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Verifying reset token...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValidation?.isValid || !tokenValidation.email || !token) {
    console.log('❌ Rendering error state');
    return (
      <div className="flex flex-col flex-1 w-full">
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full mb-4 shadow-sm">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              Invalid Reset Link
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {tokenValidation?.error || 'The password reset link is invalid or has expired.'}
            </p>
            <div className="mt-6">
              <a
                href="/forgot-password"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Request New Reset Link
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log('✅ Rendering client component');
  return (
    <ResetPasswordClient
      token={token}
      email={tokenValidation.email}
      tenantSlug={tokenValidation.data?.tenantSlug || 'tenant'}
    />
  );
} 