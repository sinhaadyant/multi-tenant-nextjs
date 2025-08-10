"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ChevronDown, 
  Users, 
  Shield, 
  BarChart3, 
  Settings, 
  ClipboardList,
  Building2,
  Lock,
  TrendingUp,
  Zap,
  ArrowRight,
  CheckCircle,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  Github
} from 'lucide-react';

// Sample tenant data from installation guide
const sampleTenants = [
  { slug: 'techcorp', name: 'TechCorp Solutions' },
  { slug: 'globalretail', name: 'Global Retail Inc' }
];

// Features data
const features = [
  {
    icon: <Users className="w-8 h-8" />,
    title: 'Tenant Dashboard',
    description: 'Comprehensive dashboard for managing multiple tenants with real-time analytics and insights.',
    color: 'text-blue-600'
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: 'Role Management',
    description: 'Advanced role-based access control with granular permissions and user management.',
    color: 'text-green-600'
  },
  {
    icon: <ClipboardList className="w-8 h-8" />,
    title: 'Audit Logs',
    description: 'Complete audit trail with detailed activity logs and compliance reporting.',
    color: 'text-purple-600'
  },
  {
    icon: <Settings className="w-8 h-8" />,
    title: 'Settings & Configuration',
    description: 'Flexible configuration options for tenant customization and system preferences.',
    color: 'text-orange-600'
  }
];

// Use cases for slider
const useCases = [
  {
    title: 'SaaS Applications',
    description: 'Perfect for SaaS platforms managing multiple client organizations',
    image: '/images/saas.jpg',
    features: ['Multi-tenant isolation', 'Custom branding', 'Scalable architecture']
  },
  {
    title: 'Enterprise Portals',
    description: 'Ideal for large enterprises with multiple departments and teams',
    image: '/images/enterprise.jpg',
    features: ['Department management', 'Advanced security', 'Compliance ready']
  },
  {
    title: 'Educational Platforms',
    description: 'Built for educational institutions managing multiple schools and courses',
    image: '/images/education.jpg',
    features: ['School management', 'Course administration', 'Student portals']
  }
];

// Benefits data
const benefits = [
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: 'Scalability',
    description: 'Built to handle thousands of tenants with optimal performance and resource management.',
    color: 'bg-gradient-to-r from-blue-500 to-purple-600'
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Security',
    description: 'Enterprise-grade security with data isolation, encryption, and compliance standards.',
    color: 'bg-gradient-to-r from-green-500 to-teal-600'
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Analytics',
    description: 'Comprehensive analytics and reporting for better decision-making and insights.',
    color: 'bg-gradient-to-r from-purple-500 to-pink-600'
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Role-Based Access',
    description: 'Granular permission system with role-based access control for maximum security.',
    color: 'bg-gradient-to-r from-orange-500 to-red-600'
  }
];

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState('');
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    tenantSlug: ''
  });

  // Auto-play slider
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % useCases.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, useCases.length]);

  const scrollToLogin = () => {
    document.getElementById('login-section')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.tenantSlug || !loginForm.email || !loginForm.password) {
      alert('Please fill in all fields');
      return;
    }
    
    // Redirect to tenant login page
    window.location.href = `/${loginForm.tenantSlug}/login`;
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % useCases.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + useCases.length) % useCases.length);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Image
                src="/images/logo/logo.svg"
                alt="Multi-Tenant Platform"
                width={150}
                height={40}
                className="h-8 w-auto"
              />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors">
                Features
              </a>
              <a href="#use-cases" className="text-gray-700 hover:text-blue-600 transition-colors">
                Use Cases
              </a>
              <a href="#benefits" className="text-gray-700 hover:text-blue-600 transition-colors">
                Benefits
              </a>
              <Link 
                href="/superadmin/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Superadmin Login
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col space-y-4">
                <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors">
                  Features
                </a>
                <a href="#use-cases" className="text-gray-700 hover:text-blue-600 transition-colors">
                  Use Cases
                </a>
                <a href="#benefits" className="text-gray-700 hover:text-blue-600 transition-colors">
                  Benefits
                </a>
                <Link 
                  href="/superadmin/login"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center"
                >
                  Superadmin Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Multi-Tenant Management Platform
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Manage tenants, roles, and users efficiently with a single dashboard. 
              Built for scalability, security, and performance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={scrollToLogin}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Get Started
                <ArrowRight className="inline ml-2 w-5 h-5" />
              </button>
              <Link
                href="/superadmin/login"
                className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-600 hover:text-white transition-all duration-300"
              >
                Superadmin Access
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tenant Login Section */}
      <section id="login-section" className="py-16 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Tenant Login
            </h2>
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Tenant Selector */}
              <div>
                <label htmlFor="tenant" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Tenant
                </label>
                <select
                  id="tenant"
                  value={loginForm.tenantSlug}
                  onChange={(e) => setLoginForm({ ...loginForm, tenantSlug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Choose a tenant...</option>
                  {sampleTenants.map((tenant) => (
                    <option key={tenant.slug} value={tenant.slug}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                  required
                />
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-300 transform hover:scale-105"
              >
                Login to Dashboard
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Demo Credentials:</h3>
              <div className="text-xs text-blue-800 space-y-1">
                <p><strong>TechCorp:</strong> admin@techcorp.com / AdminPass123</p>
                <p><strong>Global Retail:</strong> admin@globalretail.com / AdminPass123</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage your multi-tenant platform effectively
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
              >
                <div className={`${feature.color} mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Slider Section */}
      <section id="use-cases" className="py-16 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Use Cases
            </h2>
            <p className="text-xl text-gray-600">
              Perfect for various business scenarios
            </p>
          </div>

          <div className="relative">
            {/* Slider Container */}
            <div className="overflow-hidden rounded-xl">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {useCases.map((useCase, index) => (
                  <div key={index} className="w-full flex-shrink-0">
                    <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        <div>
                          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                            {useCase.title}
                          </h3>
                          <p className="text-lg text-gray-600 mb-6">
                            {useCase.description}
                          </p>
                          <ul className="space-y-2">
                            {useCase.features.map((feature, featureIndex) => (
                              <li key={featureIndex} className="flex items-center text-gray-700">
                                <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-8 text-white text-center">
                          <Building2 className="w-16 h-16 mx-auto mb-4" />
                          <h4 className="text-xl font-semibold mb-2">{useCase.title}</h4>
                          <p className="text-blue-100">Perfect Solution</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow"
              aria-label="Next slide"
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>

            {/* Play/Pause Button */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow"
              aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
            >
              {isPlaying ? <Pause className="w-5 h-5 text-gray-600" /> : <Play className="w-5 h-5 text-gray-600" />}
            </button>

            {/* Navigation Dots */}
            <div className="flex justify-center mt-6 space-x-2">
              {useCases.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentSlide ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-gray-600">
              Built for modern businesses with enterprise-grade features
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className={`${benefit.color} w-12 h-12 rounded-lg flex items-center justify-center text-white mb-4`}>
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-2">
              <Image
                src="/images/logo/logo-dark.svg"
                alt="Multi-Tenant Platform"
                width={150}
                height={40}
                className="h-8 w-auto mb-4"
              />
              <p className="text-gray-400 mb-4 max-w-md">
                The ultimate multi-tenant management platform for modern businesses. 
                Scalable, secure, and designed for performance.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Facebook">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Twitter">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="LinkedIn">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="GitHub">
                  <Github className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#use-cases" className="text-gray-400 hover:text-white transition-colors">Use Cases</a></li>
                <li><a href="#benefits" className="text-gray-400 hover:text-white transition-colors">Benefits</a></li>
                <li><Link href="/superadmin/login" className="text-gray-400 hover:text-white transition-colors">Superadmin</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-400">
                  <Mail className="w-4 h-4 mr-2" />
                  support@multitenant.com
                </li>
                <li className="flex items-center text-gray-400">
                  <Phone className="w-4 h-4 mr-2" />
                  +1 (555) 123-4567
                </li>
                <li className="flex items-center text-gray-400">
                  <MapPin className="w-4 h-4 mr-2" />
                  San Francisco, CA
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Multi-Tenant Management Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 