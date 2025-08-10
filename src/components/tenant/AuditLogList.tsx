import React from 'react';
import { 
  Building2, 
  Users, 
  Shield, 
  Database,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  UserPlus,
  UserCheck,
  Settings,
  Key,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface AuditLog {
  id: string;
  action: string;
  createdAt: string;
  details?: string;
  user?: {
    email: string;
    name: string;
  } | null;
  entity?: {
    type: string;
    name: string;
  } | null;
}

interface AuditLogListProps {
  logs: AuditLog[];
  isLoading?: boolean;
  title?: string;
  showViewMore?: boolean;
  viewMoreLink?: string;
  className?: string;
}

const getActionIcon = (action: string) => {
  const actionLower = action.toLowerCase();
  
  if (actionLower.includes('login')) return <UserCheck className="w-4 h-4" />;
  if (actionLower.includes('signup') || actionLower.includes('register')) return <UserPlus className="w-4 h-4" />;
  if (actionLower.includes('tenant')) return <Building2 className="w-4 h-4" />;
  if (actionLower.includes('user')) return <Users className="w-4 h-4" />;
  if (actionLower.includes('admin')) return <Shield className="w-4 h-4" />;
  if (actionLower.includes('settings') || actionLower.includes('config')) return <Settings className="w-4 h-4" />;
  if (actionLower.includes('password') || actionLower.includes('auth')) return <Key className="w-4 h-4" />;
  if (actionLower.includes('error')) return <AlertTriangle className="w-4 h-4" />;
  return <Activity className="w-4 h-4" />;
};

const getActionColor = (action: string) => {
  const actionLower = action.toLowerCase();
  
  if (actionLower.includes('login')) return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400';
  if (actionLower.includes('signup') || actionLower.includes('register')) return 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400';
  if (actionLower.includes('create')) return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400';
  if (actionLower.includes('update') || actionLower.includes('edit')) return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400';
  if (actionLower.includes('delete') || actionLower.includes('remove')) return 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400';
  if (actionLower.includes('error') || actionLower.includes('fail')) return 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400';
  return 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400';
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatActionText = (action: string, entity?: any, user?: any) => {
  // Clean up action text
  let text = action
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace('Superadmin', 'SuperAdmin')
    .replace('Login', 'Login')
    .replace('Signup', 'Sign Up');
  
  // Add context information
  const context = [];
  
  if (entity) {
    context.push(`${entity.type}: ${entity.name}`);
  }
  if (user) {
    context.push(`User: ${user.name}`);
  }
  
  if (context.length > 0) {
    text += ` (${context.join(', ')})`;
  }
  
  return text;
};

export const AuditLogList: React.FC<AuditLogListProps> = ({
  logs,
  isLoading = false,
  title = "Recent Activity",
  showViewMore = false,
  viewMoreLink = "/audit",
  className = ''
}) => {
  // Loading state
  if (isLoading) {
    return (
      <div className={`p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className="flex items-start space-x-3 p-3 rounded-lg animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full dark:bg-gray-700"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 dark:bg-gray-700"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mt-2 dark:bg-gray-700"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {logs.length} activities
          </span>
          {showViewMore && (
            <Link 
              href={viewMoreLink}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>
      
      <div className="space-y-3">
        {logs.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
          </div>
        ) : (
          logs.slice(0, 8).map((log) => (
            <div key={log.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className={`p-2 rounded-full ${getActionColor(log.action)}`}>
                {getActionIcon(log.action)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
                  {formatActionText(log.action, log.entity, log.user)}
                </p>
                {log.details && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {log.details}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatTimeAgo(log.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
      
      {showViewMore && logs.length > 8 && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <Link 
            href={viewMoreLink}
            className="w-full text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center justify-center gap-1"
          >
            View {logs.length - 8} more activities
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}; 