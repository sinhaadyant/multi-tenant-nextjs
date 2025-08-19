"use client";

import React, { useState, useRef } from 'react';
import { X, Upload, File, Image, FileText, Archive } from 'lucide-react';
import { useUploadAttachment } from '@/hooks/useSupportTickets';

export interface AttachmentFile {
  file: File;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path?: string;
  preview?: string;
  isUploading?: boolean;
  uploadError?: string;
}

interface AttachmentUploaderProps {
  attachments: AttachmentFile[];
  onAttachmentsChange: (attachments: AttachmentFile[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
  className?: string;
}

const DEFAULT_MAX_FILES = 10;
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_ACCEPTED_TYPES = [
  'image/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed'
];

export const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({
  attachments,
  onAttachmentsChange,
  maxFiles = DEFAULT_MAX_FILES,
  maxSize = DEFAULT_MAX_SIZE,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  className = ''
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAttachmentMutation = useUploadAttachment();

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `File ${file.name} is too large. Maximum size is ${formatFileSize(maxSize)}`;
    }

    // Check file type
    const isAccepted = acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });

    if (!isAccepted) {
      return `File type ${file.type} is not supported`;
    }

    return null;
  };

  const processFile = async (file: File): Promise<AttachmentFile> => {
    const error = validateFile(file);
    if (error) {
      throw new Error(error);
    }

    const attachment: AttachmentFile = {
      file,
      filename: `${Date.now()}-${file.name}`,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      isUploading: true
    };

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      attachment.preview = await generateImagePreview(file);
    }

    return attachment;
  };

  const generateImagePreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
  };

  const uploadFile = async (attachment: AttachmentFile): Promise<void> => {
    try {
      const result = await uploadAttachmentMutation.mutateAsync(attachment.file);
      
      // Update attachment with upload result
      attachment.path = result.path;
      attachment.filename = result.filename;
      attachment.isUploading = false;
      attachment.uploadError = undefined;
    } catch (error: any) {
      attachment.isUploading = false;
      attachment.uploadError = error.message || 'Upload failed';
      throw error;
    }
  };

  const handleFiles = async (files: FileList) => {
    const newErrors: string[] = [];
    const newAttachments: AttachmentFile[] = [];

    // Check if adding these files would exceed max files
    if (attachments.length + files.length > maxFiles) {
      newErrors.push(`Maximum ${maxFiles} files allowed`);
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const attachment = await processFile(file);
        newAttachments.push(attachment);
      } catch (error) {
        newErrors.push(error instanceof Error ? error.message : 'Unknown error');
      }
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      setTimeout(() => setErrors([]), 5000);
    }

    if (newAttachments.length > 0) {
      const updatedAttachments = [...attachments, ...newAttachments];
      onAttachmentsChange(updatedAttachments);

      // Upload files in parallel
      const uploadPromises = newAttachments.map(async (attachment, index) => {
        try {
          await uploadFile(attachment);
          // Update the attachment in the list
          const attachmentIndex = attachments.length + index;
          const updatedList = [...updatedAttachments];
          updatedList[attachmentIndex] = attachment;
          onAttachmentsChange(updatedList);
        } catch (error) {
          // Error is already set in the attachment
          const attachmentIndex = attachments.length + index;
          const updatedList = [...updatedAttachments];
          updatedList[attachmentIndex] = attachment;
          onAttachmentsChange(updatedList);
        }
      });

      await Promise.all(uploadPromises);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFiles(e.target.files);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    onAttachmentsChange(newAttachments);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (mimeType === 'application/pdf') return <FileText className="w-4 h-4" />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <FileText className="w-4 h-4" />;
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <FileText className="w-4 h-4" />;
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return <Archive className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-red-600">{error}</p>
          ))}
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-4">
          <label htmlFor="file-upload" className="cursor-pointer">
            <span className="mt-2 block text-sm font-medium text-gray-900">
              Drop files here or{' '}
              <span className="text-blue-600 hover:text-blue-500">browse</span>
            </span>
            <span className="mt-1 block text-xs text-gray-500">
              Maximum {maxFiles} files, up to {formatFileSize(maxSize)} each
            </span>
          </label>
          <input
            ref={fileInputRef}
            id="file-upload"
            name="file-upload"
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileInput}
            className="sr-only"
          />
        </div>
      </div>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Attachments ({attachments.length})</h4>
          <div className="space-y-2">
            {attachments.map((attachment, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  attachment.uploadError
                    ? 'border-red-200 bg-red-50'
                    : attachment.isUploading
                    ? 'border-yellow-200 bg-yellow-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {attachment.preview ? (
                    <img
                      src={attachment.preview}
                      alt={attachment.originalName}
                      className="w-8 h-8 object-cover rounded"
                    />
                  ) : (
                    <div className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded">
                      {getFileIcon(attachment.mimeType)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {attachment.originalName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(attachment.size)}
                    </p>
                    {attachment.uploadError && (
                      <p className="text-xs text-red-600">{attachment.uploadError}</p>
                    )}
                    {attachment.isUploading && (
                      <p className="text-xs text-yellow-600">Uploading...</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  disabled={attachment.isUploading}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
