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
  Quote
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

interface EnhancedTicketDetailsProps {
  ticket: SupportTicket;
  onEditTicket?: (ticket: SupportTicket) => void;
  onDeleteTicket?: (ticketId: string) => void;
  className?: string;
}

export const EnhancedTicketDetails: React.FC<EnhancedTicketDetailsProps> = ({
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
      let replyContent = replyText.trim();
      
      // Add quote if there's a quoted comment
      if (quotedComment) {
        replyContent = `> **${quotedComment.commenterType === 'admin' ? 'Admin' : 'User'} replied on ${format(new Date(quotedComment.createdAt), 'MMM dd, yyyy HH:mm')}:**\n> ${quotedComment.text}\n\n${replyContent}`;
      }

      const replyData: ReplyData = {
        text: replyContent,
        attachments: replyAttachments
          .filter(att => !att.isUploading && !att.uploadError)
          .map(att => ({
            filename: att.filename,
            originalName: att.originalName,
            mimeType: att.mimeType,
            size: att.size,
            path: att.path || ''
          }))
      };

      await addReplyMutation.mutateAsync({ id: ticket.id, data: replyData });
      success('Reply added successfully!');
      setReplyText('');
      setReplyAttachments([]);
      setQuotedComment(null);
      setShowReplyForm(false);
      
      // Force refresh the ticket data
      queryClient.invalidateQueries({ queryKey: ['tenant-support-ticket', tenantSlug, ticket.id] });
      queryClient.invalidateQueries({ queryKey: ['tenant-support-tickets', tenantSlug] });
    } catch (err: any) {
      error(err.message || 'An error occurred while adding the reply');
    } finally {
      setIsSubmitting(false);
    }
  }, [replyText, canReply, quotedComment, replyAttachments, addReplyMutation, success, error, queryClient, tenantSlug, ticket.id]);

  const handleQuoteComment = useCallback((comment: SupportTicketComment) => {
    setQuotedComment(comment);
    setShowReplyForm(true);
    // Focus on reply textarea
    setTimeout(() => {
      const textarea = document.getElementById('reply-textarea');
      if (textarea) {
        textarea.focus();
      }
    }, 100);
  }, []);

  const handleCopyTicketId = useCallback(() => {
    navigator.clipboard.writeText(ticket.id);
    success('Ticket ID copied to clipboard');
  }, [ticket.id, success]);

  const getStatusBadge = useCallback((status: string) => {
    const statusConfig = {
      open: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: AlertCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', icon: Clock },
      closed: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: CheckCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  }, []);

  const getPriorityBadge = useCallback((priority: string) => {
    const priorityConfig = {
      low: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
      medium: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
      high: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
      urgent: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;

    return (
      <Badge className={config.color}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  }, []);

  const getCategoryBadge = useCallback((category: string) => {
    const categoryConfig = {
      general: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
      technical: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
      billing: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
      'feature-request': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
      'bug-report': { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' }
    };

    const config = categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.general;

    return (
      <Badge className={config.color}>
        {category.replace('-', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
      </Badge>
    );
  }, []);

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

  const handleDownloadAttachment = useCallback((attachment: any) => {
    // Create a temporary link to download the file
    const link = document.createElement('a');
    link.href = `/api/tenant/${tenantSlug}/support/attachments/${attachment.id}/download`;
    link.download = attachment.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [tenantSlug]);

  const sortedComments = useMemo(() => {
    return [...ticket.comments].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [ticket.comments]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${tenantSlug}/support-tickets`}>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Tickets
            </Button>
          </Link>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {ticket.title}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                #{ticket.id.slice(-8)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyTicketId}
                className="h-6 w-6 p-0"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {canUpdate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditTicket?.(ticket)}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Button>
          )}
          
          {canDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteTicket}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Ticket Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Ticket Information</CardTitle>
                <div className="flex items-center gap-2">
                  {getStatusBadge(ticket.status)}
                  {getPriorityBadge(ticket.priority)}
                  {getCategoryBadge(ticket.category)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                  {ticket.description}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Paperclip className="w-5 h-5" />
                  Attachments ({ticket.attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ticket.attachments.map((attachment) => {
                    const FileIcon = getFileIcon(attachment.mimeType);
                    return (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex-shrink-0">
                          <FileIcon className="w-8 h-8 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {attachment.originalName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(attachment.size)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownloadAttachment(attachment)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Download</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments/Replies */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Replies ({ticket.comments.length})
                </CardTitle>
                {canReply && (
                  <Button
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="flex items-center gap-2"
                  >
                    <Reply className="w-4 h-4" />
                    {showReplyForm ? 'Cancel Reply' : 'Add Reply'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Reply Form */}
              {showReplyForm && (
                <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                  {quotedComment && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          Quoting {quotedComment.commenterType === 'admin' ? 'Admin' : 'User'}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setQuotedComment(null)}
                          className="h-6 w-6 p-0"
                        >
                          <XCircle className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {quotedComment.text}
                      </p>
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmitReply} className="space-y-4">
                    <Textarea
                      id="reply-textarea"
                      placeholder="Type your reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                    
                    <EnhancedAttachmentUploader
                      attachments={replyAttachments}
                      onAttachmentsChange={setReplyAttachments}
                      maxFiles={5}
                      maxFileSize={10 * 1024 * 1024} // 10MB
                    />
                    
                    <div className="flex items-center gap-2">
                      <Button
                        type="submit"
                        disabled={isSubmitting || !replyText.trim()}
                        className="flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        {isSubmitting ? 'Sending...' : 'Send Reply'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowReplyForm(false);
                          setReplyText('');
                          setReplyAttachments([]);
                          setQuotedComment(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {sortedComments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No replies yet. Be the first to respond!</p>
                  </div>
                ) : (
                  sortedComments.map((comment) => (
                    <div
                      key={comment.id}
                      className="flex gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="" />
                        <AvatarFallback>
                          {comment.commenterType === 'admin' ? (
                            <Shield className="w-5 h-5" />
                          ) : (
                            <User className="w-5 h-5" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {comment.commenterType === 'admin' ? 'Admin' : 'User'}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {comment.commenterType === 'admin' ? 'Staff' : 'Customer'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {format(new Date(comment.createdAt), 'MMM dd, yyyy HH:mm')}
                            </span>
                            {canReply && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreHorizontal className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleQuoteComment(comment)}>
                                    <Quote className="w-4 h-4 mr-2" />
                                    Quote Reply
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                        
                        <div className="prose dark:prose-invert max-w-none">
                          <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                            {comment.text}
                          </div>
                        </div>
                        
                        {/* Comment Attachments */}
                        {comment.attachments && comment.attachments.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 mb-2">
                              <Paperclip className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Attachments ({comment.attachments.length})
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {comment.attachments.map((attachment) => {
                                const FileIcon = getFileIcon(attachment.mimeType);
                                return (
                                  <div
                                    key={attachment.id}
                                    className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded text-sm"
                                  >
                                    <FileIcon className="w-4 h-4 text-gray-500" />
                                    <span className="flex-1 truncate text-gray-700 dark:text-gray-300">
                                      {attachment.originalName}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDownloadAttachment(attachment)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Download className="w-3 h-3" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Meta */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</label>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {format(new Date(ticket.createdAt), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</label>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {format(new Date(ticket.updatedAt), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              
              {ticket.user && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created By</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-xs">
                        {ticket.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {ticket.user.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {ticket.user.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {ticket.tenant && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Tenant</label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {ticket.tenant.name}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {canReply && (
                <Button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Reply className="w-4 h-4 mr-2" />
                  {showReplyForm ? 'Cancel Reply' : 'Add Reply'}
                </Button>
              )}
              
              {canUpdate && (
                <Button
                  onClick={() => onEditTicket?.(ticket)}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Ticket
                </Button>
              )}
              
              <Button
                onClick={handleCopyTicketId}
                className="w-full justify-start"
                variant="outline"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Ticket ID
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
