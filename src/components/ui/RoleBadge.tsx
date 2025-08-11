import React from 'react';

interface RoleBadgeProps {
  role: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline';
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'md', variant = 'default' }) => {
  // Role-specific colors
  const getRoleColors = (roleName: string) => {
    const roleColors: { [key: string]: { bg: string; text: string; border: string } } = {
      'Admin': {
        bg: 'bg-red-100 dark:bg-red-900/20',
        text: 'text-red-800 dark:text-red-200',
        border: 'border-red-200 dark:border-red-800'
      },
      'Tenant Admin': {
        bg: 'bg-purple-100 dark:bg-purple-900/20',
        text: 'text-purple-800 dark:text-purple-200',
        border: 'border-purple-200 dark:border-purple-800'
      },
      'Manager': {
        bg: 'bg-blue-100 dark:bg-blue-900/20',
        text: 'text-blue-800 dark:text-blue-200',
        border: 'border-blue-200 dark:border-blue-800'
      },
      'User': {
        bg: 'bg-green-100 dark:bg-green-900/20',
        text: 'text-green-800 dark:text-green-200',
        border: 'border-green-200 dark:border-green-800'
      },
      'Viewer': {
        bg: 'bg-gray-100 dark:bg-gray-900/20',
        text: 'text-gray-800 dark:text-gray-200',
        border: 'border-gray-200 dark:border-gray-800'
      }
    };



    return roleColors[roleName] || roleColors['User'];
  };

  const colors = getRoleColors(role);
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const baseClasses = `inline-flex items-center rounded-full font-medium ${sizeClasses[size]}`;
  const variantClasses = variant === 'outline' 
    ? `border ${colors.bg} ${colors.text} ${colors.border}`
    : `${colors.bg} ${colors.text}`;

  return (
    <span className={`${baseClasses} ${variantClasses}`}>
      {role}
    </span>
  );
};

export default RoleBadge; 