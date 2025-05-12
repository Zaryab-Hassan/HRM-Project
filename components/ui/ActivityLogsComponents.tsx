'use client';

import React, { ReactNode } from 'react';

// Title component
export const Title = ({ children }: { children: ReactNode }) => (
  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{children}</h2>
);

// Text component
export const Text = ({ children, className = '' }: { children: ReactNode, className?: string }) => (
  <p className={`text-gray-600 dark:text-gray-300 ${className}`}>{children}</p>
);

// Badge component
interface BadgeProps {
  children: ReactNode;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Badge = ({ children, color, size = 'md' }: BadgeProps) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  };

  const sizeClasses: Record<string, string> = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span className={`font-medium rounded-md ${colorClasses[color]} ${sizeClasses[size]}`}>
      {children}
    </span>
  );
};

// Card component
export const Card = ({ children, className = '' }: { children: ReactNode, className?: string }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
    {children}
  </div>
);

// Divider component
export const Divider = () => (
  <div className="h-px w-full bg-gray-200 dark:bg-gray-700 my-4"></div>
);

// Table component
export const Table = ({ children }: { children: ReactNode }) => (
  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
    {children}
  </table>
);

// TextInput component
interface TextInputProps {
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon?: React.FC<{ className?: string }>;
}

export const TextInput = ({ placeholder, value, onChange, icon: Icon }: TextInputProps) => (
  <div className="relative">
    {Icon && (
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
    )}
    <input
      type="text"
      className={`block w-full rounded-md border-0 py-2 ${
        Icon ? 'pl-10' : 'pl-4'
      } pr-4 text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 
      placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-pink-500 dark:bg-gray-700`}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  </div>
);

// Select component
interface SelectProps {
  children: ReactNode;
  placeholder?: string;
  value: string;
  onValueChange: (value: string) => void;
  icon?: React.FC<{ className?: string }>;
}

export const Select = ({ children, placeholder, value, onValueChange, icon: Icon }: SelectProps) => (
  <div className="relative">
    {Icon && (
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
    )}
    <select
      className={`block w-full rounded-md border-0 py-2 ${
        Icon ? 'pl-10' : 'pl-4'
      } pr-4 text-gray-900 ring-1 ring-inset ring-gray-300 dark:ring-gray-600
      focus:ring-2 focus:ring-inset focus:ring-pink-500 dark:bg-gray-700 dark:text-gray-100`}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {children}
    </select>
  </div>
);

// DateRangePicker component (simplified version)
interface DateRangePickerProps {
  value: [Date | null, Date | null];
  onValueChange: (value: [Date | null, Date | null]) => void;
  placeholder?: string;
  selectPlaceholder?: string;
  className?: string;
  color?: string;
}

export const DateRangePicker = ({
  value,
  onValueChange,
  placeholder = 'Select date range',
  className = '',
}: DateRangePickerProps) => {
  const formatDateString = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  return (
    <div className={`flex space-x-2 items-center ${className}`}>
      <input
        type="date"
        className="block w-full rounded-md border-0 py-2 px-4 text-gray-900 dark:text-gray-100 
          ring-1 ring-inset ring-gray-300 dark:ring-gray-600 dark:bg-gray-700
          focus:ring-2 focus:ring-inset focus:ring-pink-500"
        value={formatDateString(value[0])}
        onChange={(e) => {
          const startDate = e.target.value ? new Date(e.target.value) : null;
          onValueChange([startDate, value[1]]);
        }}
        placeholder={placeholder}
      />
      <span className="text-gray-500">to</span>
      <input
        type="date"
        className="block w-full rounded-md border-0 py-2 px-4 text-gray-900 dark:text-gray-100
          ring-1 ring-inset ring-gray-300 dark:ring-gray-600 dark:bg-gray-700
          focus:ring-2 focus:ring-inset focus:ring-pink-500"
        value={formatDateString(value[1])}
        onChange={(e) => {
          const endDate = e.target.value ? new Date(e.target.value) : null;
          onValueChange([value[0], endDate]);
        }}
        placeholder={placeholder}
      />
    </div>
  );
};
