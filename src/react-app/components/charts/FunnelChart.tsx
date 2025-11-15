import React from 'react';

interface FunnelStage {
  name: string;
  value: number;
  percentage: number;
}

interface FunnelChartProps {
  data: FunnelStage[];
}

export default function FunnelChart({ data }: FunnelChartProps) {
  const maxValue = data[0]?.value || 1;

  const colors = [
    'from-blue-500 to-blue-600',
    'from-indigo-500 to-indigo-600',
    'from-purple-500 to-purple-600',
    'from-pink-500 to-pink-600'
  ];

  return (
    <div className="w-full flex flex-col justify-center items-center space-y-6 py-4">
      {data.map((stage, index) => {
        const width = (stage.value / maxValue) * 100;
        const dropoff = index > 0 ? data[index - 1].value - stage.value : 0;
        const dropoffRate = index > 0 ? Math.round((dropoff / data[index - 1].value) * 100) : 0;

        return (
          <div key={index} className="w-full flex flex-col items-center space-y-2">
            <div
              className={`bg-gradient-to-r ${colors[index % colors.length]} rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer`}
              style={{
                width: `${Math.max(width, 40)}%`,
                minWidth: '280px',
                maxWidth: '100%'
              }}
            >
              <div className="p-5 text-white">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm mb-1 truncate">{stage.name}</h4>
                    <p className="text-3xl font-bold">{stage.value.toLocaleString()}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs opacity-90 mb-1">del total</p>
                    <p className="text-2xl font-bold">{stage.percentage}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dropoff indicator */}
            {index > 0 && dropoff > 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-2 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg border border-red-200 dark:border-red-800">
                <i className="fas fa-arrow-down text-red-500"></i>
                <span className="font-medium">-{dropoff.toLocaleString()} <span className="text-xs">({dropoffRate}% de abandono)</span></span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
