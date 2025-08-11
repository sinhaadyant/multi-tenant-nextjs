"use client";

import React, { useState, useEffect } from 'react';
import { X, Edit, Trash2, Send, Calendar, Users, Bell } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  targetType: string;
  status: string;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdByType: string;
  superAdmin?: {
    id: string;
    name: string;
    email: string;
  };
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface NotificationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  notificationId: string | null;
  tenantSlug: string;
  onEdit?: (notificationId: string) => void;
  onDelete?: (notificationId: string) => void;
}

const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  isOpen,
  onClose,
  notificationId,
  tenantSlug,
  onEdit,
  onDelete
}) => {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && notificationId) {
      fetchNotification();
    }
  }, [isOpen, notificationId]);

  const fetchNotification = async () => {
    if (!notificationId) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('tenant_auth_token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await axios.get(`/api/tenant/${tenantSlug}/notifications/${notificationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setNotification(response.data.data.notification);
      } else {
        setError('Failed to fetch notification');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch notification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!notification) return;

    if (!confirm('Are you sure you want to delete this notification?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('tenant_auth_token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      await axios.delete(`/api/tenant/${tenantSlug}/notifications/${notificationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      toast.success('Notification deleted successfully');
      onDelete?.(notificationId!);
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete notification');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    if (notification) {
      onEdit?.(notification.id);
      onClose();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'alert':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'promotional':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'system_update':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Notification Details
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  View notification information
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {notification && (
                <>
                  <button
                    onClick={handleEdit}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    title="Edit notification"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200 disabled:opacity-50"
                    title="Delete notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
                <div className="animate-pulse">
                  <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-500 mb-2">
                  <X className="w-12 h-12 mx-auto" />
                </div>
                <p className="text-gray-600 dark:text-gray-400">{error}</p>
                <button
                  onClick={fetchNotification}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            ) : notification ? (
              <div className="space-y-6">
                {/* Title and Status */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {notification.title}
                  </h2>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(notification.status)}`}>
                      {notification.status}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                      {notification.type}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                      {notification.priority}
                    </span>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-40 overflow-y-auto">
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap text-sm">
                      {notification.message}
                    </p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Type</h3>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-900 dark:text-white text-sm capitalize">
                        {notification.targetType.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Created By</h3>
                    <span className="text-gray-900 dark:text-white text-sm">
                      {notification.superAdmin?.name || notification.createdBy}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Created At</h3>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-900 dark:text-white text-sm">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Updated</h3>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-900 dark:text-white text-sm">
                        {new Date(notification.updatedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {notification.scheduledAt && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Scheduled For</h3>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-900 dark:text-white text-sm">
                          {new Date(notification.scheduledAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {notification.sentAt && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sent At</h3>
                      <div className="flex items-center">
                        <Send className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-900 dark:text-white text-sm">
                          {new Date(notification.sentAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDetailModal;
