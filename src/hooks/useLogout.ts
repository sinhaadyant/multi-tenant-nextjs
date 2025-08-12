import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from './redux';
import { setLogout } from '@/store/slices/authSlice';
import { logout as logoutService } from '@/services/authService';
import { instantLogout } from '@/lib/instantAuth';
import { persistor } from '@/store/store';
import toast from 'react-hot-toast';


export const useLogout = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const logout = useCallback(async (options?: { 
    redirect?: boolean; 
    redirectTo?: string; 
    showToast?: boolean;
  }) => {
    const { 
      redirect = true, 
      redirectTo = '/superadmin/login', 
      showToast = true
    } = options || {};

    try {
      console.log('🚀 Starting instant logout process...');

      // Instant logout - clear all data immediately
      instantLogout();

      // Clear Redux state
      dispatch(setLogout());

      // Purge persisted data
      await persistor.purge();

      // Call logout service to clear server-side state (don't wait for it)
      logoutService().catch(err => console.warn('Server logout failed:', err));

      console.log('✅ Instant logout successful');

      if (showToast) {
        toast.success('Logged out successfully');
      }

      if (redirect) {
        router.push(redirectTo);
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Logout error:', error);
      
      // Even if there's an error, clear everything instantly
      instantLogout();
      dispatch(setLogout());
      await persistor.purge();

      if (showToast) {
        toast.error('Error during logout, but you have been signed out');
      }

      if (redirect) {
        router.push(redirectTo);
      }

      return { success: false, error };
    }
  }, [dispatch, router]);

  return { logout };
};