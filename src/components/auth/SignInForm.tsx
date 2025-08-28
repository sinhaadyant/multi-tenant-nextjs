"use client";
import { useState, useEffect } from "react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import { loginSchema, LoginFormData } from '@/lib/validations';
import { login, LoginResponse } from '@/services/authService';
import { useAppDispatch } from '@/store/hooks';
import { setLogin } from '@/store/slices/authSlice';
import { simpleStorage } from '@/lib/simpleStorage';
import toast from 'react-hot-toast';
import Link from "next/link";

export default function SignInForm({ superAdmin }: { superAdmin?: boolean }) {
  const { t } = useTranslation('auth');
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [, forceUpdate] = useState({});
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      forceUpdate({});
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange);
    };
  }, []);

  const loginMutation = useMutation<LoginResponse, Error, LoginFormData>({
    mutationFn: login,
    onSuccess: (data) => {
      if (data.success && data.data) {
        // Handle user data safely
        if (data.data.user) {
          dispatch(setLogin(data.data.user));
        }
        
        // Handle token data safely
        if (data.data.token) {
          simpleStorage.setAuthToken(data.data.token, isChecked);
        }
        
        // Handle refresh token safely
        if (data.data.refreshToken) {
          // Store refresh token in localStorage or secure storage
          localStorage.setItem('refreshToken', data.data.refreshToken);
        }
        
        // Handle remember me
        if (isChecked) {
          localStorage.setItem('rememberMe', 'true');
        }
        
        toast.success('Login successful!');
        router.push('/superadmin/dashboard');
      } else {
        toast.error(data.message || t('login.errors.invalidCredentials'));
      }
    },
    onError: (error) => {
      console.error('Login error:', error);
      toast.error(t('login.errors.networkError'));
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    // Include rememberMe in the login data
    const loginData = {
      ...data,
      rememberMe: isChecked
    };
    loginMutation.mutate(loginData);
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          {t('login.backToDashboard')}
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              {t('login.title')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('login.subtitle')}
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-6">
                <div>
                  <Label>
                    {t('login.emailLabel')} <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input 
                    {...register('email')}
                    placeholder={t('login.emailPlaceholder')} 
                    type="email"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>
                <div>
                  <Label>
                    {t('login.passwordLabel')} <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input 
                      {...register('password')}
                      placeholder={t('login.passwordPlaceholder')} 
                      type={showPassword ? 'text' : 'password'}
                      className={errors.password ? 'border-red-500' : ''}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeCloseIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <Checkbox
                    id="rememberMe"
                    checked={isChecked}
                    onChange={(checked: boolean) => setIsChecked(checked)}
                    label={t('login.rememberMe')}
                  />
                  <Link
                    href="/superadmin/forgot-password"
                    className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {t('login.forgotPasswordLink')}
                  </Link>
                </div>
                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full"
                >
                  {loginMutation.isPending ? t('login.signingInButton') : t('login.signInButton')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
