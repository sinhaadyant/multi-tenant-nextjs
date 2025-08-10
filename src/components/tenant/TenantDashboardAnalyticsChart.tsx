import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { TrendingUp, Users, Activity, Cpu, HardDrive } from 'lucide-react';

interface ChartData {
  userActivity: Array<{
    date: string;
    users: number;
    activities: number;
  }>;
  systemUsage: Array<{
    date: string;
    cpu: number;
    memory: number;
    storage: number;
  }>;
}

interface Props {
  charts: ChartData;
  selectedRange: string;
}

export const TenantDashboardAnalyticsChart: React.FC<Props> = ({ 
  charts, 
  selectedRange 
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'system'>('users');

  const tabs = [
    {
      id: 'users',
      label: 'User Activity',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      id: 'system',
      label: 'System Usage',
      icon: Cpu,
      color: 'text-green-600'
    }
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (selectedRange === '1d') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {formatDate(label)}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-gray-600 dark:text-gray-400">
              <span style={{ color: entry.color }}>
                {entry.name}:
              </span>{' '}
              {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'users' | 'system')}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <tab.icon className="h-4 w-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chart Container */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === 'users' ? (
            <LineChart data={charts.userActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                name="Active Users"
              />
              <Line
                type="monotone"
                dataKey="activities"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2 }}
                name="Activities"
              />
            </LineChart>
          ) : (
            <BarChart data={charts.systemUsage}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="cpu" 
                fill="#10b981" 
                name="CPU Usage (%)"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="memory" 
                fill="#8b5cf6" 
                name="Memory Usage (%)"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="storage" 
                fill="#f59e0b" 
                name="Storage Usage (%)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Chart Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        {activeTab === 'users' ? (
          <>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.max(...charts.userActivity.map(d => d.users))}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Peak Users
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.max(...charts.userActivity.map(d => d.activities))}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Peak Activities
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {charts.userActivity.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Data Points
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.max(...charts.systemUsage.map(d => d.cpu))}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Peak CPU
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.max(...charts.systemUsage.map(d => d.memory))}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Peak Memory
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.max(...charts.systemUsage.map(d => d.storage))}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Peak Storage
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}; 