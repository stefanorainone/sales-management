'use client';

import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[];
  error?: string;
  fullWidth?: boolean;
}

export function Select({
  options,
  error,
  fullWidth = true,
  className = '',
  children,
  ...props
}: SelectProps) {
  const baseStyles = `
    relative
    px-4 py-2.5
    text-sm font-medium
    bg-white
    border-2 border-gray-200
    rounded-xl
    text-gray-900
    appearance-none
    cursor-pointer
    transition-all duration-200
    hover:border-primary/50 hover:bg-gray-50
    focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary
    disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100
    ${error ? 'border-red-500 focus:ring-red-100 focus:border-red-500' : ''}
    ${fullWidth ? 'w-full' : ''}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={`relative ${fullWidth ? 'w-full' : 'inline-block'}`}>
      <select
        className={`${baseStyles} ${className} pr-10`}
        {...props}
      >
        {options ? (
          options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))
        ) : (
          children
        )}
      </select>

      {/* Dropdown Icon */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
