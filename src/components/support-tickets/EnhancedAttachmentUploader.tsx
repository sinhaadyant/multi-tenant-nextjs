"use client";

import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  X, 
  File, 
  Image, 
  Video, 
  FileText, 
  Archive, 
  AlertCircle,
  CheckCircle,
  Loader2,
  Paperclip,
  Trash2,
  Eye
} from 'lucide-react';
import { useUploadAttachment } from '@/hooks/useSupportTickets';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';

export interface AttachmentFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path?: string;
  isUploading: boolean;
  uploadProgress: number;
  uploadError?: string;
  preview?: string;
}

interface EnhancedAttachmentUploaderProps {
  attachments: AttachmentFile[];
  onAttachmentsChange: (attachments: AttachmentFile[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  acceptedFileTypes?: string[];
  className?: string;
}

export const EnhancedAttachmentUploader: React.FC<EnhancedAttachmentUploaderProps> = ({
  attachments,
  onAttachmentsChange,
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  acceptedFileTypes = [
    'image/*',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed'
  ],
  className = ''
}) => {
  const { error: showError } = useToast();
  const uploadMutation = useUploadAttachment();
  const [isDragActive, setIsDragActive] = useState(false);

  const getFileIcon = useCallback((mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.startsWith('video/')) return Video;
    if (mimeType.includes('pdf')) return FileText;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return Archive;
    return File;
  }, []);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return `File size must be less than ${formatFileSize(maxFileSize)}`;
    }

    // Check if we've reached max files
    if (attachments.length >= maxFiles) {
      return `Maximum ${maxFiles} files allowed`;
    }

    // Check file type
    const isAccepted = acceptedFileTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });

    if (!isAccepted) {
      return 'File type not supported';
    }

    return null;
  }, [attachments.length, maxFiles, maxFileSize, acceptedFileTypes, formatFileSize]);

  const uploadFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      showError(validationError);
      return;
    }

    const fileId = Math.random().toString(36).substr(2, 9);
    const newAttachment: AttachmentFile = {
      id: fileId,
      filename: file.name,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      isUploading: true,
      uploadProgress: 0,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    };

    // Add to attachments list
    onAttachmentsChange([...attachments, newAttachment]);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        onAttachmentsChange(prev => 
          prev.map(att => 
            att.id === fileId 
              ? { ...att, uploadProgress: Math.min(att.uploadProgress + 10, 90) }
              : att
          )
        );
      }, 200);

      // Upload file
      const result = await uploadMutation.mutateAsync(file);
      
      clearInterval(progressInterval);

      // Update attachment with upload result
      onAttachmentsChange(prev => 
        prev.map(att => 
          att.id === fileId 
            ? { 
                ...att, 
                filename: result.filename,
                path: result.path,
                isUploading: false,
                uploadProgress: 100,
                uploadError: undefined
              }
            : att
        )
      );

    } catch (err: any) {
      // Update attachment with error
      onAttachmentsChange(prev => 
        prev.map(att => 
          att.id === fileId 
            ? { 
                ...att, 
                isUploading: false,
                uploadError: err.message || 'Upload failed'
              }
            : att
        )
      );
      showError(`Failed to upload ${file.name}: ${err.message}`);
    }
  }, [attachments, onAttachmentsChange, validateFile, uploadMutation, showError]);

  const removeAttachment = useCallback((fileId: string) => {
    onAttachmentsChange(attachments.filter(att => att.id !== fileId));
  }, [attachments, onAttachmentsChange]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(uploadFile);
  }, [uploadFile]);

  const { getRootProps, getInputProps, isDragActive: dropzoneDragActive } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxFiles: maxFiles - attachments.length,
    maxSize: maxFileSize,
    disabled: attachments.length >= maxFiles
  });

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(uploadFile);
    }
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  }, [uploadFile]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive || dropzoneDragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${attachments.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <input
          type="file"
          multiple
          accept={acceptedFileTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          id="file-input"
          disabled={attachments.length >= maxFiles}
        />
        
        <div className="space-y-2">
          <Upload className={`w-8 h-8 mx-auto ${isDragActive || dropzoneDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {isDragActive || dropzoneDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              or{' '}
              <label
                htmlFor="file-input"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer"
              >
                browse files
              </label>
            </p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Max {maxFiles} files, up to {formatFileSize(maxFileSize)} each
          </p>
        </div>
      </div>

      {/* File List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Attachments ({attachments.length}/{maxFiles})
            </h4>
            {attachments.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAttachmentsChange([])}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            {attachments.map((attachment) => {
              const FileIcon = getFileIcon(attachment.mimeType);
              
              return (
                <Card key={attachment.id} className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      {/* File Icon/Preview */}
                      <div className="flex-shrink-0">
                        {attachment.preview && attachment.mimeType.startsWith('image/') ? (
                          <div className="relative">
                            <img
                              src={attachment.preview}
                              alt={attachment.originalName}
                              className="w-12 h-12 object-cover rounded border"
                            />
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute -top-1 -right-1 h-6 w-6 p-0 bg-white dark:bg-gray-800 border rounded-full"
                                    onClick={() => window.open(attachment.preview, '_blank')}
                                  >
                                    <Eye className="w-3 h-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Preview</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        ) : (
                          <FileIcon className="w-12 h-12 text-gray-400" />
                        )}
                      </div>
                      
                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {attachment.originalName}
                          </p>
                          {attachment.isUploading && (
                            <Badge variant="outline" className="text-xs">
                              Uploading...
                            </Badge>
                          )}
                          {attachment.uploadError && (
                            <Badge variant="destructive" className="text-xs">
                              Error
                            </Badge>
                          )}
                          {!attachment.isUploading && !attachment.uploadError && (
                            <Badge variant="outline" className="text-xs text-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Uploaded
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(attachment.size)}
                        </p>
                        
                        {attachment.uploadError && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            {attachment.uploadError}
                          </p>
                        )}
                        
                        {/* Upload Progress */}
                        {attachment.isUploading && (
                          <div className="mt-2">
                            <Progress value={attachment.uploadProgress} className="h-1" />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {attachment.uploadProgress}% complete
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {attachment.isUploading && (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(attachment.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
