"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  variant?: "icon" | "switch" | "dropdown";
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = "icon",
  size = "md",
  className = "",
  showLabel = false,
}) => {
  const { theme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
  };

  const iconSizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  if (variant === "switch") {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        {showLabel && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {theme === "dark" ? "Dark Mode" : "Light Mode"}
          </span>
        )}
        <button
          onClick={toggleTheme}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full
            transition-colors duration-200 ease-in-out focus:outline-none
            focus:ring-2 focus:ring-brand-500 focus:ring-offset-2
            ${theme === "dark" 
              ? "bg-brand-500" 
              : "bg-gray-200 dark:bg-gray-600"
            }
          `}
          role="switch"
          aria-checked={theme === "dark"}
          aria-label="Toggle theme"
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out
              ${theme === "dark" ? "translate-x-6" : "translate-x-1"}
            `}
          >
            {theme === "dark" ? (
              <Moon className="h-3 w-3 text-brand-500 m-0.5" />
            ) : (
              <Sun className="h-3 w-3 text-gray-500 m-0.5" />
            )}
          </span>
        </button>
      </div>
    );
  }

  if (variant === "dropdown") {
    return (
      <div className={`relative ${className}`}>
        <select
          value={theme}
          onChange={(e) => {
            // Since we only have light/dark, this will toggle
            toggleTheme();
          }}
          className="
            appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600
            text-gray-900 dark:text-gray-100 px-3 py-2 pr-8 rounded-md text-sm
            focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500
            transition-colors duration-200
          "
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
          </svg>
        </div>
      </div>
    );
  }

  // Default icon variant
  return (
    <button
      onClick={toggleTheme}
      className={`
        inline-flex items-center justify-center rounded-md
        border border-gray-300 dark:border-gray-600
        bg-white dark:bg-gray-800
        text-gray-700 dark:text-gray-300
        hover:bg-gray-50 dark:hover:bg-gray-700
        focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2
        transition-all duration-200 ease-in-out
        ${sizeClasses[size]} ${className}
      `}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <Sun className={iconSizeClasses[size]} />
      ) : (
        <Moon className={iconSizeClasses[size]} />
      )}
      {showLabel && (
        <span className="ml-2 text-sm font-medium">
          {theme === "dark" ? "Light" : "Dark"}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;