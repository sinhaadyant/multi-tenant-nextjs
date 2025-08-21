"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  MessageSquare, 
  Paperclip, 
  Download,
  Send,
  User,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Copy,
  Eye,
  FileText,
  Image,
  File,
  Video,
  Archive,
  MoreHorizontal,
  Reply,
  Quote,
  Building2
} from 'lucide-react';
import { SupportTicket, useAddReply, ReplyData, SupportTicketComment } from '@/hooks/useSupportTickets';
import { useToast } from '@/hooks/useToast';
import { useConfirmModalContext } from '@/components/common/ConfirmModalProvider';
import { usePermissions } from '@/hooks/usePermissions';
import { EnhancedAttachmentUploader, AttachmentFile } from './EnhancedAttachmentUploader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/button/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import Link from 'next/link';

interface TenantTicketDetailsProps {
  ticket: SupportTicket;
  onEditTicket?: (ticket: SupportTicket) => void;
  onDeleteTicket?: (ticketId: string) => void;
  className?: string;
}

export const TenantTicketDetails: React.FC<TenantTicketDetailsProps> = ({
  ticket,
  onEditTicket,
  onDeleteTicket,
  className = ''
}) => {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { success, error } = useToast();
  const { confirm } = useConfirmModalContext();
  const { hasPermission } = usePermissions();
  const addReplyMutation = useAddReply();
  const queryClient = useQueryClient();

  const [replyText, setReplyText] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<AttachmentFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [quotedComment, setQuotedComment] = useState<SupportTicketComment | null>(null);

  // Check permissions
  const canUpdate = hasPermission('support', 'update');
  const canDelete = hasPermission('support', 'delete');
  const canReply = hasPermission('support', 'update'); // Using update permission for replies

  const handleDeleteTicket = useCallback(() => {
    if (!canDelete) {
      error('You do not have permission to delete support tickets');
      return;
    }

    confirm({
      title: 'Delete Support Ticket',
      message: `Are you sure you want to delete "${ticket.title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
      onConfirm: () => {
        onDeleteTicket?.(ticket.id);
        success('Support ticket has been deleted successfully.');
      }
    });
  }, [canDelete, confirm, error, onDeleteTicket, success, ticket.id, ticket.title]);

  const handleSubmitReply = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyText.trim()) {
      error('Reply text is required');
      return;
    }

    if (!canReply) {
      error('You do not have permission to reply to support tickets');
      return;
    }

    setIsSubmitting(true);
    try {
      const replyData: ReplyData = {
        text: replyText.trim(),
        attachments: replyAttachments.map(att => ({
          filename: att.filename,
          originalName: att.originalName,
          mimeType: att.mimeType,
          size: att.size,
          path: att.path,
        }))
      };

      await addReplyMutation.mutateAsync({ id: ticket.id, data: replyData });
      
      // Clear form
      setReplyText('');
      setReplyAttachments([]);
      setQuotedComment(null);
      setShowReplyForm(false);
      
      success('Reply added successfully!');
      
      // Force refresh the ticket data to update reply count and show new reply
      await queryClient.invalidateQueries({ queryKey: ['tenant-support-tickets', tenantSlug] });
      await queryClient.invalidateQueries({ queryKey: ['tenant-support-ticket', ticket.id] });
      
      // Also refetch the current query to immediately show updates
      await queryClient.refetchQueries({ queryKey: ['tenant-support-ticket', ticket.id] });
      
    } catch (err: any) {
      error(err.message || 'Failed to add reply');
    } finally {
      setIsSubmitting(false);
    }
  }, [replyText, replyAttachments, canReply, addReplyMutation, ticket.id, success, error, queryClient, tenantSlug]);

  const handleDownloadAttachment = useCallback((attachment: any) => {
    try {
      const link = document.createElement('a');
      link.href = attachment.path;
      link.download = attachment.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      error('Failed to download attachment');
    }
  }, [error]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  }, []);

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  }, []);

  const getFileIcon = useCallback((mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (mimeType.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (mimeType.includes('pdf')) return <FileText className="w-4 h-4" />;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/${tenantSlug}/support-tickets`}
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tickets
          </Link>
        </div>
        
        <div className="flex items-center gap-2">
          {canUpdate && onEditTicket && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditTicket(ticket)}
              className="inline-flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Button>
          )}
          
          {canDelete && onDeleteTicket && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteTicket}
              className="inline-flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Ticket Information */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ticket Details</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
                <p className="mt-1 text-gray-900 dark:text-white whitespace-pre-wrap">
                  {ticket.description}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</label>
                <p className="mt-1 text-gray-900 dark:text-white capitalize">
                  {ticket.category.replace('-', ' ')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</label>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {format(new Date(ticket.createdAt), 'PPP p')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</label>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {format(new Date(ticket.updatedAt), 'PPP p')}
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Information</h3>
            <div className="space-y-3">
              {ticket.tenant && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Tenant</label>
                  <div className="mt-1 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{ticket.tenant.name}</span>
                  </div>
                </div>
              )}
              {ticket.user && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created By</label>
                  <div className="mt-1 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{ticket.user.name}</span>
                    <span className="text-gray-500 dark:text-gray-400">({ticket.user.email})</span>
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Replies</label>
                <div className="mt-1 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">{ticket._count?.comments || 0} replies</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Attachments</label>
                <div className="mt-1 flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">{ticket._count?.attachments || 0} files</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attachments */}
      {ticket.attachments && ticket.attachments.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Attachments</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ticket.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getFileIcon(attachment.mimeType)}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {attachment.originalName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(attachment.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadAttachment(attachment)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat-like Replies */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Conversation</h3>
        
        {ticket.comments && ticket.comments.length > 0 ? (
          <div className="space-y-6">
            {ticket.comments.map((comment) => (
              <div key={comment.id} className={`flex ${comment.commenterType === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[70%] ${comment.commenterType === 'user' ? 'order-1' : 'order-2'}`}>
                  {/* Message Bubble */}
                  <div className={`rounded-lg p-4 ${
                    comment.commenterType === 'user' 
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                      : 'bg-blue-600 text-white'
                  }`}>
                    <p className="whitespace-pre-wrap mb-2">{comment.text}</p>
                    
                    {/* Attachments */}
                    {comment.attachments && comment.attachments.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <p className={`text-xs mb-2 ${
                          comment.commenterType === 'user' 
                            ? 'text-gray-600 dark:text-gray-400' 
                            : 'text-blue-100'
                        }`}>
                          Attachments:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {comment.attachments.map((attachment) => (
                            <button
                              key={attachment.id}
                              onClick={() => handleDownloadAttachment(attachment)}
                              className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${
                                comment.commenterType === 'user'
                                  ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                                  : 'bg-blue-500 text-white hover:bg-blue-400'
                              } transition-colors`}
                            >
                              <Paperclip className="w-3 h-3" />
                              <span className="truncate max-w-24">{attachment.originalName}</span>
                              <Download className="w-3 h-3" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Message Info */}
                  <div className={`mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 ${
                    comment.commenterType === 'user' ? 'justify-start' : 'justify-end'
                  }`}>
                    <div className="flex items-center gap-1">
                      {comment.commenterType === 'user' ? (
                        <>
                          <User className="w-3 h-3" />
                          <span>User</span>
                        </>
                      ) : comment.commenterType === 'admin' ? (
                        <>
                          <Shield className="w-3 h-3" />
                          <span>Admin</span>
                        </>
                      ) : (
                        <>
                          <Shield className="w-3 h-3" />
                          <span>SuperAdmin</span>
                        </>
                      )}
                    </div>
                    <span>•</span>
                    <span>{format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                </div>
                
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  comment.commenterType === 'user' ? 'order-2 mr-3' : 'order-1 ml-3'
                }`}>
                  {comment.commenterType === 'user' ? (
                    <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-2">No conversation yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Be the first to start the conversation!</p>
          </div>
        )}
      </div>

      {/* Add Reply */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Reply</h3>
        
        <form onSubmit={handleSubmitReply} className="space-y-4">
          <div>
            <label htmlFor="reply-text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reply Message *
            </label>
            <Textarea
              id="reply-text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={4}
              className="w-full"
              placeholder="Type your reply here..."
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Attachments
            </label>
            <EnhancedAttachmentUploader
              attachments={replyAttachments}
              onAttachmentsChange={setReplyAttachments}
              maxFiles={5}
              maxFileSize={10 * 1024 * 1024} // 10MB
            />
          </div>
          
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || addReplyMutation.isPending}
              className="inline-flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isSubmitting || addReplyMutation.isPending ? 'Sending...' : 'Send Reply'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
