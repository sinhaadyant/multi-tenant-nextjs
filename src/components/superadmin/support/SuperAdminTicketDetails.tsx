"use client";

import React, { useState } from 'react';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
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
  Building2
} from 'lucide-react';
import { SupportTicket, useAddSuperadminReply, useUpdateSuperadminSupportTicket, ReplyData, UpdateTicketData } from '@/hooks/useSuperadminSupportTickets';
import { useToast } from '@/hooks/useToast';
import { useConfirmModalContext } from '@/components/common/ConfirmModalProvider';
import { SuperAdminAttachmentUploader, AttachmentFile } from './SuperAdminAttachmentUploader';
import Link from 'next/link';

interface SuperAdminTicketDetailsProps {
  ticket: SupportTicket;
  onEditTicket?: (ticket: SupportTicket) => void;
  onDeleteTicket?: (ticketId: string) => void;
  className?: string;
}

export const SuperAdminTicketDetails: React.FC<SuperAdminTicketDetailsProps> = ({
  ticket,
  onEditTicket,
  onDeleteTicket,
  className = ''
}) => {
  const router = useRouter();
  const { success, error } = useToast();
  const { confirm } = useConfirmModalContext();
  
  const addReplyMutation = useAddSuperadminReply();
  const updateTicketMutation = useUpdateSuperadminSupportTicket();
  const queryClient = useQueryClient();

  const [replyText, setReplyText] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<AttachmentFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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

  const handleStatusUpdate = async (newStatus: 'open' | 'pending' | 'closed') => {
    if (newStatus === ticket.status) return;
    
    setIsUpdatingStatus(true);
    try {
      const updateData: UpdateTicketData = {
        status: newStatus
      };
      
      await updateTicketMutation.mutateAsync({ id: ticket.id, data: updateData });
      success(`Ticket status updated to ${newStatus} successfully!`);
      
      // Force refresh the ticket data
      await queryClient.invalidateQueries({ queryKey: ['superadmin-support-ticket', ticket.id] });
      await queryClient.invalidateQueries({ queryKey: ['superadmin-support-tickets'] });
    } catch (err: any) {
      error(err.message || 'Failed to update ticket status');
    } finally {
      setIsUpdatingStatus(false);
    }
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
      
      // Force refresh the ticket data to update reply count and show new reply
      await queryClient.invalidateQueries({ queryKey: ['superadmin-support-ticket', ticket.id] });
      await queryClient.invalidateQueries({ queryKey: ['superadmin-support-tickets'] });
      
      // Also refetch the current query to immediately show updates
      await queryClient.refetchQueries({ queryKey: ['superadmin-support-ticket', ticket.id] });
    } catch (err: any) {
      error(err.message || 'Failed to add reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const handleDownloadAttachment = (attachment: any) => {
    const link = document.createElement('a');
    link.href = attachment.path;
    link.download = attachment.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Debug logging for ticket data
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎫 SuperAdminTicketDetails - Ticket data updated:', {
        id: ticket.id,
        title: ticket.title,
        attachmentsCount: ticket.attachments?.length || 0,
        commentsCount: ticket.comments?.length || 0,
        _count: ticket._count,
        hasAttachments: !!ticket.attachments,
        hasComments: !!ticket.comments,
        attachmentsArray: ticket.attachments,
        commentsArray: ticket.comments
      });
    }
  }, [ticket]);

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/superadmin/support-tickets"
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {ticket.title}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <div className="relative">
                  <select
                    value={ticket.status}
                    onChange={(e) => handleStatusUpdate(e.target.value as 'open' | 'pending' | 'closed')}
                    disabled={isUpdatingStatus}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border-0 cursor-pointer ${getStatusColor(ticket.status)} ${isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
                  >
                    <option value="open">Open</option>
                    <option value="pending">Pending</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  #{ticket.id.slice(-8)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEditTicket?.(ticket)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </button>
            <button
              onClick={handleDeleteTicket}
              className="inline-flex items-center px-3 py-2 border border-red-300 dark:border-red-600 rounded-lg text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
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
              {ticket.createdBySuperAdmin && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created By</label>
                  <div className="mt-1 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{ticket.createdBySuperAdmin.name}</span>
                    <span className="text-gray-500 dark:text-gray-400">({ticket.createdBySuperAdmin.email})</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">SuperAdmin</span>
                  </div>
                </div>
              )}
              {ticket.user && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Assigned User</label>
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
                  <Paperclip className="w-4 h-4 text-gray-400" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {attachment.originalName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(attachment.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadAttachment(attachment)}
                  className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  title="Download attachment"
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
              <div key={comment.id} className={`flex ${comment.commenterType === 'superadmin' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] ${comment.commenterType === 'superadmin' ? 'order-2' : 'order-1'}`}>
                  {/* Message Bubble */}
                  <div className={`rounded-lg p-4 ${
                    comment.commenterType === 'superadmin' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}>
                    <p className="whitespace-pre-wrap mb-2">{comment.text}</p>
                    
                    {/* Attachments */}
                    {comment.attachments && comment.attachments.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <p className={`text-xs mb-2 ${
                          comment.commenterType === 'superadmin' 
                            ? 'text-blue-100' 
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          Attachments:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {comment.attachments.map((attachment) => (
                            <button
                              key={attachment.id}
                              onClick={() => handleDownloadAttachment(attachment)}
                              className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${
                                comment.commenterType === 'superadmin'
                                  ? 'bg-blue-500 text-white hover:bg-blue-400'
                                  : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
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
                    comment.commenterType === 'superadmin' ? 'justify-end' : 'justify-start'
                  }`}>
                    <div className="flex items-center gap-1">
                      {comment.commenterType === 'superadmin' ? (
                        <>
                          <Shield className="w-3 h-3" />
                          <span>SuperAdmin</span>
                        </>
                      ) : (
                        <>
                          <User className="w-3 h-3" />
                          <span>User</span>
                        </>
                      )}
                    </div>
                    <span>•</span>
                    <span>{format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                </div>
                
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  comment.commenterType === 'superadmin' ? 'order-1 ml-3' : 'order-2 mr-3'
                }`}>
                  {comment.commenterType === 'superadmin' ? (
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
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
            <textarea
              id="reply-text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Type your reply here..."
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Attachments
            </label>
            <SuperAdminAttachmentUploader
              attachments={replyAttachments}
              onAttachmentsChange={setReplyAttachments}
              maxFiles={5}
              maxFileSize={10 * 1024 * 1024} // 10MB
            />
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || addReplyMutation.isPending}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting || addReplyMutation.isPending ? 'Sending...' : 'Send Reply'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
