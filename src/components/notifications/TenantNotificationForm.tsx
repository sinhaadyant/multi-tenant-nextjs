"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  X, 
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useCreateTenantNotification, CreateTenantNotificationData, TenantNotification } from '@/hooks/useTenantNotifications';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/useToast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/button/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';

interface TenantNotificationFormProps {
  notification?: TenantNotification;
  mode?: 'create' | 'edit';
  onCancel?: () => void;
  onSuccess?: () => void;
  className?: string;
}

export const TenantNotificationForm: React.FC<TenantNotificationFormProps> = ({
  notification,
  mode = 'create',
  onCancel,
  onSuccess,
  className = ''
}) => {
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { success, error } = useToast();
  const { hasPermission } = usePermissions();

  const [formData, setFormData] = useState<CreateTenantNotificationData>({
    title: '',
    message: '',
    priority: 'medium',
    targetType: 'specific_tenant'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const createNotificationMutation = useCreateTenantNotification();

  // Check permissions
  const canCreate = hasPermission('notifications', 'create');
  const canUpdate = hasPermission('notifications', 'update');

  // Initialize form data when editing
  useEffect(() => {
    if (notification && mode === 'edit') {
      setFormData({
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        targetType: notification.targetType,
        metadata: notification.metadata ? JSON.parse(notification.metadata) : undefined
      });
    }
  }, [notification, mode]);

  const handleInputChange = (field: keyof CreateTenantNotificationData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      error('Title is required');
      return;
    }

    if (!formData.message.trim()) {
      error('Message is required');
      return;
    }

    if (mode === 'create' && !canCreate) {
      error('You do not have permission to create notifications');
      return;
    }

    if (mode === 'edit' && !canUpdate) {
      error('You do not have permission to update notifications');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        await createNotificationMutation.mutateAsync(formData);
        success('Notification created successfully!');
      }
      // TODO: Add edit functionality when API is ready
      
      onSuccess?.();
      router.push(`/${tenantSlug}/notifications`);
    } catch (err: any) {
      error(err.message || `Failed to ${mode} notification`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'medium':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'low':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'medium':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push(`/${tenantSlug}/notifications`)}
            className="inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Notifications
          </Button>
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {mode === 'create' ? 'Create Notification' : 'Edit Notification'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {mode === 'create' ? 'Create a new notification for your tenant' : 'Update notification details'}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <Label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title *
              </Label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter notification title"
                className="w-full"
                required
                maxLength={200}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formData.title.length}/200 characters
              </p>
            </div>

            {/* Message */}
            <div>
              <Label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message *
              </Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                placeholder="Enter notification message"
                rows={4}
                className="w-full"
                required
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formData.message.length}/1000 characters
              </p>
            </div>

            {/* Priority */}
            <div>
              <Label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Low
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-500" />
                      Medium
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      High
                    </div>
                  </SelectItem>
                  <SelectItem value="urgent">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      Urgent
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className="mt-2">
                <Badge className={getPriorityColor(formData.priority)}>
                  {getPriorityIcon(formData.priority)}
                  <span className="ml-1 capitalize">{formData.priority}</span>
                </Badge>
              </div>
            </div>

            {/* Target Type */}
            <div>
              <Label htmlFor="targetType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Type
              </Label>
              <Select value={formData.targetType} onValueChange={(value) => handleInputChange('targetType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="specific_tenant">Tenant Only</SelectItem>
                  <SelectItem value="user">User Specific</SelectItem>
                  <SelectItem value="all_tenants">All Tenants</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formData.targetType === 'specific_tenant' && 'Notification will be visible to all users in your tenant'}
                {formData.targetType === 'user' && 'Notification will be visible to specific users'}
                {formData.targetType === 'all_tenants' && 'Notification will be visible to all tenants'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel || (() => router.push(`/${tenantSlug}/notifications`))}
                disabled={isSubmitting}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              
              <Button
                type="submit"
                disabled={isSubmitting || createNotificationMutation.isPending}
                className="inline-flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSubmitting || createNotificationMutation.isPending 
                  ? (mode === 'create' ? 'Creating...' : 'Updating...') 
                  : (mode === 'create' ? 'Create Notification' : 'Update Notification')
                }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
