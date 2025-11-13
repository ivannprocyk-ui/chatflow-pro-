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
    <div className="w-full h-[350px] flex flex-col justify-center items-center space-y-4 p-6">
      {data.map((stage, index) => {
        const width = (stage.value / maxValue) * 100;
        const dropoff = index > 0 ? data[index - 1].value - stage.value : 0;
        const dropoffRate = index > 0 ? Math.round((dropoff / data[index - 1].value) * 100) : 0;

        return (
          <div key={index} className="w-full flex flex-col items-center">
            <div
              className={`bg-gradient-to-r ${colors[index % colors.length]} rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer`}
              style={{ width: `${width}%`, minWidth: '200px' }}
            >
              <div className="p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm">{stage.name}</h4>
                    <p className="text-2xl font-bold">{stage.value.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-90">del total</p>
                    <p className="text-lg font-bold">{stage.percentage}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dropoff indicator */}
            {index > 0 && dropoff > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center space-x-2">
                <i className="fas fa-arrow-down text-red-500"></i>
                <span>-{dropoff.toLocaleString()} ({dropoffRate}% de abandono)</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
