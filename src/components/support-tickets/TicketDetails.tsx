"use client";

import React, { useState } from 'react';
import { format } from 'date-fns';
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
  const { success, error } = useToast();
  const { confirm } = useConfirmModalContext();
  const addReplyMutation = useAddReply();

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
        attachments: replyAttachments.map(att => ({
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

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: 'Low', className: 'bg-blue-100 text-blue-800' },
      medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-800' },
      high: { label: 'High', className: 'bg-orange-100 text-orange-800' },
      urgent: { label: 'Urgent', className: 'bg-red-100 text-red-800' }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getCategoryLabel = (category: string) => {
    const categoryLabels: Record<string, string> = {
      'general': 'General',
      'technical': 'Technical',
      'billing': 'Billing',
      'feature-request': 'Feature Request',
      'bug-report': 'Bug Report'
    };
    return categoryLabels[category] || category;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownloadAttachment = (attachment: any) => {
    // In a real app, you would implement file download logic here
    // For now, we'll just show a message
    success(`Downloading ${attachment.originalName}...`);
  };

  const isSubmittingAny = isSubmitting || addReplyMutation.isPending;

  return (
    <div className={`max-w-6xl mx-auto ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link
            href="/support-tickets"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tickets
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
            <p className="text-gray-600">Support Ticket #{ticket.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {onEditTicket && (
            <button
              onClick={() => onEditTicket(ticket)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </button>
          )}
          {onDeleteTicket && (
            <button
              onClick={handleDeleteTicket}
              className="inline-flex items-center px-3 py-2 border border-red-300 rounded-lg text-red-700 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Ticket Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Status</p>
            {getStatusBadge(ticket.status)}
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Priority</p>
            {getPriorityBadge(ticket.priority)}
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Category</p>
            <p className="text-sm font-medium text-gray-900">{getCategoryLabel(ticket.category)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Created</p>
            <p className="text-sm font-medium text-gray-900">
              {format(new Date(ticket.createdAt), 'MMM dd, yyyy HH:mm')}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm text-gray-500 mb-2">Description</p>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-900 whitespace-pre-wrap">{ticket.description}</p>
          </div>
        </div>

        {/* Original Attachments */}
        {ticket?.attachments?.length || 0 > 0 && (
          <div className="mt-6">
            <p className="text-sm text-gray-500 mb-2">Attachments</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {ticket.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Paperclip className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {attachment.originalName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(attachment.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadAttachment(attachment)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Comments Thread */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Replies ({ticket?.comments?.length || 0})
        </h3>
        
        {ticket?.comments?.length || 0 === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No replies yet. Be the first to respond!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {ticket.comments.map((comment) => (
              <div key={comment.id} className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {comment.commenterType === 'admin' ? (
                      <Shield className="w-4 h-4 text-blue-600" />
                    ) : (
                      <User className="w-4 h-4 text-gray-600" />
                    )}
                    <span className="text-sm font-medium text-gray-900">
                      {comment.commenterType === 'admin' ? 'Support Team' : 'You'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(comment.createdAt), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-3">
                  <p className="text-gray-900 whitespace-pre-wrap">{comment.text}</p>
                </div>

                {/* Comment Attachments */}
                {comment?.attachments?.length || 0 > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {comment.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                      >
                        <div className="flex items-center space-x-2">
                          <Paperclip className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-900 truncate">
                            {attachment.originalName}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDownloadAttachment(attachment)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reply Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add Reply</h3>
        
        <form onSubmit={handleSubmitReply} className="space-y-4">
          <div>
            <label htmlFor="reply" className="block text-sm font-medium text-gray-700 mb-2">
              Your Reply *
            </label>
            <textarea
              id="reply"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Type your reply here..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachments (Optional)
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
              disabled={isSubmittingAny || !replyText.trim()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmittingAny ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
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
  );
};
