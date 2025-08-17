"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNotification } from "@/hooks/useNotification";
import { CustomNotification, LoadingNotification } from "@/components/ui";

export default function NotificationDemoPage() {
  const { success, error, warning, info, dismiss, dismissAll } =
    useNotification();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleBasicNotifications = () => {
    success({ message: "This is a success notification!" });
    error({ message: "This is an error notification!" });
    warning({ message: "This is a warning notification!" });
    info({ message: "This is an info notification!" });
  };

  const handleNotificationsWithActions = () => {
    success({
      title: "File Uploaded",
      message: "Your file has been successfully uploaded to the server.",
      action: {
        label: "View File",
        onClick: () => {
          info({ message: "Opening file..." });
        },
      },
    });

    error({
      title: "Connection Failed",
      message:
        "Unable to connect to the server. Please check your internet connection.",
      action: {
        label: "Retry",
        onClick: () => {
          info({ message: "Retrying connection..." });
        },
      },
    });
  };

  const handleCustomNotification = () => {
    // This would be used with a custom notification system
    // For now, we'll show it as a regular notification
    success({
      title: "Custom Notification",
      message: "This is a custom notification with rich content and metadata.",
    });
  };

  const handleLoadingNotification = () => {
    const id = info({
      title: "Processing",
      message: "Please wait while we process your request...",
    });

    setLoadingId(id);

    // Simulate progress
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        clearInterval(interval);
        dismiss(id);
        success({ message: "Processing completed successfully!" });
        setLoadingId(null);
        setProgress(0);
      }
    }, 500);
  };

  const handleLongRunningOperation = () => {
    const id = info({
      title: "Long Operation",
      message: "This operation may take several minutes to complete.",
    });

    setLoadingId(id);

    // Simulate a long operation
    setTimeout(() => {
      dismiss(id);
      success({ message: "Long operation completed!" });
      setLoadingId(null);
    }, 5000);
  };

  const handleNotificationWithMetadata = () => {
    success({
      title: "User Action",
      message: "User profile updated successfully",
    });
  };

  const handleDismissAll = () => {
    dismissAll();
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Notification System Demo</h1>
        <p className="text-gray-600">
          This page demonstrates the comprehensive notification system with
          various types and features.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Basic Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Badge variant="outline">Basic</Badge>
              <span>Basic Notifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-600 mb-4">
              Simple notifications for different message types.
            </p>
            <Button onClick={handleBasicNotifications} className="w-full">
              Show All Types
            </Button>
          </CardContent>
        </Card>

        {/* Notifications with Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Badge variant="outline">Actions</Badge>
              <span>With Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-600 mb-4">
              Notifications with clickable action buttons.
            </p>
            <Button onClick={handleNotificationsWithActions} className="w-full">
              Show with Actions
            </Button>
          </CardContent>
        </Card>

        {/* Loading Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Badge variant="outline">Loading</Badge>
              <span>Loading States</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-600 mb-4">
              Notifications for long-running operations.
            </p>
            <Button onClick={handleLoadingNotification} className="w-full">
              Show Progress
            </Button>
            <Button
              onClick={handleLongRunningOperation}
              className="w-full"
              variant="outline"
            >
              Long Operation
            </Button>
          </CardContent>
        </Card>

        {/* Custom Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Badge variant="outline">Custom</Badge>
              <span>Custom Content</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-600 mb-4">
              Rich notifications with custom styling and metadata.
            </p>
            <Button onClick={handleCustomNotification} className="w-full">
              Show Custom
            </Button>
          </CardContent>
        </Card>

        {/* Metadata Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Badge variant="outline">Metadata</Badge>
              <span>With Metadata</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-600 mb-4">
              Notifications with additional context information.
            </p>
            <Button onClick={handleNotificationWithMetadata} className="w-full">
              Show with Metadata
            </Button>
          </CardContent>
        </Card>

        {/* Utility Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Badge variant="outline">Utility</Badge>
              <span>Utility Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-600 mb-4">
              Utility functions for managing notifications.
            </p>
            <Button
              onClick={handleDismissAll}
              className="w-full"
              variant="destructive"
            >
              Dismiss All
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Current Status */}
      {loadingId && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">Current Operation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-700 mb-2">
              Loading notification ID: {loadingId}
            </p>
            {progress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress:</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Notification System Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">
                Available Notification Types:
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>
                  <strong>Success:</strong> Green notifications for successful
                  operations
                </li>
                <li>
                  <strong>Error:</strong> Red notifications for errors and
                  failures
                </li>
                <li>
                  <strong>Warning:</strong> Orange notifications for warnings
                </li>
                <li>
                  <strong>Info:</strong> Blue notifications for informational
                  messages
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Features:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Automatic dismissal with configurable duration</li>
                <li>Clickable action buttons</li>
                <li>Loading states with progress indicators</li>
                <li>Custom styling and rich content</li>
                <li>Integration with Axios interceptors</li>
                <li>Redux store integration</li>
                <li>TypeScript support</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Usage:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                {`import { useNotification } from "@/hooks/useNotification";

const { success, error, warning, info } = useNotification();

// Basic usage
success({ message: "Operation completed!" });
error({ message: "Something went wrong!" });

// With actions
success({
  title: "File Uploaded",
  message: "Your file has been uploaded.",
  action: {
    label: "View",
    onClick: () => console.log("View file")
  }
});`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
