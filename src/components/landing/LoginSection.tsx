"use client";

import React, { useState } from 'react';
import { Building2, Lock, Mail } from 'lucide-react';

const sampleTenants = [
  { slug: 'techcorp', name: 'TechCorp Solutions' },
  { slug: 'globalretail', name: 'Global Retail Inc' }
];

export default function LoginSection() {
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    tenantSlug: ''
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.tenantSlug || !loginForm.email || !loginForm.password) {
      alert('Please fill in all fields');
      return;
    }
    
    // Redirect to tenant login page
    window.location.href = `/${loginForm.tenantSlug}/login`;
  };

  return (
    <section id="login-section" className="py-16 bg-gradient-to-br from-gray-50 to-blue-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Tenant Login
            </h2>
            <p className="text-gray-600">
              Access your tenant dashboard
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Tenant Selector */}
            <div>
              <label htmlFor="tenant" className="block text-sm font-medium text-gray-700 mb-2">
                Select Tenant
              </label>
              <div className="relative">
                <select
                  id="tenant"
                  value={loginForm.tenantSlug}
                  onChange={(e) => setLoginForm({ ...loginForm, tenantSlug: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                  required
                >
                  <option value="">Choose a tenant...</option>
                  {sampleTenants.map((tenant) => (
                    <option key={tenant.slug} value={tenant.slug}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Building2 className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                  required
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                  required
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Login to Dashboard
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
              Demo Credentials
            </h3>
            <div className="text-xs text-blue-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">TechCorp:</span>
                <span>admin@techcorp.com / AdminPass123</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Global Retail:</span>
                <span>admin@globalretail.com / AdminPass123</span>
              </div>
            </div>
          </div>

          {/* Additional Links */}
          <div className="mt-6 text-center">
            <a 
              href="#" 
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              Forgot password?
            </a>
            <span className="mx-2 text-gray-400">•</span>
            <a 
              href="#" 
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              Need help?
            </a>
          </div>
        </div>
      </div>
    </section>
  );
} 