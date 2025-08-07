"use client";

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
  disabled?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  disabled = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleTabKey = (event: KeyboardEvent) => {
        if (event.key === 'Tab') {
          if (event.shiftKey) {
            if (document.activeElement === firstElement) {
              event.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              event.preventDefault();
              firstElement.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleTabKey);
      firstElement?.focus();

      return () => {
        document.removeEventListener('keydown', handleTabKey);
      };
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (disabled || isLoading) return;
    
    try {
      await onConfirm();
    } catch (error) {
      // Error handling is up to the parent component
    }
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === backdropRef.current) {
      onClose();
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />,
          iconBg: 'bg-red-100 dark:bg-red-900/20',
          buttonBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          buttonText: 'text-white',
          borderColor: 'border-red-200 dark:border-red-800',
          bgColor: 'bg-red-50 dark:bg-red-900/10',
        };
      case 'warning':
        return {
          icon: <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />,
          iconBg: 'bg-yellow-100 dark:bg-yellow-900/20',
          buttonBg: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
          buttonText: 'text-white',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/10',
        };
      case 'info':
        return {
          icon: <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
          iconBg: 'bg-blue-100 dark:bg-blue-900/20',
          buttonBg: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          buttonText: 'text-white',
          borderColor: 'border-blue-200 dark:border-blue-800',
          bgColor: 'bg-blue-50 dark:bg-blue-900/10',
        };
      case 'success':
        return {
          icon: <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />,
          iconBg: 'bg-green-100 dark:bg-green-900/20',
          buttonBg: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
          buttonText: 'text-white',
          borderColor: 'border-green-200 dark:border-green-800',
          bgColor: 'bg-green-50 dark:bg-green-900/10',
        };
      default:
        return {
          icon: <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />,
          iconBg: 'bg-red-100 dark:bg-red-900/20',
          buttonBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          buttonText: 'text-white',
          borderColor: 'border-red-200 dark:border-red-800',
          bgColor: 'bg-red-50 dark:bg-red-900/10',
        };
    }
  };

  const variantStyles = getVariantStyles();

  if (!isOpen) return null;

  const modalContent = (
    <div
      ref={backdropRef}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity duration-200"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full transform transition-all duration-200 scale-100"
        role="document"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${variantStyles.iconBg} rounded-lg`}>
              {variantStyles.icon}
            </div>
            <div>
              <h2 
                id="modal-title"
                className="text-xl font-semibold text-gray-900 dark:text-white"
              >
                {title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close modal"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className={`p-4 ${variantStyles.bgColor} border ${variantStyles.borderColor} rounded-lg`}>
            <p 
              id="modal-description"
              className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
            >
              {message}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 dark:focus:ring-gray-400 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={disabled || isLoading}
            className={`px-4 py-2.5 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${variantStyles.buttonBg} ${variantStyles.buttonText} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Loading...
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Use createPortal to render at the root level
  return createPortal(modalContent, document.body);
};

export default ConfirmModal; 