"use client";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import AuthGuardSkeleton from '@/components/auth/AuthGuardSkeleton';
import SuperAdminSignUpForm from '@/components/auth/SuperAdminSignUpForm';
import { authService } from '@/services/authService';
import toast from 'react-hot-toast';

export default function SuperAdminSignUpClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const { isLoading: authLoading } = useAuthGuard({
    requireGuest: true,
    redirectTo: '/superadmin/dashboard'
  });

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsValidToken(false);
        setIsLoading(false);
        toast.error('Invite token is required');
        return;
      }

      try {
        const response = await authService.verifyToken(token);
        if (response.success && response.data.isValid) {
          setIsValidToken(true);
          setInviteEmail(response.data.email || '');
        } else {
          setIsValidToken(false);
          toast.error('Invalid or expired invite token');
        }
      } catch (error) {
        setIsValidToken(false);
        toast.error('Failed to verify invite token');
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  // Show auth guard skeleton while checking authentication
  if (authLoading) {
    return <AuthGuardSkeleton />;
  }

  // Show token verification skeleton while checking token
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying invite token...</p>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Invalid Invite Token</h1>
          <p className="text-gray-600 mb-6">
            The invite token is invalid, expired, or has already been used. Please contact your administrator for a new invite.
          </p>
          <Link
            href="/superadmin/signin"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return <SuperAdminSignUpForm token={token!} inviteEmail={inviteEmail} />;
} 