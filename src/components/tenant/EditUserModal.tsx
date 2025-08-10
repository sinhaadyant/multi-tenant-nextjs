"use client";

import React, { useState, useEffect } from 'react';
import { X, User, Shield, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { useUpdateUser, useTenantUser } from '@/hooks/useTenantUsers';
import { useTenantRoles } from '@/hooks/useTenantRolesAPI';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import Switch from '@/components/form/switch/Switch';

const editUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  contactNumber: z.string().optional(),
  roleIds: z.array(z.string()).min(1, 'At least one role is required'),
  isActive: z.boolean().default(true)
});

type EditUserFormData = z.infer<typeof editUserSchema>;

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  tenantSlug: string;
  userId: string;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  tenantSlug,
  userId
}) => {
  const updateUserMutation = useUpdateUser(tenantSlug);
  const { data: userData, isLoading: userLoading } = useTenantUser(tenantSlug, userId);
  const { roles: rolesData, isLoading: rolesLoading } = useTenantRoles(tenantSlug, {});

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema)
  });

  const watchedRoleIds = watch('roleIds');

  useEffect(() => {
    if (userData?.user && isOpen) {
      reset({
        name: userData.user.name,
        email: userData.user.email,
        contactNumber: userData.user.contactNumber || '',
        roleIds: userData.user.roles.map(role => role.id),
        isActive: userData.user.isActive
      });
    }
  }, [userData, isOpen, reset]);

  const onSubmit = async (data: EditUserFormData) => {
    try {
      await updateUserMutation.mutateAsync({
        userId,
        data: {
          name: data.name,
          email: data.email,
          contactNumber: data.contactNumber,
          roleIds: data.roleIds,
          isActive: data.isActive
        }
      });
      
      toast.success('User updated successfully');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    }
  };

  const handleRoleToggle = (roleId: string) => {
    const currentRoles = watchedRoleIds || [];
    const newRoles = currentRoles.includes(roleId)
      ? currentRoles.filter(id => id !== roleId)
      : [...currentRoles, roleId];
    
    setValue('roleIds', newRoles);
  };

  if (!isOpen) return null;

  if (userLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-700 dark:text-gray-300">Loading user data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!userData?.user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400">User not found</p>
            <Button onClick={onClose} className="mt-4">Close</Button>
          </div>
        </div>
      </div>
    );
  }

  const user = userData.user;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Edit User
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Update user information and roles
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

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
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

          <div className="flex items-center space-x-4">
            <Switch
              id="isActive"
              checked={watch('isActive')}
              onCheckedChange={(checked) => setValue('isActive', checked)}
              label="User is active"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Role Assignment *
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
                      <input
                        type="checkbox"
                        checked={watchedRoleIds?.includes(role.id) || false}
                        onChange={() => handleRoleToggle(role.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
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

            {errors.roleIds && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.roleIds.message}
              </p>
            )}
          </div>

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
              disabled={isSubmitting || updateUserMutation.isPending}
              loading={isSubmitting || updateUserMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal; 