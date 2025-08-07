"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import ConfirmModal from './ConfirmModal';
import { useConfirmModal, ConfirmModalOptions } from '@/hooks/useConfirmModal';

interface ConfirmModalContextType {
  confirm: (options: ConfirmModalOptions) => void;
}

const ConfirmModalContext = createContext<ConfirmModalContextType | undefined>(undefined);

interface ConfirmModalProviderProps {
  children: ReactNode;
}

export const ConfirmModalProvider: React.FC<ConfirmModalProviderProps> = ({ children }) => {
  const {
    isOpen,
    options,
    confirm,
    close,
    handleConfirm,
    handleCancel,
  } = useConfirmModal();

  return (
    <ConfirmModalContext.Provider value={{ confirm }}>
      {children}
      <ConfirmModal
        isOpen={isOpen}
        onClose={close}
        onConfirm={handleConfirm}
        title={options?.title || ''}
        message={options?.message || ''}
        confirmText={options?.confirmText}
        cancelText={options?.cancelText}
        variant={options?.variant}
      />
    </ConfirmModalContext.Provider>
  );
};

export const useConfirmModalContext = () => {
  const context = useContext(ConfirmModalContext);
  if (context === undefined) {
    throw new Error('useConfirmModalContext must be used within a ConfirmModalProvider');
  }
  return context;
}; 