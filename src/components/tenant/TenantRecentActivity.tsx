import React from 'react';
import { 
  Users, 
  Shield, 
  Activity, 
  Database,
  AlertTriangle,
  CheckCircle,
  Clock,
  UserPlus,
  UserCheck,
  Settings,
  Key,
  Eye
} from 'lucide-react';

interface Activity {
  id: string;
  type: 'audit' | 'user' | 'system';
  action: string;
  description: string;
  timestamp: string;
  user: string;
  severity: 'error' | 'warning' | 'info';
  metadata?: any;
}

interface TenantRecentActivityProps {
  activities: Activity[];
  tenantSlug?: string;
}

const getActionIcon = (action: string) => {
  const actionLower = action.toLowerCase();
  
  if (actionLower.includes('login')) return <UserCheck className="w-4 h-4" />;
  if (actionLower.includes('signup') || actionLower.includes('register')) return <UserPlus className="w-4 h-4" />;
  if (actionLower.includes('user')) return <Users className="w-4 h-4" />;
  if (actionLower.includes('role')) return <Shield className="w-4 h-4" />;
  if (actionLower.includes('settings') || actionLower.includes('config')) return <Settings className="w-4 h-4" />;
  if (actionLower.includes('password') || actionLower.includes('auth')) return <Key className="w-4 h-4" />;
  if (actionLower.includes('error')) return <AlertTriangle className="w-4 h-4" />;
  if (actionLower.includes('profile') || actionLower.includes('view')) return <Eye className="w-4 h-4" />;
  return <Activity className="w-4 h-4" />;
};

const getActionColor = (action: string, severity: string) => {
  const actionLower = action.toLowerCase();
  
  // Check severity first
  if (severity === 'error') return 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400';
  if (severity === 'warning') return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400';
  
  // Then check action type
  if (actionLower.includes('login')) return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400';
  if (actionLower.includes('signup') || actionLower.includes('register')) return 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400';
  if (actionLower.includes('create')) return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400';
  if (actionLower.includes('update') || actionLower.includes('edit')) return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400';
  if (actionLower.includes('delete') || actionLower.includes('remove')) return 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400';
  if (actionLower.includes('profile') || actionLower.includes('view')) return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400';
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

const formatActionText = (action: string, description: string, user: string) => {
  // Clean up action text
  let text = action
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace('Superadmin', 'SuperAdmin')
    .replace('Login', 'Login')
    .replace('Signup', 'Sign Up')
    .replace('Profile', 'Profile');
  
  // Add user context if available
  if (user && user !== 'Unknown User') {
    text += ` by ${user}`;
  }
  
  return text;
};

const parseDescription = (description: string) => {
  try {
    // Try to parse JSON description
    const parsed = JSON.parse(description);
    
    // Extract meaningful information
    if (typeof parsed === 'object') {
      const parts = [];
      
      if (parsed.userId) parts.push(`User ID: ${parsed.userId}`);
      if (parsed.tenantId) parts.push(`Tenant ID: ${parsed.tenantId}`);
      if (parsed.tenantSlug) parts.push(`Tenant: ${parsed.tenantSlug}`);
      if (parsed.action) parts.push(`Action: ${parsed.action}`);
      if (parsed.resource) parts.push(`Resource: ${parsed.resource}`);
      if (parsed.details) parts.push(`Details: ${parsed.details}`);
      
      return parts.length > 0 ? parts.join(', ') : 'Activity performed';
    }
    
    return description;
  } catch {
    // If not JSON, return as is
    return description;
  }
};

export const TenantRecentActivity: React.FC<TenantRecentActivityProps> = ({ activities, tenantSlug }) => {
  // Add null checks to prevent errors
  if (!activities) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Activity
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
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Activity
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {activities.length} activities
          </span>
          <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
            View All
          </button>
        </div>
      </div>
      
      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
          </div>
        ) : (
          activities.slice(0, 8).map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className={`p-2 rounded-full ${getActionColor(activity.action, activity.severity)}`}>
                {getActionIcon(activity.action)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
                  {formatActionText(activity.action, activity.description, activity.user)}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {parseDescription(activity.description)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatTimeAgo(activity.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
      
      {activities.length > 8 && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button className="w-full text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
            View {activities.length - 8} more activities
          </button>
        </div>
      )}
    </div>
  );
};
