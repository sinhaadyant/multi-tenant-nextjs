"use client";

import React, { useState } from 'react';
import { X, Shield, Palette, Star, Save, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Validation schema
const createRoleSchema = z.object({
  name: z.string()
    .min(1, 'Role name is required')
    .max(100, 'Role name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Role name can only contain letters, numbers, spaces, hyphens, and underscores'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  isDefault: z.boolean().default(false),
  color: z.string().optional(),
  priority: z.number().int().min(0).max(100).default(0)
});

type CreateRoleFormData = z.infer<typeof createRoleSchema>;

interface CreateRoleModalProps {
  onClose: () => void;
  onSubmit: (data: CreateRoleFormData) => void;
  isLoading: boolean;
}

const CreateRoleModal: React.FC<CreateRoleModalProps> = ({
  onClose,
  onSubmit,
  isLoading
}) => {
  const [selectedColor, setSelectedColor] = useState<string>('blue');

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue
  } = useForm<CreateRoleFormData>({
    resolver: zodResolver(createRoleSchema),
    mode: 'onChange'
  });

  const isDefault = watch('isDefault');

  const colorOptions = [
    { name: 'Blue', value: 'blue', class: 'bg-blue-100 text-blue-600' },
    { name: 'Green', value: 'green', class: 'bg-green-100 text-green-600' },
    { name: 'Purple', value: 'purple', class: 'bg-purple-100 text-purple-600' },
    { name: 'Orange', value: 'orange', class: 'bg-orange-100 text-orange-600' },
    { name: 'Red', value: 'red', class: 'bg-red-100 text-red-600' },
    { name: 'Yellow', value: 'yellow', class: 'bg-yellow-100 text-yellow-600' },
    { name: 'Pink', value: 'pink', class: 'bg-pink-100 text-pink-600' },
    { name: 'Indigo', value: 'indigo', class: 'bg-indigo-100 text-indigo-600' },
    { name: 'Gray', value: 'gray', class: 'bg-gray-100 text-gray-600' }
  ];

  const handleFormSubmit = (data: CreateRoleFormData) => {
    onSubmit({
      ...data,
      color: selectedColor
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Create New Role
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Define a new role for your organization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
          {/* Role Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role Name *
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="Enter role name"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                errors.name
                  ? 'border-red-300 dark:border-red-600'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Describe the role's purpose and responsibilities"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                errors.description
                  ? 'border-red-300 dark:border-red-600'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Role Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role Color
            </label>
            <div className="grid grid-cols-3 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedColor === color.value
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-full h-8 rounded ${color.class} flex items-center justify-center`}>
                    <Shield className="w-4 h-4" />
                  </div>
                  <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                    {color.name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </label>
            <input
              type="number"
              {...register('priority', { valueAsNumber: true })}
              min="0"
              max="100"
              placeholder="0"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                errors.priority
                  ? 'border-red-300 dark:border-red-600'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Higher numbers have higher priority (0-100)
            </p>
            {errors.priority && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.priority.message}
              </p>
            )}
          </div>

          {/* Default Role */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              {...register('isDefault')}
              id="isDefault"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isDefault" className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>Set as default role for new users</span>
            </label>
          </div>

          {isDefault && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium">Default Role Warning</p>
                  <p>This role will be automatically assigned to new users. Only one role can be set as default.</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isLoading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isLoading ? 'Creating...' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoleModal; 