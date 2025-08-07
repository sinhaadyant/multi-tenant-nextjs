import { useState, useCallback } from 'react';

export interface ConfirmModalOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface ConfirmModalState {
  isOpen: boolean;
  options: ConfirmModalOptions | null;
}

export const useConfirmModal = () => {
  const [state, setState] = useState<ConfirmModalState>({
    isOpen: false,
    options: null,
  });

  const confirm = useCallback((options: ConfirmModalOptions) => {
    setState({
      isOpen: true,
      options,
    });
  }, []);

  const close = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const handleConfirm = useCallback(async () => {
    if (state.options) {
      try {
        await state.options.onConfirm();
      } finally {
        close();
      }
    }
  }, [state.options, close]);

  const handleCancel = useCallback(() => {
    if (state.options?.onCancel) {
      state.options.onCancel();
    }
    close();
  }, [state.options, close]);

  return {
    isOpen: state.isOpen,
    options: state.options,
    confirm,
    close,
    handleConfirm,
    handleCancel,
  };
};

// Convenience functions for common confirmation types
export const useConfirmModalHelpers = () => {
  const { confirm } = useConfirmModal();

  const confirmDelete = useCallback((
    itemName: string,
    onConfirm: () => void | Promise<void>,
    options?: Partial<ConfirmModalOptions>
  ) => {
    confirm({
      title: 'Confirm Deletion',
      message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
      onConfirm,
      ...options,
    });
  }, [confirm]);

  const confirmAction = useCallback((
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    options?: Partial<ConfirmModalOptions>
  ) => {
    confirm({
      title,
      message,
      confirmText: 'Confirm',
      variant: 'warning',
      onConfirm,
      ...options,
    });
  }, [confirm]);

  const confirmInfo = useCallback((
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    options?: Partial<ConfirmModalOptions>
  ) => {
    confirm({
      title,
      message,
      confirmText: 'Continue',
      variant: 'info',
      onConfirm,
      ...options,
    });
  }, [confirm]);

  const confirmSuccess = useCallback((
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    options?: Partial<ConfirmModalOptions>
  ) => {
    confirm({
      title,
      message,
      confirmText: 'Proceed',
      variant: 'success',
      onConfirm,
      ...options,
    });
  }, [confirm]);

  return {
    confirmDelete,
    confirmAction,
    confirmInfo,
    confirmSuccess,
  };
}; 