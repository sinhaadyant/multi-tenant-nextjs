"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

export interface CustomNotificationProps {
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  actions?: {
    label: string;
    onClick: () => void;
    variant?:
      | "default"
      | "destructive"
      | "outline"
      | "secondary"
      | "ghost"
      | "link";
  }[];
  onDismiss?: () => void;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: "text-green-600 bg-green-50 border-green-200",
  error: "text-red-600 bg-red-50 border-red-200",
  warning: "text-yellow-600 bg-yellow-50 border-yellow-200",
  info: "text-blue-600 bg-blue-50 border-blue-200",
};

export const CustomNotification: React.FC<CustomNotificationProps> = ({
  type,
  title,
  message,
  actions = [],
  onDismiss,
  timestamp,
  metadata,
}) => {
  const Icon = iconMap[type];
  const colorClass = colorMap[type];

  return (
    <Card className={`border-l-4 border-l-current ${colorClass}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon className="h-5 w-5" />
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-gray-700 mb-3">{message}</p>

        {timestamp && (
          <p className="text-xs text-gray-500 mb-2">
            {timestamp.toLocaleTimeString()}
          </p>
        )}

        {metadata && Object.keys(metadata).length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {Object.entries(metadata).map(([key, value]) => (
              <Badge key={key} variant="outline" className="text-xs">
                {key}: {value}
              </Badge>
            ))}
          </div>
        )}

        {actions.length > 0 && (
          <div className="flex space-x-2">
            {actions.map((action, index) => (
              <Button
                key={index}
                size="sm"
                variant={action.variant || "outline"}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
