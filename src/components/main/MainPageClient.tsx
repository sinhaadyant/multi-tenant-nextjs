"use client";

import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  Shield, 
  Settings, 
  BarChart3, 
  Activity,
  Eye,
  Plus,
  ArrowRight,
  CheckCircle,
  Star,
  Zap,
  Globe,
  Lock,
  Database,
  Cpu,
  TrendingUp,
  Users2,
  Key,
  FileText,
  Bell,
  Search,
  Menu,
  X,
  ChevronDown,
  ExternalLink,
  User
} from 'lucide-react';
import Link from 'next/link';

export default function MainPageClient() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const mockStats = {
    totalTenants: 150,
    activeTenants: 142,
    totalUsers: 2500,
    totalRoles: 45,
    systemHealth: 99.9,
    uptime: '99.99%'
  };

  const mockFeatures = [
    {
      id: 1,
      title: "Multi-Tenant Architecture",
      description: "Isolated tenant environments with secure data separation",
      icon: Building2,
      color: "bg-blue-500",
      features: ["Data Isolation", "Custom Domains", "Tenant-specific Configurations"]
    },
    {
      id: 2,
      title: "Role-Based Access Control",
      description: "Granular permissions with module-level access control",
      icon: Shield,
      color: "bg-green-500",
      features: ["Permission Management", "Role Templates", "Dynamic Access Control"]
    },
    {
      id: 3,
      title: "User Management",
      description: "Comprehensive user administration and lifecycle management",
      icon: Users,
      color: "bg-purple-500",
      features: ["User Provisioning", "Bulk Operations", "Activity Tracking"]
    },
    {
      id: 4,
      title: "Audit & Compliance",
      description: "Complete audit trail and compliance reporting",
      icon: FileText,
      color: "bg-orange-500",
      features: ["Audit Logs", "Compliance Reports", "Data Governance"]
    },
    {
      id: 5,
      title: "Analytics Dashboard",
      description: "Real-time analytics and performance monitoring",
      icon: BarChart3,
      color: "bg-indigo-500",
      features: ["Real-time Metrics", "Custom Reports", "Performance Monitoring"]
    },
    {
      id: 6,
      title: "System Administration",
      description: "Advanced system configuration and management",
      icon: Settings,
      color: "bg-red-500",
      features: ["System Settings", "Backup Management", "Health Monitoring"]
    }
  ];

  const mockRecentActivity = [
    {
      id: 1,
      action: "New tenant registered",
      tenant: "TechCorp Inc",
      time: "2 minutes ago",
      type: "success"
    },
    {
      id: 2,
      action: "Role permissions updated",
      tenant: "Acme Corporation",
      time: "5 minutes ago",
      type: "info"
    },
    {
      id: 3,
      action: "User account created",
      tenant: "Global Solutions",
      time: "10 minutes ago",
      type: "success"
    },
    {
      id: 4,
      action: "System backup completed",
      tenant: "System",
      time: "1 hour ago",
      type: "info"
    }
  ];

  const demoCredentials = [
    {
      role: "SuperAdmin",
      email: "admin@example.com",
      password: "admin123",
      description: "Full system access with tenant management capabilities",
      link: "/superadmin/login"
    },
    {
      role: "Tenant Admin",
      email: "admin@acme.com",
      password: "admin123",
      description: "Tenant-level administration with user and role management",
      link: "/acme/login"
    },
    {
      role: "Tenant User",
      email: "user@acme.com",
      password: "user123",
      description: "Limited access based on assigned role permissions",
      link: "/acme/login"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                MultiTenant Admin
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {['overview', 'features', 'demo'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="/superadmin/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                SuperAdmin Login
              </Link>
              <Link
                href="/acme/login"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Demo
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            {['overview', 'features', 'demo'].map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setIsMobileMenuOpen(false); }}
                className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left ${
                  activeTab === tab
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
            <div className="pt-4 space-y-2">
              <Link
                href="/superadmin/login"
                className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                SuperAdmin Login
              </Link>
              <Link
                href="/acme/login"
                className="block px-3 py-2 bg-blue-600 text-white text-base font-medium rounded-lg hover:bg-blue-700 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Try Demo
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white">
                Multi-Tenant
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  {" "}Admin Panel
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Enterprise-grade multi-tenant administration system with advanced role-based access control, 
                comprehensive analytics, and secure tenant isolation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/acme/login"
                  className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Try Live Demo
                </Link>
                <Link
                  href="/superadmin/login"
                  className="px-8 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  SuperAdmin Access
                </Link>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tenants</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{mockStats.totalTenants}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{mockStats.totalUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Roles</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{mockStats.totalRoles}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
                <Link
                  href="/superadmin/audit"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium flex items-center"
                >
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
              <div className="space-y-4">
                {mockRecentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-3 ${
                        activity.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.action}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{activity.tenant}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'features' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Powerful Multi-Tenant Features
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Discover the comprehensive features that make our multi-tenant admin panel the perfect solution for enterprise management.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockFeatures.map((feature) => (
                <div key={feature.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
                  <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {feature.description}
                  </p>
                  <ul className="space-y-2">
                    {feature.features.map((item, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'demo' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Try the Live Demo
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Experience the multi-tenant admin panel with different user roles and permissions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {demoCredentials.map((credential, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="text-center mb-4">
                    <div className={`w-12 h-12 mx-auto rounded-lg flex items-center justify-center mb-3 ${
                      index === 0 ? 'bg-red-100 dark:bg-red-900/20' :
                      index === 1 ? 'bg-blue-100 dark:bg-blue-900/20' :
                      'bg-green-100 dark:bg-green-900/20'
                    }`}>
                      {index === 0 ? (
                        <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
                      ) : index === 1 ? (
                        <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <User className="w-6 h-6 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {credential.role}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {credential.description}
                    </p>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                      </label>
                      <div className="flex items-center bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                        <span className="text-sm text-gray-900 dark:text-white font-mono">
                          {credential.email}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Password
                      </label>
                      <div className="flex items-center bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                        <span className="text-sm text-gray-900 dark:text-white font-mono">
                          {credential.password}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={credential.link}
                    className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Login as {credential.role}
                  </Link>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100">
                    Demo Environment
                  </h3>
                  <p className="text-blue-800 dark:text-blue-200 mt-1">
                    This is a live demo environment with sample data. All changes are temporary and will be reset periodically. 
                    Feel free to explore all features and test different user roles.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 