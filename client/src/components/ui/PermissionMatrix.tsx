"use client";

import React from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import type { Module } from "@/types/entities";

export interface PermissionMatrixProps {
  modules: Module[];
  selectedPermissions: Record<string, any>;
  onPermissionChange: (
    moduleId: string,
    permission: string,
    value: boolean
  ) => void;
  onSelectAllModule: (moduleId: string, value: boolean) => void;
  onSelectAllPermissions: (permission: string, value: boolean) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function PermissionMatrix({
  modules,
  selectedPermissions,
  onPermissionChange,
  onSelectAllModule,
  onSelectAllPermissions,
  isLoading = false,
  disabled = false,
}: PermissionMatrixProps) {
  const isModuleSelected = (moduleId: string) => {
    const modulePermissions = selectedPermissions[moduleId];
    if (!modulePermissions) return false;
    return Object.values(modulePermissions).some(Boolean);
  };

  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2 font-medium">Module</th>
              <th className="text-center p-2 font-medium">Create</th>
              <th className="text-center p-2 font-medium">Read</th>
              <th className="text-center p-2 font-medium">Update</th>
              <th className="text-center p-2 font-medium">Delete</th>
              <th className="text-center p-2 font-medium">View All</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, index) => (
              <tr key={index} className="border-b">
                <td className="p-2">
                  <Skeleton className="h-4 w-32" />
                </td>
                <td className="text-center p-2">
                  <Skeleton className="h-4 w-4 mx-auto" />
                </td>
                <td className="text-center p-2">
                  <Skeleton className="h-4 w-4 mx-auto" />
                </td>
                <td className="text-center p-2">
                  <Skeleton className="h-4 w-4 mx-auto" />
                </td>
                <td className="text-center p-2">
                  <Skeleton className="h-4 w-4 mx-auto" />
                </td>
                <td className="text-center p-2">
                  <Skeleton className="h-4 w-4 mx-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2 font-medium">Module</th>
            <th className="text-center p-2 font-medium">
              <div className="flex items-center justify-center space-x-1">
                <span>Create</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectAllPermissions("canCreate", true)}
                  disabled={disabled}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectAllPermissions("canCreate", false)}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </th>
            <th className="text-center p-2 font-medium">
              <div className="flex items-center justify-center space-x-1">
                <span>Read</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectAllPermissions("canRead", true)}
                  disabled={disabled}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectAllPermissions("canRead", false)}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </th>
            <th className="text-center p-2 font-medium">
              <div className="flex items-center justify-center space-x-1">
                <span>Update</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectAllPermissions("canUpdate", true)}
                  disabled={disabled}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectAllPermissions("canUpdate", false)}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </th>
            <th className="text-center p-2 font-medium">
              <div className="flex items-center justify-center space-x-1">
                <span>Delete</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectAllPermissions("canDelete", true)}
                  disabled={disabled}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectAllPermissions("canDelete", false)}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </th>
            <th className="text-center p-2 font-medium">
              <div className="flex items-center justify-center space-x-1">
                <span>View All</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectAllPermissions("canViewAll", true)}
                  disabled={disabled}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectAllPermissions("canViewAll", false)}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {modules.map(module => (
            <tr key={module.id} className="border-b">
              <td className="p-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={isModuleSelected(module.id)}
                    onCheckedChange={checked =>
                      onSelectAllModule(module.id, checked as boolean)
                    }
                    disabled={disabled}
                  />
                  <span className="font-medium">{module.name}</span>
                </div>
              </td>
              <td className="text-center p-2">
                <Checkbox
                  checked={selectedPermissions[module.id]?.canCreate || false}
                  onCheckedChange={checked =>
                    onPermissionChange(
                      module.id,
                      "canCreate",
                      checked as boolean
                    )
                  }
                  disabled={disabled}
                />
              </td>
              <td className="text-center p-2">
                <Checkbox
                  checked={selectedPermissions[module.id]?.canRead || false}
                  onCheckedChange={checked =>
                    onPermissionChange(module.id, "canRead", checked as boolean)
                  }
                  disabled={disabled}
                />
              </td>
              <td className="text-center p-2">
                <Checkbox
                  checked={selectedPermissions[module.id]?.canUpdate || false}
                  onCheckedChange={checked =>
                    onPermissionChange(
                      module.id,
                      "canUpdate",
                      checked as boolean
                    )
                  }
                  disabled={disabled}
                />
              </td>
              <td className="text-center p-2">
                <Checkbox
                  checked={selectedPermissions[module.id]?.canDelete || false}
                  onCheckedChange={checked =>
                    onPermissionChange(
                      module.id,
                      "canDelete",
                      checked as boolean
                    )
                  }
                  disabled={disabled}
                />
              </td>
              <td className="text-center p-2">
                <Checkbox
                  checked={selectedPermissions[module.id]?.canViewAll || false}
                  onCheckedChange={checked =>
                    onPermissionChange(
                      module.id,
                      "canViewAll",
                      checked as boolean
                    )
                  }
                  disabled={disabled}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
