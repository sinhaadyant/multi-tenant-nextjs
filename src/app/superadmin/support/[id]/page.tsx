"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquare, Forward, Download, Edit, Trash2 } from 'lucide-react';
import { useSupportTicket, useUpdateSupportTicket, useAddComment, useForwardTicket } from '@/hooks/useSupportTickets';
import Badge from '@/components/ui/badge/Badge';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { toast } from 'react-hot-toast';

interface TicketDetailPageProps {
  params: { id: string };
}

export default function TicketDetailPage({ params }: TicketDetailPageProps) {
  const router = useRouter();
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);

  const { data, isLoading, error } = useSupportTicket(params.id);
  const updateMutation = useUpdateSupportTicket();
  const addCommentMutation = useAddComment();
  const forwardMutation = useForwardTicket();

  const ticket = data?.ticket;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'billing':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      case 'general':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateMutation.mutateAsync({
        id: params.id,
        data: { status: newStatus },
      });
      toast.success('Ticket status updated successfully');
    } catch (error) {
      toast.error('Failed to update ticket status');
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    try {
      await updateMutation.mutateAsync({
        id: params.id,
        data: { priority: newPriority },
      });
      toast.success('Ticket priority updated successfully');
    } catch (error) {
      toast.error('Failed to update ticket priority');
    }
  };

  const handleForward = async () => {
    try {
      await forwardMutation.mutateAsync(params.id);
      toast.success('Ticket forwarded successfully');
    } catch (error) {
      toast.error('Failed to forward ticket');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setIsAddingComment(true);
    try {
      await addCommentMutation.mutateAsync({
        ticketId: params.id,
        text: newComment.trim(),
      });
      setNewComment('');
      toast.success('Comment added successfully');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsAddingComment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Failed to load ticket details</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {ticket.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Ticket #{ticket.id.slice(-8)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!ticket.isForwarded && (
            <button
              onClick={handleForward}
              disabled={forwardMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <Forward className="h-4 w-4" />
              Forward to SuperAdmin
            </button>
          )}
        </div>
      </div>

      {/* Ticket Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Description
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Status
              </h3>
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={ticket.status === 'closed'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Priority
              </h3>
              <select
                value={ticket.priority}
                onChange={(e) => handlePriorityChange(e.target.value)}
                disabled={ticket.status === 'closed'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Current Badges */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Details
              </h3>
              <div className="space-y-2">
                <Badge className={getCategoryColor(ticket.category)}>
                  {ticket.category}
                </Badge>
                {ticket.isForwarded && (
                  <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                    Forwarded
                  </Badge>
                )}
              </div>
            </div>

            {/* Created By */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Created By
              </h3>
              <p className="text-sm text-gray-900 dark:text-white">
                {ticket.tenant?.name || ticket.user?.name || 'Unknown'}
              </p>
              {ticket.tenant?.name && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Tenant: {ticket.tenant.name}
                </p>
              )}
              {ticket.user?.email && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {ticket.user.email}
                </p>
              )}
            </div>

            {/* Dates */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Dates
              </h3>
              <div className="space-y-1 text-sm">
                <p className="text-gray-900 dark:text-white">
                  <span className="text-gray-500 dark:text-gray-400">Created:</span> {formatDate(ticket.createdAt)}
                </p>
                <p className="text-gray-900 dark:text-white">
                  <span className="text-gray-500 dark:text-gray-400">Updated:</span> {formatDate(ticket.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Comments ({ticket.comments?.length || 0})
          </h2>
        </div>

        {/* Add Comment */}
        <div className="mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex flex-col justify-end">
              <button
                onClick={handleAddComment}
                disabled={isAddingComment || !newComment.trim()}
                className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAddingComment ? 'Adding...' : 'Add Comment'}
              </button>
            </div>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {ticket.comments && ticket.comments.length > 0 ? (
            ticket.comments.map((comment) => (
              <div key={comment.id} className="border-l-4 border-brand-500 pl-4 py-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {comment.commenterType === 'superadmin' ? 'SuperAdmin' : 
                         comment.commenterType === 'tenant' ? 'Tenant' : 'User'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {comment.text}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No comments yet. Be the first to add a comment!
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 