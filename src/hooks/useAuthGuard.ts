import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { authService } from '@/services/authService';
import { logout } from '@/store/slices/authSlice';
import toast from 'react-hot-toast';
import { storage } from '@/lib/localStorage';

interface UseAuthGuardOptions {
  redirectTo?: string;
  requireAuth?: boolean;
  requireGuest?: boolean;
}

export const useAuthGuard = (options: UseAuthGuardOptions = {}) => {
  const {
    redirectTo = '/superadmin/dashboard',
    requireAuth = false,
    requireGuest = false
  } = options;

  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, token, isInitialized } = useAppSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    const validateAuth = async () => {
      // Wait for Redux store to be initialized
      if (!isInitialized) {
        return;
      }

      setIsValidating(true);
      
      try {
        // Check if we have a token in localStorage
        const storedToken = storage.getAuthToken();
        const storedUser = storage.getAuthUser();

        console.log('🔐 Auth guard check:', { 
          hasStoredToken: !!storedToken, 
          hasStoredUser: !!storedUser,
          isAuthenticated,
          requireAuth,
          requireGuest
        });

        if (!storedToken) {
          // No token found
          if (requireAuth) {
            // User needs to be authenticated but isn't
            console.log('🔐 No token found, redirecting to login');
            toast.error('Please log in to continue');
            router.push('/superadmin/signin');
          }
          setIsLoading(false);
          return;
        }

        // If we have a token but Redux state is not authenticated, update it
        if (storedToken && !isAuthenticated && storedUser) {
          // The storage utility should handle parsing, so storedUser should already be an object
          if (typeof storedUser === 'object' && storedUser !== null) {
            // User data is already parsed, we can proceed
            console.log('🔐 Restoring auth state from storage');
          } else {
            console.error('Invalid stored user data format');
            storage.clearAuth();
            if (requireAuth) {
              toast.error('Invalid session data. Please log in again.');
              router.push('/superadmin/signin');
            }
            setIsLoading(false);
            return;
          }
        }

        // If user is already authenticated and we're on a guest page, redirect
        if (isAuthenticated && requireGuest) {
          console.log('🔐 User already authenticated, redirecting to dashboard');
          toast.success('You are already logged in');
          router.push(redirectTo);
          setIsLoading(false);
          return;
        }

        // If authentication is required and user is not authenticated, redirect
        if (requireAuth && !isAuthenticated) {
          console.log('🔐 Authentication required but user not authenticated');
          toast.error('Please log in to continue');
          router.push('/superadmin/signin');
          setIsLoading(false);
          return;
        }

      } catch (error) {
        console.error('Auth guard error:', error);
        if (requireAuth) {
          toast.error('Authentication error. Please log in again.');
          router.push('/superadmin/signin');
        }
      } finally {
        setIsValidating(false);
        setIsLoading(false);
      }
    };

    validateAuth();
  }, [router, redirectTo, requireAuth, requireGuest, isInitialized, isAuthenticated, dispatch]);

  return {
    isLoading: isLoading || isValidating,
    isAuthenticated,
    user,
    token
  };
}; 