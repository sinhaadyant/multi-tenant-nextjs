"use client";

import React from "react";
import {
  Activity,
  Clock,
  User,
  Shield,
  Settings,
  LogOut,
  LogIn,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  description: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  metadata?: Record<string, any>;
}

interface ActivityLogsProps {
  logs: ActivityLog[];
  isLoading?: boolean;
  emptyMessage?: string;
}

const getActionIcon = (action: string) => {
  switch (action.toLowerCase()) {
    case "login":
      return <LogIn className="h-4 w-4" />;
    case "logout":
      return <LogOut className="h-4 w-4" />;
    case "profile_update":
      return <User className="h-4 w-4" />;
    case "password_change":
      return <Shield className="h-4 w-4" />;
    case "settings_update":
      return <Settings className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};

const getActionColor = (action: string) => {
  switch (action.toLowerCase()) {
    case "login":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "logout":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    case "profile_update":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "password_change":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
    case "settings_update":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
};

export function ActivityLogs({
  logs,
  isLoading = false,
  emptyMessage = "No activity logs found",
}: ActivityLogsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Logs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-start space-x-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Logs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {logs.map(log => (
          <div
            key={log.id}
            className="flex items-start space-x-3 p-3 rounded-lg border"
          >
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                {getActionIcon(log.action)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className={getActionColor(log.action)}>
                    {log.action.replace(/_/g, " ").toUpperCase()}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {new Date(log.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                {log.description}
              </p>
              {log.ip_address && (
                <p className="text-xs text-gray-500 mt-1">
                  IP: {log.ip_address}
                </p>
              )}
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                    View Details
                  </summary>
                  <pre className="text-xs text-gray-600 mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
