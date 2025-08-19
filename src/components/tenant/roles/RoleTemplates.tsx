"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

interface RoleTemplatesProps {
  templates: any[];
  onImportTemplate: (templateId: string) => Promise<void>;
  loading: boolean;
}

const RoleTemplates: React.FC<RoleTemplatesProps> = ({
  templates,
  onImportTemplate,
  loading
}) => {
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Role Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400">
            Predefined role templates for quick setup. This feature is under development.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleTemplates;
