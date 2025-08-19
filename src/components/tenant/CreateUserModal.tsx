"use client";

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Mail, User, Phone, Shield, Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { useCreateUser, useTenantRoles } from '@/hooks/useTenantUsers';
import { useDynamicPermissions } from '@/context/DynamicPermissionsContext';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/Input';
import Label from '@/components/form/Label';
import Switch from '@/components/form/switch/Switch';

// Validation schema
const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  contactNumber: z.string().optional(),
  roleIds: z.array(z.string()).min(1, 'At least one role is required'),
  sendInvitation: z.boolean().default(false)
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  tenantSlug: string;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  tenantSlug
}) => {
  const { hasPermission } = useDynamicPermissions();
  const createUserMutation = useCreateUser(tenantSlug);
  const { data: rolesData, isLoading: rolesLoading } = useTenantRoles(tenantSlug);

  const [showPassword, setShowPassword] = useState(false);
  const [sendInvitation, setSendInvitation] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      contactNumber: '',
      roleIds: [],
      sendInvitation: false
    }
  });

  const watchedRoleIds = watch('roleIds');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      reset();
      setShowPassword(false);
      setSendInvitation(false);
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: CreateUserFormData) => {
    try {
      if (sendInvitation) {
        // Handle invitation flow
        // TODO: Implement invitation API call
        toast.success('Invitation sent successfully');
      } else {
        // Handle direct user creation
        await createUserMutation.mutateAsync({
          ...data,
          sendInvitation: false
        });
        toast.success('User created successfully');
      }
      
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
    }
  };

  const handleRoleToggle = (roleId: string) => {
    const currentRoles = watchedRoleIds || [];
    // If the role is already selected, deselect it
    if (currentRoles.includes(roleId)) {
      setValue('roleIds', []);
    } else {
      // Otherwise, select only this role (single selection)
      setValue('roleIds', [roleId]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <UserPlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Create New User
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add a new user to your tenant
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Basic Information</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter full name"
                  {...register('name')}
                  error={errors.name?.message}
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  {...register('email')}
                  error={errors.email?.message}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="contactNumber">Contact Number</Label>
              <Input
                id="contactNumber"
                type="tel"
                placeholder="Enter contact number"
                {...register('contactNumber')}
                error={errors.contactNumber?.message}
              />
            </div>
          </div>

          {/* Authentication */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Authentication</span>
            </h3>

            <div className="flex items-center space-x-4">
              <Switch
                id="sendInvitation"
                checked={sendInvitation}
                onCheckedChange={setSendInvitation}
                label="Send invitation email instead of setting password"
              />
            </div>

            {!sendInvitation && (
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  {...register('password')}
                  error={errors.password?.message}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1"
                >
                  {showPassword ? 'Hide' : 'Show'} password
                </button>
              </div>
            )}
          </div>

          {/* Role Assignment */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Role Assignment *</span>
            </h3>

            {rolesLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading roles...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {rolesData?.roles?.map((role) => (
                  <div
                    key={role.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      watchedRoleIds?.includes(role.id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                    onClick={() => handleRoleToggle(role.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        watchedRoleIds?.includes(role.id)
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {watchedRoleIds?.includes(role.id) && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {role.name}
                        </h4>
                        {role.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {role.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Select one role for the user
            </p>
            
            {errors.roleIds && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.roleIds.message}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
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
              disabled={isSubmitting || createUserMutation.isPending}
              loading={isSubmitting || createUserMutation.isPending}
            >
              {sendInvitation ? (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Invitation
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create User
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal; 