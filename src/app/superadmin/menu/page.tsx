"use client";

import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  GripVertical, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle, 
  Save,
  RefreshCw,
  Settings
} from 'lucide-react';
import Button from '@/components/ui/button/Button';
import { useToast } from '@/context/ToastContext';
import ErrorBoundary from '@/components/common/ErrorBoundary';

interface Module {
  id: string;
  moduleKey: string;
  moduleName: string;
  description?: string;
  icon?: string;
  path?: string;
  isActive: boolean;
  isVisible: boolean;
  orderIndex: number;
  parentModuleKey?: string;
  version?: string;
  createdAt: string;
  updatedAt: string;
}

const SortableModuleItem = ({ 
  module, 
  onToggleVisibility, 
  onToggleActive 
}: { 
  module: Module; 
  onToggleVisibility: (id: string) => void;
  onToggleActive: (id: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-center space-x-3 flex-1">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <GripVertical size={20} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {module.moduleName}
            </h3>
            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
              {module.moduleKey}
            </span>
          </div>
          {module.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {module.description}
            </p>
          )}
          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Order: {module.orderIndex}</span>
            {module.version && <span>v{module.version}</span>}
            {module.path && <span>Path: {module.path}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onToggleVisibility(module.id)}
          className={`p-2 rounded-lg transition-colors ${
            module.isVisible 
              ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' 
              : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
          title={module.isVisible ? 'Hide module' : 'Show module'}
        >
          {module.isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
        
        <button
          onClick={() => onToggleActive(module.id)}
          className={`p-2 rounded-lg transition-colors ${
            module.isActive 
              ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' 
              : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
          }`}
          title={module.isActive ? 'Deactivate module' : 'Activate module'}
        >
          {module.isActive ? <CheckCircle size={18} /> : <XCircle size={18} />}
        </button>
      </div>
    </div>
  );
};

const DynamicMenuPage = () => {
  const { showToast } = useToast();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchModules = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/superadmin/modules', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('superadmin_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch modules');
      }

      const data = await response.json();
      if (data.success) {
        setModules(data.data.modules);
      } else {
        throw new Error(data.message || 'Failed to fetch modules');
      }
    } catch (err: any) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveModuleUpdates = async () => {
    try {
      setSaving(true);
      
      const updates = modules.map((module, index) => ({
        id: module.id,
        orderIndex: index + 1,
        isVisible: module.isVisible,
        isActive: module.isActive
      }));

      const response = await fetch('/api/superadmin/modules', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('superadmin_token')}`
        },
        body: JSON.stringify({ updates })
      });

      if (!response.ok) {
        throw new Error('Failed to update modules');
      }

      const data = await response.json();
      if (data.success) {
        showToast('Module order and settings updated successfully', 'success');
        await fetchModules(); // Refresh the list
      } else {
        throw new Error(data.message || 'Failed to update modules');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setModules((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleToggleVisibility = (moduleId: string) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId 
        ? { ...module, isVisible: !module.isVisible }
        : module
    ));
  };

  const handleToggleActive = (moduleId: string) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId 
        ? { ...module, isActive: !module.isActive }
        : module
    ));
  };

  useEffect(() => {
    fetchModules();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Dynamic Menu Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage module order and visibility for the superadmin menu
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Dynamic Menu Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Drag and drop to reorder modules, toggle visibility and activation status
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={fetchModules}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </Button>
            
            <Button
              onClick={saveModuleUpdates}
              variant="primary"
              size="sm"
              disabled={saving || loading}
            >
              <Save size={16} className="mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error loading modules
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modules List */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Modules ({modules.length})
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Drag the grip handle to reorder, use the eye icon to toggle visibility, and the checkmark to toggle activation
            </p>
          </div>
          
          <div className="p-6">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={modules.map(module => module.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {modules.map((module) => (
                    <SortableModuleItem
                      key={module.id}
                      module={module}
                      onToggleVisibility={handleToggleVisibility}
                      onToggleActive={handleToggleActive}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            
            {modules.length === 0 && !loading && (
              <div className="text-center py-12">
                <Settings className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No modules found
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Get started by creating some modules in the system.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Legend
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <GripVertical size={16} className="text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Drag to reorder</span>
            </div>
            <div className="flex items-center space-x-2">
              <Eye size={16} className="text-green-600" />
              <span className="text-gray-600 dark:text-gray-400">Visible in menu</span>
            </div>
            <div className="flex items-center space-x-2">
              <EyeOff size={16} className="text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Hidden from menu</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle size={16} className="text-green-600" />
              <span className="text-gray-600 dark:text-gray-400">Module active</span>
            </div>
            <div className="flex items-center space-x-2">
              <XCircle size={16} className="text-red-600" />
              <span className="text-gray-600 dark:text-gray-400">Module inactive</span>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default DynamicMenuPage;
