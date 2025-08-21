"use client";

import React, { useState, useRef } from 'react';
import { X, Upload, File, Image, FileText, Archive } from 'lucide-react';
import { useUploadSuperadminAttachment } from '@/hooks/useSuperadminSupportTickets';

export interface AttachmentFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path?: string;
  isUploading?: boolean;
  uploadError?: string;
}

interface SuperAdminAttachmentUploaderProps {
  attachments: AttachmentFile[];
  onAttachmentsChange: (attachments: AttachmentFile[] | ((prev: AttachmentFile[]) => AttachmentFile[])) => void;
  maxFiles?: number;
  maxFileSize?: number;
  className?: string;
}

export const SuperAdminAttachmentUploader: React.FC<SuperAdminAttachmentUploaderProps> = ({
  attachments,
  onAttachmentsChange,
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  className = ''
}) => {
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const uploadAttachmentMutation = useUploadSuperadminAttachment();

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return `File ${file.name} is too large. Maximum size is ${maxFileSize / (1024 * 1024)}MB`;
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      'application/zip',
      'application/x-rar-compressed'
    ];

    if (!allowedTypes.includes(file.type)) {
      return `File type ${file.type} is not allowed`;
    }

    return null;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (attachments.length + files.length > maxFiles) {
      setErrors([`Maximum ${maxFiles} files allowed`]);
      return;
    }

    setErrors([]);

    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        setErrors(prev => [...prev, validationError]);
        continue;
      }

      const attachmentId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Add file to attachments list with uploading state
      const newAttachment: AttachmentFile = {
        id: attachmentId,
        filename: file.name,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        isUploading: true
      };

      onAttachmentsChange([...attachments, newAttachment]);

      try {
        // Upload file
        const uploadedFile = await uploadAttachmentMutation.mutateAsync(file);
        
        // Update attachment with upload result
        onAttachmentsChange((prevAttachments: AttachmentFile[]) => prevAttachments.map((att: AttachmentFile) => 
          att.id === attachmentId 
            ? { ...att, ...uploadedFile, isUploading: false }
            : att
        ));
      } catch (error: any) {
        // Update attachment with error
        onAttachmentsChange((prevAttachments: AttachmentFile[]) => prevAttachments.map((att: AttachmentFile) => 
          att.id === attachmentId 
            ? { ...att, isUploading: false, uploadError: error.message || 'Upload failed' }
            : att
        ));
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (attachmentId: string) => {
    onAttachmentsChange(attachments.filter(att => att.id !== attachmentId));
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    } else if (mimeType.includes('pdf')) {
      return <FileText className="w-4 h-4" />;
    } else if (mimeType.includes('zip') || mimeType.includes('rar')) {
      return <Archive className="w-4 h-4" />;
    } else {
      return <File className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={className}>
      {/* File Upload Area */}
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.rar"
        />
        
        <div className="space-y-2">
          <Upload className="w-8 h-8 text-gray-400 mx-auto" />
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              Click to upload
            </button>
            <span className="text-gray-500 dark:text-gray-400"> or drag and drop</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Maximum {maxFiles} files, up to {maxFileSize / (1024 * 1024)}MB each
          </p>
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="text-sm text-red-600 dark:text-red-400">
            {errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        </div>
      )}

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Attachments ({attachments.length}/{maxFiles})
          </h4>
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  attachment.uploadError
                    ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                    : attachment.isUploading
                    ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  {getFileIcon(attachment.mimeType)}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {attachment.originalName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(attachment.size)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {attachment.isUploading && (
                    <div className="text-xs text-yellow-600 dark:text-yellow-400">
                      Uploading...
                    </div>
                  )}
                  {attachment.uploadError && (
                    <div className="text-xs text-red-600 dark:text-red-400">
                      {attachment.uploadError}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAttachment(attachment.id)}
                    className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Remove attachment"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
