"use client";

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { CallBackProps, Step } from 'react-joyride';
import { STATUS } from 'react-joyride';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const Joyride = dynamic(() => import('react-joyride'), { ssr: false }) as any;

type Permission = {
  moduleKey: string;
  canRead?: boolean;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  canViewAll?: boolean;
};

type TenantModule = {
  moduleKey: string;
  isEnabled: boolean;
  isVisible: boolean;
};

interface WalkthroughProps {
  userId: string;
  isFirstLogin: boolean;
  permissions: Permission[];
  tenantModules: TenantModule[];
}

export const Walkthrough: React.FC<WalkthroughProps> = ({ userId, isFirstLogin, permissions, tenantModules }) => {
  const { t, i18n } = useTranslation('walkthrough');
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const [run, setRun] = useState<boolean>(false);
  const [steps, setSteps] = useState<Step[]>([]);

  const hasAccessTo = useCallback((key: string) => {
    const mod = tenantModules.find(m => m.moduleKey === key && m.isEnabled && m.isVisible);
    if (!mod) return false;
    const perm = permissions.find(p => p.moduleKey === key);
    return !!perm; // any permission counts for visibility in walkthrough
  }, [permissions, tenantModules]);

  const buildSteps = useCallback((): Step[] => {
    const s: Step[] = [];

    // Welcome (top bar)
    s.push({
      target: '[data-tour="tour-topbar"]',
      content: t('welcome'),
      disableBeacon: true,
      placement: 'bottom'
    });

    // Dashboard
    if (hasAccessTo('dashboard')) {
      s.push({ target: '[data-tour="tour-dashboard"]', content: t('dashboard'), placement: 'right' });
    }

    // Users
    if (hasAccessTo('users') || hasAccessTo('user-management')) {
      s.push({ target: '[data-tour="tour-users"]', content: t('users'), placement: 'right' });
    }

    // Roles / Permissions
    if (hasAccessTo('roles') || hasAccessTo('roles-permissions')) {
      s.push({ target: '[data-tour="tour-roles"]', content: t('roles'), placement: 'right' });
    }

    // Modules
    if (hasAccessTo('modules') || hasAccessTo('module-management')) {
      s.push({ target: '[data-tour="tour-modules"]', content: t('modules'), placement: 'right' });
    }

    // Billing / Subscription
    if (hasAccessTo('billing') || hasAccessTo('subscription')) {
      s.push({ target: '[data-tour="tour-billing"]', content: t('billing'), placement: 'right' });
    }

    // Reports / Analytics
    if (hasAccessTo('reports') || hasAccessTo('analytics') || hasAccessTo('reports-analytics')) {
      s.push({ target: '[data-tour="tour-reports"]', content: t('reports'), placement: 'right' });
    }

    // Settings: language, theme, search
    s.push({ target: '[data-tour="tour-language-switcher"]', content: t('language'), placement: 'left' });
    s.push({ target: '[data-tour="tour-theme-toggle"]', content: t('theme'), placement: 'left' });

    // Settings general
    s.push({ target: '[data-tour="tour-settings"]', content: t('settings'), placement: 'right' });

    return s;
  }, [t, hasAccessTo]);

  // Auto-run if first login
  useEffect(() => {
    if (isFirstLogin) {
      const built = buildSteps();
      setSteps(built);
      setRun(true);
    }
  }, [isFirstLogin, buildSteps]);

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status } = data as any;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED] as any;

    if (finishedStatuses.includes(status as any)) {
      setRun(false);
      try {
        // Update user isFirstLogin to false
        await axios.put(`/api/tenant/${tenantSlug}/users/${userId}`, { isFirstLogin: false });
      } catch (e) {
        // non-blocking
      }
      // Redirect to dashboard
      router.replace(`/${tenantSlug}/dashboard`);
    }
  };

  if (!isFirstLogin) return null;

  const isRtl = i18n.language === 'ar' || i18n.language === 'ur';

  return (
    <Joyride
      steps={steps as any}
      run={run}
      locale={{
        back: t('back', { defaultValue: 'Back' }) as any,
        close: t('finish'),
        last: t('finish'),
        next: t('next', { defaultValue: 'Next' }) as any,
        skip: t('skip', { defaultValue: 'Skip' }) as any
      }}
      continuous
      scrollToFirstStep
      showSkipButton
      disableOverlayClose
      styles={{
        options: {
          zIndex: 10000,
          arrowColor: '#fff'
        }
      }}
      floaterProps={{
        styles: { wrapper: { direction: isRtl ? 'rtl' : 'ltr' } }
      }}
      callback={handleJoyrideCallback}
    />
  );
};

export default Walkthrough;


