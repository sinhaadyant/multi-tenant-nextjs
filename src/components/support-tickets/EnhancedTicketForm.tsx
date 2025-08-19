"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useCreateSupportTicket, useUpdateSupportTicket, CreateTicketData, UpdateTicketData, SupportTicket } from '@/hooks/useSupportTickets';
import { useToast } from '@/hooks/useToast';
import { usePermissions } from '@/hooks/usePermissions';
import { EnhancedAttachmentUploader, AttachmentFile } from './EnhancedAttachmentUploader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import Link from 'next/link';

interface EnhancedTicketFormProps {
  ticket?: SupportTicket;
  mode: 'create' | 'edit';
  className?: string;
}

export const EnhancedTicketForm: React.FC<EnhancedTicketFormProps> = ({
  ticket,
  mode,
  className = ''
}) => {
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { success, error } = useToast();
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  
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
  const [isDirty, setIsDirty] = useState(false);

  // Check permissions
  const canCreate = hasPermission('support', 'create');
  const canUpdate = hasPermission('support', 'update');

  // Check if user has permission for the current mode
  if (mode === 'create' && !canCreate) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Access Denied
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              You don't have permission to create support tickets.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (mode === 'edit' && !canUpdate) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Access Denied
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              You don't have permission to edit support tickets.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const validateForm = useCallback((): boolean => {
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
    } else if (formData.description.trim().length > 5000) {
      newErrors.description = 'Description must be less than 5000 characters';
    }

    // Priority validation
    if (!formData.priority) {
      newErrors.priority = 'Priority is required';
    }

    // Category validation
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
          attachments: attachments
            .filter(att => !att.isUploading && !att.uploadError)
            .map(att => ({
              filename: att.filename,
              originalName: att.originalName,
              mimeType: att.mimeType,
              size: att.size,
              path: att.path || ''
            }))
        };

        const result = await createTicketMutation.mutateAsync(createData);
        success('Support ticket created successfully!');
        
        // Redirect to the new ticket
        router.push(`/${tenantSlug}/support-tickets/${result.ticket.id}`);
      } else {
        const updateData: UpdateTicketData = {
          title: formData.title.trim(),
          description: formData.description.trim(),
          priority: formData.priority as any,
          category: formData.category as any
        };

        await updateTicketMutation.mutateAsync({ id: ticket!.id, data: updateData });
        success('Support ticket updated successfully!');
        
        // Redirect back to ticket details
        router.push(`/${tenantSlug}/support-tickets/${ticket!.id}`);
      }
    } catch (err: any) {
      error(err.message || `Failed to ${mode} ticket`);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    mode,
    validateForm,
    formData,
    attachments,
    createTicketMutation,
    updateTicketMutation,
    success,
    error,
    router,
    tenantSlug,
    ticket
  ]);

  const handleCancel = useCallback(() => {
    if (isDirty) {
      // Show confirmation dialog if form is dirty
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.back();
      }
    } else {
      router.back();
    }
  }, [isDirty, router]);

  // Reset dirty state when form is successfully submitted
  useEffect(() => {
    if (!isSubmitting && !createTicketMutation.isError && !updateTicketMutation.isError) {
      setIsDirty(false);
    }
  }, [isSubmitting, createTicketMutation.isError, updateTicketMutation.isError]);

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
  ];

  const categoryOptions = [
    { value: 'general', label: 'General', color: 'bg-gray-100 text-gray-800' },
    { value: 'technical', label: 'Technical', color: 'bg-purple-100 text-purple-800' },
    { value: 'billing', label: 'Billing', color: 'bg-green-100 text-green-800' },
    { value: 'feature-request', label: 'Feature Request', color: 'bg-blue-100 text-blue-800' },
    { value: 'bug-report', label: 'Bug Report', color: 'bg-red-100 text-red-800' }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${tenantSlug}/support-tickets`}>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Tickets
            </Button>
          </Link>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {mode === 'create' ? 'Create New Support Ticket' : 'Edit Support Ticket'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {mode === 'create' 
                ? 'Submit a new support request with detailed information'
                : 'Update the support ticket information'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !isDirty}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {mode === 'create' ? 'Create Ticket' : 'Update Ticket'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <Input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Brief description of your issue or request"
                  className={errors.title ? 'border-red-500' : ''}
                  maxLength={100}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.title}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {formData.title.length}/100 characters
                </p>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Please provide detailed information about your issue or request..."
                  rows={8}
                  className={errors.description ? 'border-red-500' : ''}
                  maxLength={5000}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.description}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {formData.description.length}/5000 characters
                </p>
              </div>

              {/* Priority and Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority *
                  </label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => handleInputChange('priority', value)}
                  >
                    <SelectTrigger className={errors.priority ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Badge className={option.color}>
                              {option.label}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.priority && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.priority}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category *
                  </label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleInputChange('category', value)}
                  >
                    <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Badge className={option.color}>
                              {option.label}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.category}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add files, screenshots, or documents to help us understand your issue better
              </p>
            </CardHeader>
            <CardContent>
              <EnhancedAttachmentUploader
                attachments={attachments}
                onAttachmentsChange={setAttachments}
                maxFiles={5}
                maxFileSize={10 * 1024 * 1024} // 10MB
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Help Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Tips for Better Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="font-medium mb-2">📝 Be Specific</p>
                <p>Provide clear, detailed descriptions of your issue or request.</p>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="font-medium mb-2">🖼️ Add Screenshots</p>
                <p>Visual evidence helps us understand and resolve issues faster.</p>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="font-medium mb-2">📊 Include Context</p>
                <p>Mention steps to reproduce, error messages, and system details.</p>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="font-medium mb-2">⏰ Set Priority</p>
                <p>Choose the appropriate priority level for your request.</p>
              </div>
            </CardContent>
          </Card>

          {/* Priority Guide */}
          <Card>
            <CardHeader>
              <CardTitle>Priority Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {priorityOptions.map((option) => (
                <div key={option.value} className="flex items-center gap-2">
                  <Badge className={option.color}>
                    {option.label}
                  </Badge>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {option.value === 'low' && 'Minor issues, feature requests'}
                    {option.value === 'medium' && 'General questions, improvements'}
                    {option.value === 'high' && 'Important issues affecting work'}
                    {option.value === 'urgent' && 'Critical issues, system down'}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Category Guide */}
          <Card>
            <CardHeader>
              <CardTitle>Category Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {categoryOptions.map((option) => (
                <div key={option.value} className="flex items-center gap-2">
                  <Badge className={option.color}>
                    {option.label}
                  </Badge>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {option.value === 'general' && 'General questions, account issues'}
                    {option.value === 'technical' && 'Technical problems, bugs'}
                    {option.value === 'billing' && 'Payment, subscription issues'}
                    {option.value === 'feature-request' && 'New feature suggestions'}
                    {option.value === 'bug-report' && 'Report software bugs'}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Error Alert */}
      {(createTicketMutation.isError || updateTicketMutation.isError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {createTicketMutation.error?.message || updateTicketMutation.error?.message || 'An error occurred'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
