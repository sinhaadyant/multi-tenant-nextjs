"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SuperadminProfile } from '@/hooks/useSuperadminProfile';
import { useSuperadminProfile } from '@/hooks/useSuperadminProfile';
import { updateProfileSchema, UpdateProfileData } from '@/lib/validations/superadmin';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';
import { Camera, Upload, X } from '@/icons';
import { useToast } from '@/hooks/useToast';
import { useConfirmModalContext } from '@/components/common/ConfirmModalProvider';

interface ProfileEditProps {
  profile: SuperadminProfile | null;
  isLoading: boolean;
  onProfileUpdated: () => void;
}

const ProfileEdit: React.FC<ProfileEditProps> = ({ profile, isLoading, onProfileUpdated }) => {
  const { updateProfile, uploadAvatar, isUpdating } = useSuperadminProfile();
  const { toast } = useToast();
  const { confirm } = useConfirmModalContext();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar || null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue
  } = useForm<UpdateProfileData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: profile?.name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      bio: profile?.bio || '',
    }
  });

  // Update form data when profile changes
  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
      });
      setAvatarPreview(profile.avatar || null);
    }
  }, [profile, reset]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Please select a JPEG or PNG image file' });
      return;
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      setMessage({ type: 'error', text: 'Image size must be less than 2MB' });
      return;
    }

    setIsUploadingAvatar(true);
    setMessage(null);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to server
      const result = await uploadAvatar(file);
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        onProfileUpdated();
      } else {
        setMessage({ type: 'error', text: result.message });
        // Revert preview on error
        setAvatarPreview(profile?.avatar || null);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upload avatar' });
      setAvatarPreview(profile?.avatar || null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const removeAvatar = () => {
    confirm({
      title: 'Remove Avatar',
      message: 'Are you sure you want to remove your profile picture? This action cannot be undone.',
      confirmText: 'Remove Avatar',
      variant: 'warning',
      onConfirm: () => {
        setAvatarPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        toast.success('Avatar removed successfully');
      },
    });
  };

  const onSubmit = async (data: UpdateProfileData) => {
    setMessage(null);

    try {
      const result = await updateProfile({
        name: data.name.trim(),
        email: data.email,
        phone: data.phone?.trim() || undefined,
        bio: data.bio,
      });

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        onProfileUpdated();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-white border border-gray-200 rounded-2xl dark:bg-gray-900 dark:border-gray-800">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded dark:bg-gray-700 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index}>
                <div className="h-4 bg-gray-200 rounded dark:bg-gray-700 mb-2"></div>
                <div className="h-11 bg-gray-200 rounded dark:bg-gray-700"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-2xl dark:bg-gray-900 dark:border-gray-800">
      <h2 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
        Edit Profile
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Avatar Upload Section */}
        <div>
          <Label>Profile Picture</Label>
          <div className="flex items-center gap-4 mt-2">
            <div className="relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile preview"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="flex items-center justify-center w-20 h-20 text-2xl font-semibold text-white bg-gray-300 rounded-full dark:bg-gray-600">
                  {(profile?.name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              
              {isUploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
              >
                <Upload className="w-4 h-4 mr-2" />
                {avatarPreview ? 'Change' : 'Upload'}
              </Button>
              
              {avatarPreview && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={removeAvatar}
                  disabled={isUploadingAvatar}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Supported formats: JPEG, PNG. Max size: 2MB
          </p>
        </div>

        {/* Name Field */}
        <div>
          <Label>
            Full Name <span className="text-error-500">*</span>
          </Label>
          <Input
            {...register('name')}
            type="text"
            placeholder="Enter your full name"
            error={!!errors.name}
            hint={errors.name?.message}
          />
        </div>

        {/* Phone Field */}
        <div>
          <Label>Phone Number</Label>
          <Input
            {...register('phone')}
            type="tel"
            placeholder="Enter 10-digit mobile number"
            error={!!errors.phone}
            hint={errors.phone?.message}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Optional. Enter a valid 10-digit Indian mobile number
          </p>
        </div>

        {/* Email Field (Read-only) */}
        <div>
          <Label>Email Address</Label>
          <Input
            {...register('email')}
            type="email"
            disabled
            placeholder="Email address"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Email address cannot be changed
          </p>
        </div>

        {/* Bio Field */}
        <div>
          <Label>Bio</Label>
          <Input
            {...register('bio')}
            type="text"
            placeholder="Tell us about yourself"
            error={!!errors.bio}
            hint={errors.bio?.message}
          />
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-success-50 text-success-700 border border-success-200 dark:bg-success-500/10 dark:text-success-400 dark:border-success-500/20'
              : 'bg-error-50 text-error-700 border border-error-200 dark:bg-error-500/10 dark:text-error-400 dark:border-error-500/20'
          }`}>
            {message.text}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting || isUploadingAvatar}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProfileEdit; 