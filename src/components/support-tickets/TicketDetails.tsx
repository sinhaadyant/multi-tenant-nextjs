"use client";

import React, { useState } from 'react';
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
  Shield
} from 'lucide-react';
import { SupportTicket, useAddReply, ReplyData } from '@/hooks/useSupportTickets';
import { useToast } from '@/hooks/useToast';
import { useConfirmModalContext } from '@/components/common/ConfirmModalProvider';
import { AttachmentUploader, AttachmentFile } from './AttachmentUploader';
import Link from 'next/link';

interface TicketDetailsProps {
  ticket: SupportTicket;
  onEditTicket?: (ticket: SupportTicket) => void;
  onDeleteTicket?: (ticketId: string) => void;
  className?: string;
}

export const TicketDetails: React.FC<TicketDetailsProps> = ({
  ticket,
  onEditTicket,
  onDeleteTicket,
  className = ''
}) => {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { success, error } = useToast();
  const { confirm } = useConfirmModalContext();
  const addReplyMutation = useAddReply();
  const queryClient = useQueryClient();

  const [replyText, setReplyText] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<AttachmentFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDeleteTicket = () => {
    confirm({
      title: 'Delete Support Ticket',
      message: `Are you sure you want to delete "${ticket.title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: () => {
        onDeleteTicket?.(ticket.id);
        success('Support ticket has been deleted successfully.');
      }
    });
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyText.trim()) {
      error('Reply text is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const replyData: ReplyData = {
        text: replyText.trim(),
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
      
      // Force refresh the ticket data to update reply count
      queryClient.invalidateQueries({ queryKey: ['tenant-support-ticket', tenantSlug, ticket.id] });
      queryClient.invalidateQueries({ queryKey: ['tenant-support-tickets', tenantSlug] });
    } catch (err: any) {
      error(err.message || 'An error occurred while adding the reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { label: 'Open', className: 'bg-green-100 text-green-800' },
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      closed: { label: 'Closed', className: 'bg-gray-100 text-gray-800' }
    };
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: 'Low', className: 'bg-gray-100 text-gray-800' },
      medium: { label: 'Medium', className: 'bg-blue-100 text-blue-800' },
      high: { label: 'High', className: 'bg-orange-100 text-orange-800' },
      urgent: { label: 'Urgent', className: 'bg-red-100 text-red-800' }
    };
    return priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
  };

  const getCategoryBadge = (category: string) => {
    const categoryConfig = {
      general: { label: 'General', className: 'bg-gray-100 text-gray-800' },
      technical: { label: 'Technical', className: 'bg-blue-100 text-blue-800' },
      billing: { label: 'Billing', className: 'bg-green-100 text-green-800' },
      'feature-request': { label: 'Feature Request', className: 'bg-purple-100 text-purple-800' },
      'bug-report': { label: 'Bug Report', className: 'bg-red-100 text-red-800' }
    };
    return categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.general;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownloadAttachment = (attachment: any) => {
    const link = document.createElement('a');
    link.href = attachment.path;
    link.download = attachment.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`max-w-6xl mx-auto ${className}`}>
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href={`/${tenantSlug}/support-tickets`}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tickets
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
              <div className="flex items-center space-x-4 mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(ticket.status).className}`}>
                  {getStatusBadge(ticket.status).label}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(ticket.priority).className}`}>
                  {getPriorityBadge(ticket.priority).label}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadge(ticket.category).className}`}>
                  {getCategoryBadge(ticket.category).label}
                </span>
                <span className="text-sm text-gray-500">
                  Created {format(new Date(ticket.createdAt), 'MMM dd, yyyy')}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {onEditTicket && (
                <button
                  onClick={() => onEditTicket(ticket)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </button>
              )}
              {onDeleteTicket && (
                <button
                  onClick={handleDeleteTicket}
                  className="inline-flex items-center px-3 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Description */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
            </div>
          </div>

          {/* Attachments */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Paperclip className="w-5 h-5 mr-2" />
                Attachments ({ticket.attachments.length})
              </h3>
              <div className="space-y-2">
                {ticket.attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Paperclip className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{attachment.originalName}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadAttachment(attachment)}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments/Replies */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Comments ({ticket.comments?.length || 0})
            </h3>
            
            {/* Comments List */}
            <div className="space-y-4 mb-6">
              {ticket.comments && ticket.comments.length > 0 ? (
                ticket.comments.map((comment) => (
                  <div key={comment.id} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{comment.commentedBy}</span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(comment.createdAt), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{comment.text}</p>
                    
                    {/* Comment Attachments */}
                    {comment.attachments && comment.attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {comment.attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                            <div className="flex items-center space-x-2">
                              <Paperclip className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-700">{attachment.originalName}</span>
                            </div>
                            <button
                              onClick={() => handleDownloadAttachment(attachment)}
                              className="text-blue-600 hover:text-blue-800 text-xs"
                            >
                              Download
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No comments yet</p>
              )}
            </div>

            {/* Add Reply Form */}
            <div className="border-t pt-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">Add Reply</h4>
              <form onSubmit={handleSubmitReply} className="space-y-4">
                <div>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Type your reply..."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attachments
                  </label>
                  <AttachmentUploader
                    attachments={replyAttachments}
                    onAttachmentsChange={setReplyAttachments}
                    maxFiles={5}
                    maxSize={5 * 1024 * 1024} // 5MB
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting || addReplyMutation.isPending}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting || addReplyMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Reply
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Ticket Information</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Status</span>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(ticket.status).className}`}>
                    {getStatusBadge(ticket.status).label}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Priority</span>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(ticket.priority).className}`}>
                    {getPriorityBadge(ticket.priority).label}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Category</span>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadge(ticket.category).className}`}>
                    {getCategoryBadge(ticket.category).label}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Created</span>
                <p className="mt-1 text-sm text-gray-900">
                  {format(new Date(ticket.createdAt), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Last Updated</span>
                <p className="mt-1 text-sm text-gray-900">
                  {format(new Date(ticket.updatedAt), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            </div>
          </div>

          {/* User Info */}
          {ticket.user && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Created By
              </h3>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">{ticket.user.name}</p>
                <p className="text-sm text-gray-500">{ticket.user.email}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
