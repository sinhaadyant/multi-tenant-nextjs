"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, X } from 'lucide-react';
import { useCreateSupportTicket, useUpdateSupportTicket, CreateTicketData, UpdateTicketData, SupportTicket } from '@/hooks/useSupportTickets';
import { useToast } from '@/hooks/useToast';
import { AttachmentUploader, AttachmentFile } from './AttachmentUploader';
import Link from 'next/link';

interface TicketFormProps {
  ticket?: SupportTicket;
  mode: 'create' | 'edit';
  className?: string;
}

export const TicketForm: React.FC<TicketFormProps> = ({
  ticket,
  mode,
  className = ''
}) => {
  const router = useRouter();
  const { success, error } = useToast();
  
  const createTicketMutation = useCreateSupportTicket();
  const updateTicketMutation = useUpdateSupportTicket();

  const [formData, setFormData] = useState({
    title: ticket?.title || '',
    description: ticket?.description || '',
    priority: ticket?.priority || 'medium',
    category: ticket?.category || 'general'
  });

  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    } else if (formData.title.trim().length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'create') {
        const createData: CreateTicketData = {
          title: formData.title.trim(),
          description: formData.description.trim(),
          priority: formData.priority as any,
          category: formData.category as any,
          attachments: attachments.map(att => ({
            filename: att.filename,
            originalName: att.originalName,
            mimeType: att.mimeType,
            size: att.size,
            path: att.path || ''
          }))
        };

        await createTicketMutation.mutateAsync(createData);
        success('Support ticket created successfully!');
        
        // Determine redirect path based on current URL
        const currentPath = window.location.pathname;
        if (currentPath.includes('/superadmin/')) {
          router.push('/superadmin/support-tickets');
        } else if (currentPath.includes('/[tenantSlug]/') || currentPath.includes('/tenant/')) {
          // Extract tenant slug from current path
          const pathParts = currentPath.split('/');
          const tenantSlug = pathParts[1];
          router.push(`/${tenantSlug}/support-tickets`);
        } else {
          router.push('/support-tickets');
        }
      } else {
        const updateData: UpdateTicketData = {
          title: formData.title.trim(),
          description: formData.description.trim(),
          priority: formData.priority as any,
          category: formData.category as any
        };

        await updateTicketMutation.mutateAsync({ id: ticket!.id, data: updateData });
        success('Support ticket updated successfully!');
        
        // Determine redirect path based on current URL
        const currentPath = window.location.pathname;
        if (currentPath.includes('/superadmin/')) {
          router.push(`/superadmin/support-tickets/${ticket!.id}`);
        } else if (currentPath.includes('/[tenantSlug]/') || currentPath.includes('/tenant/')) {
          // Extract tenant slug from current path
          const pathParts = currentPath.split('/');
          const tenantSlug = pathParts[1];
          router.push(`/${tenantSlug}/support-tickets/${ticket!.id}`);
        } else {
          router.push(`/support-tickets/${ticket!.id}`);
        }
      }
    } catch (err: any) {
      error(err.message || 'An error occurred while saving the ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmittingAny = isSubmitting || createTicketMutation.isPending || updateTicketMutation.isPending;

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link
            href="/support-tickets"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tickets
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {mode === 'create' ? 'Create New Support Ticket' : 'Edit Support Ticket'}
            </h1>
            <p className="text-gray-600">
              {mode === 'create' 
                ? 'Submit a new support request with details and attachments'
                : 'Update your support ticket information'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {/* Title */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Brief description of your issue"
              maxLength={100}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.title.length}/100 characters
            </p>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={6}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Please provide detailed information about your issue, including steps to reproduce, error messages, and any relevant context."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Minimum 10 characters required
            </p>
          </div>

          {/* Priority and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="general">General</option>
                <option value="technical">Technical</option>
                <option value="billing">Billing</option>
                <option value="feature-request">Feature Request</option>
                <option value="bug-report">Bug Report</option>
              </select>
            </div>
          </div>
        </div>

        {/* Attachments */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Attachments</h3>
          <AttachmentUploader
            attachments={attachments}
            onAttachmentsChange={setAttachments}
            maxFiles={10}
            maxSize={5 * 1024 * 1024} // 5MB
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-4">
          <Link
            href="/support-tickets"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmittingAny}
            className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmittingAny ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {mode === 'create' ? 'Create Ticket' : 'Update Ticket'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
