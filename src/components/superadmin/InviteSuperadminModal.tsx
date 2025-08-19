"use client";

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import { UserPlus, Copy, Check, X } from 'lucide-react';
import { useCreateSuperAdminInvite } from '@/hooks/useSuperadminsAPI';
import { toast } from 'react-hot-toast';

interface InviteSuperadminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function InviteSuperadminModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: InviteSuperadminModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [inviteLink, setInviteLink] = useState<string>('');
  const [isLinkGenerated, setIsLinkGenerated] = useState(false);
  const [copied, setCopied] = useState(false);

  const createInviteMutation = useCreateSuperAdminInvite();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const result = await createInviteMutation.mutateAsync(formData);
      
      if (result?.data?.invite?.inviteLink) {
        setInviteLink(result.data.invite.inviteLink);
        setIsLinkGenerated(true);
        toast.success('Superadmin invite created successfully!');
      } else if (result?.data?.invite?.token) {
        // Construct the invite link using the actual token from API
        const baseUrl = window.location.origin;
        const constructedLink = `${baseUrl}/superadmin/signup?token=${result.data.invite.token}&email=${encodeURIComponent(formData.email)}`;
        setInviteLink(constructedLink);
        setIsLinkGenerated(true);
        toast.success('Superadmin invite created successfully!');
      } else {
        // Fallback: construct the invite link manually if not provided by API
        const baseUrl = window.location.origin;
        const constructedLink = `${baseUrl}/superadmin/signup?token=${result?.data?.token || 'invite-token'}&email=${encodeURIComponent(formData.email)}`;
        setInviteLink(constructedLink);
        setIsLinkGenerated(true);
        toast.success('Superadmin invite created successfully!');
      }
    } catch (error) {
      console.error('Error creating invite:', error);
      // Don't show error toast here as it's handled by the mutation
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success('Invite link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy link to clipboard');
    }
  };

  const handleClose = () => {
    // Reset form state
    setFormData({ name: '', email: '' });
    setInviteLink('');
    setIsLinkGenerated(false);
    setCopied(false);
    onClose();
  };

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[600px] m-4">
      <div className="relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
        <div className="mb-6">
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Invite Superadmin
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Send an invitation to a new superadmin. They will receive an email with a signup link.
          </p>
        </div>

        {!isLinkGenerated ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter full name"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
                required
                className="mt-1"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createInviteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={createInviteMutation.isPending || !formData.name.trim() || !formData.email.trim()}
              >
                {createInviteMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating Invite...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Invite
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Check className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
                    Invite Created Successfully!
                  </h4>
                  <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                    The invite link has been generated. Copy and share it with the new superadmin.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label>Invite Link</Label>
              <div className="mt-1 flex items-center space-x-2">
                <Input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                This link will expire in 24 hours. Share it securely with the new superadmin.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  handleSuccess();
                  handleClose();
                }}
              >
                Done
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  setIsLinkGenerated(false);
                  setFormData({ name: '', email: '' });
                }}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Another
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
