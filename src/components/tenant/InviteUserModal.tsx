"use client";

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Mail, User, Shield, Copy, Check, AlertTriangle } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import axios from 'axios';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';

// Validation schema for user invitation
const inviteUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Please enter a valid email address'),
  roleId: z.string().min(1, 'Role is required'),
  message: z.string().optional(),
});

type InviteUserData = z.infer<typeof inviteUserSchema>;

interface Role {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const InviteUserModal: React.FC<InviteUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const queryClient = useQueryClient();
  const [invitationUrl, setInvitationUrl] = useState<string>('');
  const [showInvitationUrl, setShowInvitationUrl] = useState(false);
  const [copied, setCopied] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm<InviteUserData>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      name: '',
      email: '',
      roleId: '',
      message: ''
    }
  });

  // Fetch roles for the tenant
  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['tenant-roles', tenantSlug],
    queryFn: async (): Promise<Role[]> => {
      const token = localStorage.getItem('tenant_auth_token') || localStorage.getItem('auth_token');
      const response = await axios.get(`/api/tenant/${tenantSlug}/roles`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: { page: 1, limit: 100 }
      });
      return response.data.data.roles || [];
    },
    enabled: !!tenantSlug && isOpen,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Invite user mutation
  const inviteUserMutation = useMutation({
    mutationFn: async (data: InviteUserData) => {
      const token = localStorage.getItem('tenant_auth_token') || localStorage.getItem('auth_token');
      const response = await axios.post(`/api/tenant/${tenantSlug}/users/invite`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    },
    onSuccess: (response) => {
      toast.success('User invitation sent successfully!');
      setInvitationUrl(response.data.invitation.invitationUrl);
      setShowInvitationUrl(true);
      queryClient.invalidateQueries({ queryKey: ['tenant-users'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to send invitation';
      toast.error(message);
      
      // Set form errors if validation failed
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach((err: any) => {
          setError(err.field as keyof InviteUserData, { message: err.message });
        });
      }
    }
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      reset();
      setInvitationUrl('');
      setShowInvitationUrl(false);
      setCopied(false);
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: InviteUserData) => {
    try {
      await inviteUserMutation.mutateAsync(data);
    } catch (error) {
      // Error is handled in onError callback
    }
  };

  const handleCopyInvitationUrl = async () => {
    try {
      await navigator.clipboard.writeText(invitationUrl);
      setCopied(true);
      toast.success('Invitation URL copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  const handleClose = () => {
    if (showInvitationUrl) {
      onSuccess?.();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={handleClose}></div>

        <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
                <UserPlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {showInvitationUrl ? 'Invitation Sent' : 'Invite New User'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {showInvitationUrl 
                    ? 'Share the invitation URL with the user' 
                    : 'Send an invitation to join your organization'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {showInvitationUrl ? (
            /* Success State - Show Invitation URL */
            <div className="space-y-6">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-400 mr-2" />
                  <span className="text-green-800 dark:text-green-200 font-medium">
                    Invitation created successfully!
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="invitationUrl">Invitation URL</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="invitationUrl"
                    type="text"
                    value={invitationUrl}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyInvitationUrl}
                    className="flex items-center"
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Share this URL with the user to complete their registration. The invitation expires in 7 days.
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleClose}
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name */}
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="text"
                      placeholder="Enter full name"
                      error={errors.name?.message}
                    />
                  )}
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="email"
                      placeholder="Enter email address"
                      error={errors.email?.message}
                    />
                  )}
                />
              </div>

              {/* Role */}
              <div>
                <Label htmlFor="roleId">Role *</Label>
                <Controller
                  name="roleId"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">Select role</option>
                      {rolesData?.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                          {role.description && ` - ${role.description}`}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.roleId && (
                  <p className="mt-1 text-sm text-red-500">{errors.roleId.message}</p>
                )}
                {rolesLoading && (
                  <p className="mt-1 text-sm text-gray-500">Loading roles...</p>
                )}
              </div>

              {/* Message */}
              <div>
                <Label htmlFor="message">Personal Message (Optional)</Label>
                <Controller
                  name="message"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      rows={3}
                      placeholder="Add a personal message to the invitation..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                    />
                  )}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  startIcon={isSubmitting ? undefined : <Mail className="w-4 h-4" />}
                >
                  {isSubmitting ? 'Sending Invitation...' : 'Send Invitation'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteUserModal;
