"use client";
import { useTranslation } from 'react-i18next';
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState } from "react";

export default function SignUpForm() {
  const { t } = useTranslation('auth');
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  
  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
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
              {t('signup.title')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('signup.subtitle')}
            </p>
          </div>
          <div>
            <form>
              <div className="space-y-6">
                <div>
                  <Label>
                    {t('signup.fullName')} <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input 
                    placeholder={t('signup.fullNamePlaceholder')} 
                    type="text"
                  />
                </div>
                <div>
                  <Label>
                    {t('signup.emailAddress')} <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input 
                    placeholder={t('signup.emailPlaceholder')} 
                    type="email"
                    disabled
                    className="bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('signup.emailPrefilled')}
                  </p>
                </div>
                <div>
                  <Label>
                    {t('signup.contactNumber')} <span className="text-gray-400">({t('common.optional')})</span>{" "}
                  </Label>
                  <Input 
                    placeholder={t('signup.contactNumberPlaceholder')} 
                    type="tel"
                    maxLength={15}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('signup.contactNumberHint')}
                  </p>
                </div>
                <div>
                  <Label>
                    {t('signup.password')} <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input 
                      placeholder={t('signup.passwordPlaceholder')} 
                      type={showPassword ? 'text' : 'password'}
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
                  
                  {/* Password Strength Indicator */}
                  <div className="mt-2 space-y-2">
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t('signup.passwordStrength')}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-gray-500">{t('signup.passwordRequirements.minLength')}</div>
                      <div className="text-gray-500">{t('signup.passwordRequirements.uppercase')}</div>
                      <div className="text-gray-500">{t('signup.passwordRequirements.lowercase')}</div>
                      <div className="text-gray-500">{t('signup.passwordRequirements.number')}</div>
                    </div>
                  </div>
                </div>
                <div>
                  <Label>
                    {t('signup.confirmPassword')} <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input 
                      placeholder={t('signup.confirmPasswordPlaceholder')} 
                      type={showPassword ? 'text' : 'password'}
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
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox 
                    checked={isChecked} 
                    onChange={setIsChecked}
                    label={t('login.rememberMe')}
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {t('signup.createAccount')}
                  </button>
                </div>
              </div>
            </form>
            
            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400">
                {t('signup.alreadyHaveAccount')}{" "}
                <Link
                  href="/superadmin/login"
                  className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {t('login.signInButton')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
