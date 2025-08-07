import { useCallback } from 'react';
import { useConfirmModalContext } from '@/components/common/ConfirmModalProvider';

export interface ConfirmActionOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  onCancel?: () => void;
}

export const useConfirmActions = () => {
  const { confirm } = useConfirmModalContext();

  const confirmDelete = useCallback((
    itemName: string,
    onConfirm: () => void | Promise<void>,
    options?: Partial<ConfirmActionOptions>
  ) => {
    confirm({
      title: options?.title || 'Confirm Deletion',
      message: options?.message || `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      confirmText: options?.confirmText || 'Delete',
      variant: options?.variant || 'danger',
      onConfirm,
      onCancel: options?.onCancel,
    });
  }, [confirm]);

  const confirmSuspend = useCallback((
    itemName: string,
    onConfirm: () => void | Promise<void>,
    options?: Partial<ConfirmActionOptions>
  ) => {
    confirm({
      title: options?.title || 'Confirm Suspension',
      message: options?.message || `Are you sure you want to suspend "${itemName}"? They will not be able to access the system until reactivated.`,
      confirmText: options?.confirmText || 'Suspend',
      variant: options?.variant || 'warning',
      onConfirm,
      onCancel: options?.onCancel,
    });
  }, [confirm]);

  const confirmActivate = useCallback((
    itemName: string,
    onConfirm: () => void | Promise<void>,
    options?: Partial<ConfirmActionOptions>
  ) => {
    confirm({
      title: options?.title || 'Confirm Activation',
      message: options?.message || `Are you sure you want to activate "${itemName}"? They will regain access to the system.`,
      confirmText: options?.confirmText || 'Activate',
      variant: options?.variant || 'success',
      onConfirm,
      onCancel: options?.onCancel,
    });
  }, [confirm]);

  const confirmResetPassword = useCallback((
    userName: string,
    onConfirm: () => void | Promise<void>,
    options?: Partial<ConfirmActionOptions>
  ) => {
    confirm({
      title: options?.title || 'Reset Password',
      message: options?.message || `Are you sure you want to reset the password for "${userName}"? They will receive an email with a new temporary password.`,
      confirmText: options?.confirmText || 'Reset Password',
      variant: options?.variant || 'warning',
      onConfirm,
      onCancel: options?.onCancel,
    });
  }, [confirm]);

  const confirmClearData = useCallback((
    dataType: string,
    onConfirm: () => void | Promise<void>,
    options?: Partial<ConfirmActionOptions>
  ) => {
    confirm({
      title: options?.title || 'Clear Data',
      message: options?.message || `Are you sure you want to clear all ${dataType}? This action cannot be undone.`,
      confirmText: options?.confirmText || 'Clear Data',
      variant: options?.variant || 'danger',
      onConfirm,
      onCancel: options?.onCancel,
    });
  }, [confirm]);

  const confirmRemove = useCallback((
    itemName: string,
    itemType: string,
    onConfirm: () => void | Promise<void>,
    options?: Partial<ConfirmActionOptions>
  ) => {
    confirm({
      title: options?.title || `Remove ${itemType}`,
      message: options?.message || `Are you sure you want to remove this ${itemType.toLowerCase()}? This action cannot be undone.`,
      confirmText: options?.confirmText || 'Remove',
      variant: options?.variant || 'warning',
      onConfirm,
      onCancel: options?.onCancel,
    });
  }, [confirm]);

  const confirmAction = useCallback((
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    options?: Partial<ConfirmActionOptions>
  ) => {
    confirm({
      title,
      message,
      confirmText: options?.confirmText || 'Confirm',
      variant: options?.variant || 'warning',
      onConfirm,
      onCancel: options?.onCancel,
    });
  }, [confirm]);

  return {
    confirmDelete,
    confirmSuspend,
    confirmActivate,
    confirmResetPassword,
    confirmClearData,
    confirmRemove,
    confirmAction,
  };
}; 