import { useCallback } from 'react';
import { toast } from 'react-hot-toast';

export const useToast = () => {
  const success = useCallback((message: string) => {
    toast.success(message);
  }, []);

  const error = useCallback((message: string) => {
    toast.error(message);
  }, []);

  const info = useCallback((message: string) => {
    toast(message, {
      icon: 'ℹ️',
    });
  }, []);

  const warning = useCallback((message: string) => {
    toast(message, {
      icon: '⚠️',
    });
  }, []);

  return {
    toast: {
      success,
      error,
      info,
      warning,
    },
    success,
    error,
    info,
    warning,
  };
}; 