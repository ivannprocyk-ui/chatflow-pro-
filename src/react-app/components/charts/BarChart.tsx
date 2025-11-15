import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BarChartProps {
  data: any[];
  bars: Array<{
    dataKey: string;
    fill: string;
    name: string;
  }>;
  xAxisKey?: string;
  layout?: 'horizontal' | 'vertical';
}

export default function BarChart({ data, bars, xAxisKey = 'name', layout = 'horizontal' }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <RechartsBarChart
        data={data}
        layout={layout}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
        {layout === 'horizontal' ? (
          <>
            <XAxis
              dataKey={xAxisKey}
              stroke="#6b7280"
              className="dark:stroke-gray-400"
              tick={{ fill: '#6b7280' }}
            />
            <YAxis
              stroke="#6b7280"
              className="dark:stroke-gray-400"
              tick={{ fill: '#6b7280' }}
            />
          </>
        ) : (
          <>
            <XAxis
              type="number"
              stroke="#6b7280"
              className="dark:stroke-gray-400"
              tick={{ fill: '#6b7280' }}
            />
            <YAxis
              dataKey={xAxisKey}
              type="category"
              stroke="#6b7280"
              className="dark:stroke-gray-400"
              tick={{ fill: '#6b7280' }}
            />
          </>
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Legend />
        {bars.map((bar, index) => (
          <Bar
            key={index}
            dataKey={bar.dataKey}
            fill={bar.fill}
            name={bar.name}
            radius={[8, 8, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
