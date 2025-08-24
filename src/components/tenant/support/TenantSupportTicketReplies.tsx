"use client";

import React, { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { 
  Send, 
  Paperclip, 
  X, 
  Download, 
  FileText, 
  Image, 
  File,
  User,
  MessageSquare
} from 'lucide-react';
import { useTenantSupportTicketComments, useCreateTenantSupportTicketComment } from '@/hooks/useTenantSupportTickets';
import { useToast } from '@/hooks/useToast';
import { useReduxAuth } from '@/hooks/useReduxAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/button/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';

interface TenantSupportTicketRepliesProps {
  ticketId: string;
  tenantSlug: string;
  className?: string;
}

interface AttachmentFile {
  file: File;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export const TenantSupportTicketReplies: React.FC<TenantSupportTicketRepliesProps> = ({
  ticketId,
  tenantSlug,
  className = ''
}) => {
  const { success, error } = useToast();
  const { user, hasPermission } = useReduxAuth();
  const { hasPermission: checkPermission } = usePermissions();
  
  const createCommentMutation = useCreateTenantSupportTicketComment();

  const [comment, setComment] = useState('');
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check permissions
  const canReply = hasPermission('support', 'update') || checkPermission('support', 'update');

  // Fetch comments
  const { data: commentsData, isLoading: commentsLoading, refetch } = useTenantSupportTicketComments(tenantSlug, ticketId);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newAttachments: AttachmentFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file size (5MB max for comments)
      if (file.size > 5 * 1024 * 1024) {
        error(`File ${file.name} is too large. Maximum size is 5MB.`);
        continue;
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain', 'text/csv', 'application/json'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        error(`File type ${file.type} is not allowed.`);
        continue;
      }

      const attachment: AttachmentFile = {
        file,
        filename: file.name,
        originalName: file.name,
        mimeType: file.type,
        size: file.size
      };

      newAttachments.push(attachment);
    }

    setAttachments(prev => [...prev, ...newAttachments]);
  }, [error]);

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    } else if (mimeType.includes('pdf') || mimeType.includes('document')) {
      return <FileText className="w-4 h-4" />;
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

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      error('Please enter a comment');
      return;
    }

    if (!canReply) {
      error('You do not have permission to reply to this ticket');
      return;
    }

    setIsSubmitting(true);

    try {
      await createCommentMutation.mutateAsync({
        ticketId,
        content: comment,
        attachments: attachments.map(att => ({
          filename: att.filename,
          originalName: att.originalName,
          mimeType: att.mimeType,
          size: att.size,
          path: ''
        }))
      });

      success('Reply added successfully!');
      setComment('');
      setAttachments([]);
      refetch();
    } catch (err: any) {
      error(err.message || 'Failed to add reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadAttachment = (attachment: any) => {
    // TODO: Implement file download
    console.log('Download attachment:', attachment);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Replies & Comments
          {commentsData?.comments && (
            <Badge variant="outline">{commentsData.comments.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comments List */}
        <div className="space-y-4">
          {commentsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading comments...</p>
              </div>
            </div>
          ) : commentsData?.comments && commentsData.comments.length > 0 ? (
            commentsData.comments.map((comment) => (
              <div key={comment.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {comment.author.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(comment.createdAt), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  {comment.content}
                </div>

                {/* Attachments */}
                {comment.attachments && comment.attachments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Attachments:</p>
                    <div className="flex flex-wrap gap-2">
                      {comment.attachments.map((attachment, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md"
                        >
                          {getFileIcon(attachment.mimeType)}
                          <span className="text-xs text-gray-600 dark:text-gray-300">
                            {attachment.originalName}
                          </span>
                          <Button
                            onClick={() => downloadAttachment(attachment)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No replies yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Be the first to add a reply</p>
            </div>
          )}
        </div>

        {/* Reply Form */}
        {canReply && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <form onSubmit={handleSubmitReply} className="space-y-4">
              <div>
                <label htmlFor="reply" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Add Reply
                </label>
                <Textarea
                  id="reply"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Type your reply here..."
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* File Attachments */}
              <div>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    accept="image/*,.pdf,.doc,.docx,.txt,.csv,.json"
                    className="hidden"
                    id="reply-file-upload"
                  />
                  <label
                    htmlFor="reply-file-upload"
                    className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                  >
                    <Paperclip className="w-4 h-4" />
                    Attach Files
                  </label>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Max 5MB per file
                  </span>
                </div>

                {/* Attachments List */}
                {attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          {getFileIcon(attachment.mimeType)}
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {attachment.originalName}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({formatFileSize(attachment.size)})
                          </span>
                        </div>
                        <Button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting || !comment.trim()}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Reply
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

        {!canReply && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You don't have permission to reply to this ticket
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TenantSupportTicketReplies;
