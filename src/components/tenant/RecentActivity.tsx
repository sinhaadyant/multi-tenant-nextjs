import React from 'react';
import { 
  User, 
  Settings, 
  FileText, 
  Shield, 
  Activity,
  Clock,
  ArrowRight
} from 'lucide-react';

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface Props {
  activities: Activity[];
  tenantSlug: string;
}

export const RecentActivity: React.FC<Props> = ({ activities, tenantSlug }) => {
  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'user.login':
      case 'user.logout':
      case 'user.create':
      case 'user.update':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'settings.update':
      case 'tenant.update':
        return <Settings className="h-4 w-4 text-green-500" />;
      case 'report.generate':
      case 'report.download':
        return <FileText className="h-4 w-4 text-purple-500" />;
      case 'permission.update':
      case 'role.update':
        return <Shield className="h-4 w-4 text-orange-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'user.login':
      case 'user.create':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'settings.update':
      case 'tenant.update':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'report.generate':
      case 'report.download':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      case 'permission.update':
      case 'role.update':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}d ago`;
    }
  };

  const formatActivityType = (type: string) => {
    return type
      .split('.')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          No recent activity
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Activities will appear here as they occur
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className={`flex items-start space-x-3 p-3 rounded-lg border ${getActivityColor(activity.type)}`}
        >
          <div className="flex-shrink-0 mt-1">
            {getActivityIcon(activity.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formatActivityType(activity.type)}
              </p>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <Clock className="h-3 w-3 mr-1" />
                {formatTimestamp(activity.timestamp)}
              </div>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {activity.description}
            </p>
            
            {activity.user && (
              <div className="flex items-center mt-2">
                <User className="h-3 w-3 text-gray-400 mr-1" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  by {activity.user.name}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
      
      {activities.length > 0 && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => window.open(`/${tenantSlug}/audit-logs`, '_blank')}
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            View All Activity
            <ArrowRight className="h-4 w-4 ml-2" />
          </button>
        </div>
      )}
    </div>
  );
}; 