"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface LoadingNotificationProps {
  title: string;
  message: string;
  progress?: number;
  onCancel?: () => void;
  onDismiss?: () => void;
  showProgress?: boolean;
  indeterminate?: boolean;
}

export const LoadingNotification: React.FC<LoadingNotificationProps> = ({
  title,
  message,
  progress,
  onCancel,
  onDismiss,
  showProgress = false,
  indeterminate = false,
}) => {
  return (
    <Card className="border-l-4 border-l-blue-500 text-blue-600 bg-blue-50 border-blue-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin" />
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

        {showProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Progress</span>
              {!indeterminate && progress !== undefined && (
                <span>{Math.round(progress)}%</span>
              )}
            </div>
            <Progress
              value={indeterminate ? undefined : progress}
              className="h-2"
            />
          </div>
        )}

        {onCancel && (
          <div className="mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={onCancel}
              className="text-blue-600 border-blue-300 hover:bg-blue-100"
            >
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
