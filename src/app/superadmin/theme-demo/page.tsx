"use client";

import React, { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import ThemeToggle from '@/components/common/ThemeToggle';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Badge from '@/components/ui/badge/Badge';
import { Modal } from '@/components/ui/modal';
import BasicTableOne from '@/components/tables/BasicTableOne';
import { useTenantTheme } from '@/lib/tenantTheme';
import { Settings, Palette, Sun, Moon, Monitor } from 'lucide-react';

export default function ThemeDemoPage() {
  const { theme, setTheme } = useTheme();
  const { getCurrentConfig, setTenantTheme } = useTenantTheme();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTenantTheme, setSelectedTenantTheme] = useState('default');

  const tenantThemes = [
    { id: 'default', name: 'Default', color: '#465fff' },
    { id: 'corporate', name: 'Corporate', color: '#1d4ed8' },
    { id: 'creative', name: 'Creative', color: '#7c3aed' },
    { id: 'healthcare', name: 'Healthcare', color: '#0d9488' },
  ];

  const handleTenantThemeChange = (themeId: string) => {
    setSelectedTenantTheme(themeId);
    setTenantTheme(themeId);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Theme System Demo
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Showcase of the multi-tenant dark/light theme system
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle variant="switch" showLabel />
            <ThemeToggle variant="icon" size="lg" />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Theme Controls */}
        <ComponentCard title="Theme Controls" desc="Switch between light and dark themes">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Theme Toggle Variants */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">Toggle Variants</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Icon:</span>
                  <ThemeToggle variant="icon" size="sm" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Switch:</span>
                  <ThemeToggle variant="switch" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Dropdown:</span>
                  <ThemeToggle variant="dropdown" />
                </div>
              </div>
            </div>

            {/* Current Theme Info */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">Current Theme</h4>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {theme === 'dark' ? (
                    <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  )}
                  <span className="font-medium text-gray-900 dark:text-white capitalize">
                    {theme} Mode
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Theme preference is persisted across sessions
                </p>
              </div>
            </div>

            {/* System Theme Detection */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">System Detection</h4>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Monitor className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    Auto-detect
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Follows system preference when no manual selection is made
                </p>
              </div>
            </div>
          </div>
        </ComponentCard>

        {/* Tenant Themes */}
        <ComponentCard title="Multi-Tenant Themes" desc="Different theme configurations for different tenants">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tenantThemes.map((tenantTheme) => (
              <button
                key={tenantTheme.id}
                onClick={() => handleTenantThemeChange(tenantTheme.id)}
                className={`p-4 rounded-lg border transition-all ${
                  selectedTenantTheme === tenantTheme.id
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: tenantTheme.color }}
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {tenantTheme.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </ComponentCard>

        {/* Component Showcase */}
        <ComponentCard title="Component Showcase" desc="Common UI components with theme support">
          <div className="space-y-8">
            {/* Buttons */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-4">Buttons</h4>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary Button</Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="primary" disabled>Disabled Button</Button>
                <Button variant="outline" startIcon={<Settings className="h-4 w-4" />}>
                  With Icon
                </Button>
              </div>
            </div>

            {/* Form Elements */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-4">Form Elements</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input placeholder="Normal input" />
                <Input placeholder="Error state" error hint="This field has an error" />
                <Input placeholder="Success state" success hint="Field is valid" />
                <Input placeholder="Disabled input" disabled />
              </div>
            </div>

            {/* Badges */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-4">Badges</h4>
              <div className="flex flex-wrap gap-3">
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="error">Error</Badge>
                <Badge variant="info">Info</Badge>
              </div>
            </div>

            {/* Modal Demo */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-4">Modal</h4>
              <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
              <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Theme-aware Modal
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    This modal adapts to the current theme automatically.
                  </p>
                  <div className="flex gap-3">
                    <Button onClick={() => setModalOpen(false)}>Close</Button>
                    <Button variant="outline" onClick={() => setModalOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </Modal>
            </div>
          </div>
        </ComponentCard>

        {/* Table Demo */}
        <ComponentCard title="Data Table" desc="Table component with dark mode support">
          <BasicTableOne />
        </ComponentCard>

        {/* Color Palette */}
        <ComponentCard title="Color Palette" desc="Theme colors in light and dark modes">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Primary Colors */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-4">Primary Colors</h4>
              <div className="space-y-2">
                {[
                  { name: 'Brand 500', class: 'bg-brand-500' },
                  { name: 'Brand 600', class: 'bg-brand-600' },
                  { name: 'Success 500', class: 'bg-success-500' },
                  { name: 'Error 500', class: 'bg-error-500' },
                  { name: 'Warning 500', class: 'bg-warning-500' },
                ].map((color) => (
                  <div key={color.name} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded ${color.class}`} />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {color.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Gray Scale */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-4">Gray Scale</h4>
              <div className="space-y-2">
                {[
                  { name: 'Gray 50', class: 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700' },
                  { name: 'Gray 100', class: 'bg-gray-100 dark:bg-gray-800' },
                  { name: 'Gray 200', class: 'bg-gray-200 dark:bg-gray-700' },
                  { name: 'Gray 500', class: 'bg-gray-500' },
                  { name: 'Gray 900', class: 'bg-gray-900 dark:bg-gray-100' },
                ].map((color) => (
                  <div key={color.name} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded ${color.class}`} />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {color.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ComponentCard>

        {/* Implementation Details */}
        <ComponentCard title="Implementation Details" desc="Technical details about the theme system">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Features</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>✅ React Context API for state management</li>
                <li>✅ localStorage persistence</li>
                <li>✅ SSR-safe hydration</li>
                <li>✅ System theme detection</li>
                <li>✅ Multi-tenant support</li>
                <li>✅ User preference sync</li>
                <li>✅ Tailwind CSS v4 integration</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Browser Support</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>✅ Chrome/Edge (latest)</li>
                <li>✅ Firefox (latest)</li>
                <li>✅ Safari (latest)</li>
                <li>✅ Mobile browsers</li>
                <li>✅ Graceful degradation</li>
                <li>✅ No-JS fallback</li>
              </ul>
            </div>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}