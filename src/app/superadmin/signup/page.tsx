"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
  contactNumber: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password does not match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SuperAdminSignup() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [inviteData, setInviteData] = useState<any>(null);
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    feedback: string[];
    color: string;
  }>({ score: 0, feedback: [], color: 'red' });
  const [passwordMatch, setPasswordMatch] = useState<{
    matches: boolean;
    message: string;
    color: string;
  }>({ matches: false, message: '', color: 'red' });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema)
  });

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  // Password strength calculation
  const calculatePasswordStrength = (password: string) => {
    let score = 0;
    const feedback: string[] = [];

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('At least 8 characters');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One lowercase letter');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One uppercase letter');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('One number');
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One special character');
    }

    let color = 'red';
    if (score >= 4) color = 'green';
    else if (score >= 3) color = 'yellow';
    else if (score >= 2) color = 'orange';

    return { score, feedback, color };
  };

  // Check password match
  const checkPasswordMatch = (password: string, confirmPassword: string) => {
    if (!confirmPassword) {
      return { matches: false, message: '', color: 'red' };
    }
    
    if (password === confirmPassword) {
      return { matches: true, message: 'Password matches', color: 'green' };
    } else {
      return { matches: false, message: 'Password does not match', color: 'red' };
    }
  };

  // Handle contact number input to only allow numbers
  const handleContactNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numbersOnly = value.replace(/[^0-9]/g, '');
    e.target.value = numbersOnly;
  };

  // Verify token on component mount
  useEffect(() => {
    if (token && email) {
      verifyToken();
      setValue('email', email);
    }
  }, [token, email, setValue]);

  // Watch password changes for strength meter
  const watchedPassword = watch('password');
  const watchedConfirmPassword = watch('confirmPassword');

  useEffect(() => {
    if (watchedPassword) {
      setPasswordStrength(calculatePasswordStrength(watchedPassword));
    }
  }, [watchedPassword]);

  useEffect(() => {
    if (watchedPassword || watchedConfirmPassword) {
      setPasswordMatch(checkPasswordMatch(watchedPassword, watchedConfirmPassword));
    }
  }, [watchedPassword, watchedConfirmPassword]);

  const verifyToken = async () => {
    try {
      const response = await fetch(`/api/superadmin/auth/verify-token?token=${token}&email=${email}`);
      const data = await response.json();

      if (data.success) {
        setTokenValid(true);
        setInviteData(data.data);
      } else {
        setTokenValid(false);
        setError(data.message || 'Invalid or expired invite token');
      }
    } catch (error) {
      setTokenValid(false);
      setError('Failed to verify invite token');
    }
  };

  const onSubmit = async (data: SignupFormData) => {
    if (!token) {
      setError('Invite token is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/superadmin/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          token
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Account created successfully! Please log in.');
        router.push('/superadmin/login');
      } else {
        setError(result.message || 'Failed to create account');
        toast.error(result.message || 'Failed to create account');
      }
    } catch (err: any) {
      const errorMessage = 'Network error. Please check your connection and try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Verifying invite token...</p>
          </div>
        </div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
              Invalid Invite
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {error || 'This invite link is invalid or has expired.'}
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/superadmin/login')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
              Create SuperAdmin Account
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Complete your account setup using the invite link
            </p>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Full Name
            </label>
            <input
              {...register('name')}
              type="text"
              id="name"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder={t('forms:placeholders.enterFullName')}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address
            </label>
            <input
              {...register('email')}
              type="email"
              id="email"
              disabled
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
              placeholder="Enter your email"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Email is pre-filled from your invite
            </p>
          </div>

          {/* Contact Number Field */}
          <div>
            <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Contact Number
            </label>
            <input
              {...register('contactNumber')}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              id="contactNumber"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter your contact number (numbers only)"
              onInput={handleContactNumberInput}
              maxLength={15}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Enter only numbers (10-15 digits)
            </p>
            {errors.contactNumber && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.contactNumber.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <div className="mt-1 relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="block w-full pr-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Create a strong password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {watchedPassword && (
              <div className="space-y-2">
                <div className="text-sm text-gray-600 dark:text-gray-400">Password strength:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`${watchedPassword.length >= 8 ? 'text-green-600' : 'text-red-600'}`}>
                    ✓ At least 8 characters
                  </div>
                  <div className={`${/[A-Z]/.test(watchedPassword) ? 'text-green-600' : 'text-red-600'}`}>
                    ✓ One uppercase letter
                  </div>
                  <div className={`${/\d/.test(watchedPassword) ? 'text-green-600' : 'text-red-600'}`}>
                    ✓ One number
                  </div>
                  <div className={`${/[a-z]/.test(watchedPassword) ? 'text-green-600' : 'text-red-600'}`}>
                    ✓ One lowercase letter
                  </div>
                </div>
              </div>
            )}
            
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm Password
            </label>
            <div className="mt-1 relative">
              <input
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                className="block w-full pr-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            
            {/* Password Match Indicator */}
            {watchedConfirmPassword && (
              <div className="mt-1">
                <div className={`flex items-center text-xs ${
                  passwordMatch.color === 'green' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {passwordMatch.color === 'green' ? (
                    <CheckCircle className="h-4 w-4 mr-1" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-1" />
                  )}
                  {passwordMatch.message}
                </div>
              </div>
            )}
            
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </div>

          {/* Back to Login */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push('/superadmin/login')}
              className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Already have an account? Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 