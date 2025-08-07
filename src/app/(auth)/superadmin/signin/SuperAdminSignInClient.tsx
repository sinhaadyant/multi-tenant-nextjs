"use client";
import { useState } from "react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import AuthGuardSkeleton from '@/components/auth/AuthGuardSkeleton';
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import Checkbox from "@/components/form/input/Checkbox";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon, UserCircleIcon } from "@/icons";
import { loginSchema, LoginFormData } from '@/lib/validations';
import { authService } from '@/services/authService';
import { useAppDispatch } from '@/store/hooks';
import { loginSuccess } from '@/store/slices/authSlice';
import { storage } from '@/lib/localStorage';
import toast from 'react-hot-toast';
import Link from "next/link";

export default function SuperAdminSignInClient() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { isLoading } = useAuthGuard({
    requireGuest: true,
    redirectTo: '/superadmin/dashboard'
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (data: LoginFormData) => {
      console.log('🔐 SuperAdmin login attempt:', { email: data.email, password: data.password ? '[HIDDEN]' : 'undefined' });
      return authService.login(data);
    },
    onSuccess: (response) => {
      console.log('✅ SuperAdmin login successful:', response);
      if (response.success) {
        try {
          console.log('🔐 Storing SuperAdmin auth data...');
          // Store auth data using storage utility
          const tokenStored = storage.setAuthToken(response.data.token);
          const userStored = storage.setAuthUser(response.data.user);
          
          console.log('🔐 SuperAdmin auth data stored:', { tokenStored, userStored });
          
          // Update Redux state
          dispatch(loginSuccess({
            user: response.data.user,
            token: response.data.token,
          }));

          console.log('🔐 Redux state updated');
          toast.success('SuperAdmin login successful!');
          
          // Redirect to superadmin dashboard
          console.log('🔐 Redirecting to superadmin dashboard');
          router.push('/superadmin/dashboard');
        } catch (error) {
          console.error('❌ Error storing SuperAdmin auth data:', error);
          toast.error('Login successful but failed to save session. Please try again.');
        }
      }
    },
    onError: (error: any) => {
      console.error('❌ SuperAdmin login error:', error);
      const errorMessage = error.response?.data?.message || 'SuperAdmin login failed';
      toast.error(errorMessage);
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  if (isLoading) {
    return <AuthGuardSkeleton />;
  }

  return (
    <div className="flex flex-col flex-1 w-full">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Back to platform
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8 text-center">
            {/* SuperAdmin Badge */}
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full mb-4 shadow-sm">
              <UserCircleIcon className="w-6 h-6 text-white" />
            </div>
            
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              SuperAdmin Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Access the system administration portal
            </p>
          </div>
          
          <div>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>
                  </Label>
                  <Input 
                    {...register('email')}
                    placeholder="admin@company.com" 
                    type="email"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>
                
                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      {...register('password')}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className={errors.password ? 'border-red-500' : ''}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Keep me logged in
                    </span>
                  </div>
                  <Link
                    href="/superadmin/reset-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Forgot password?
                  </Link>
                </div>
                
                <div>
                  <Button 
                    className="w-full" 
                    size="sm"
                    disabled={loginMutation.isPending}
                    onClick={handleSubmit(onSubmit)}
                  >
                    {loginMutation.isPending ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Signing in...
                      </div>
                    ) : (
                      'Sign in to SuperAdmin Portal'
                    )}
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400">
                Need SuperAdmin access? Contact your system administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 