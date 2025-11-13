import React from 'react';

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
}

const colorClasses = {
  blue: {
    gradient: 'from-blue-500 to-blue-600',
    bg: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-600 dark:text-blue-400'
  },
  green: {
    gradient: 'from-green-500 to-green-600',
    bg: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-600 dark:text-green-400'
  },
  purple: {
    gradient: 'from-purple-500 to-purple-600',
    bg: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-600 dark:text-purple-400'
  },
  orange: {
    gradient: 'from-orange-500 to-orange-600',
    bg: 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20',
    border: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-600 dark:text-orange-400'
  },
  red: {
    gradient: 'from-red-500 to-red-600',
    bg: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-600 dark:text-red-400'
  },
  indigo: {
    gradient: 'from-indigo-500 to-indigo-600',
    bg: 'from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20',
    border: 'border-indigo-200 dark:border-indigo-800',
    text: 'text-indigo-600 dark:text-indigo-400'
  }
};

export default function AnalyticsCard({ title, value, icon, color, trend, subtitle }: AnalyticsCardProps) {
  const colors = colorClasses[color];

  return (
    <div className={`bg-gradient-to-br ${colors.bg} rounded-2xl p-6 border ${colors.border} hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center text-white shadow-lg`}>
          <i className={`fas ${icon} text-xl`}></i>
        </div>

        {trend && (
          <div className={`flex items-center space-x-1 text-sm font-medium ${
            trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            <i className={`fas fa-arrow-${trend.isPositive ? 'up' : 'down'}`}></i>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</h3>
        <p className={`text-3xl font-bold ${colors.text}`}>{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
