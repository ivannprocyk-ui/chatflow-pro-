import React from 'react';

interface HeatmapData {
  hour: number;
  day: string;
  value: number;
}

interface HeatmapProps {
  data: HeatmapData[];
}

export default function Heatmap({ data }: HeatmapProps) {
  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Find max value for color scaling
  const maxValue = Math.max(...data.map(d => d.value), 1);

  const getColor = (value: number) => {
    const intensity = value / maxValue;
    if (intensity === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (intensity < 0.2) return 'bg-blue-100 dark:bg-blue-900/30';
    if (intensity < 0.4) return 'bg-blue-200 dark:bg-blue-800/40';
    if (intensity < 0.6) return 'bg-blue-300 dark:bg-blue-700/50';
    if (intensity < 0.8) return 'bg-blue-400 dark:bg-blue-600/60';
    return 'bg-blue-500 dark:bg-blue-500/70';
  };

  const getValue = (hour: number, day: string) => {
    const cell = data.find(d => d.hour === hour && d.day === day);
    return cell?.value || 0;
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[800px] p-4">
        {/* Header with hour labels */}
        <div className="flex mb-2">
          <div className="w-12"></div>
          {hours.filter(h => h % 3 === 0).map(hour => (
            <div key={hour} className="flex-1 text-center text-xs text-gray-600 dark:text-gray-400">
              {hour}h
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="space-y-1">
          {days.map(day => (
            <div key={day} className="flex items-center">
              <div className="w-12 text-xs font-medium text-gray-700 dark:text-gray-300 text-right pr-2">
                {day}
              </div>
              <div className="flex-1 flex space-x-1">
                {hours.map(hour => {
                  const value = getValue(hour, day);
                  return (
                    <div
                      key={hour}
                      className={`flex-1 h-8 rounded ${getColor(value)} hover:ring-2 hover:ring-blue-400 cursor-pointer transition-all duration-200 hover:scale-110`}
                      title={`${day} ${hour}:00 - ${value} mensajes`}
                    >
                      {value > 0 && (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-medium text-white">
                          {value}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center space-x-4">
          <span className="text-xs text-gray-600 dark:text-gray-400">Menos</span>
          <div className="flex space-x-1">
            <div className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-800"></div>
            <div className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30"></div>
            <div className="w-6 h-6 rounded bg-blue-200 dark:bg-blue-800/40"></div>
            <div className="w-6 h-6 rounded bg-blue-300 dark:bg-blue-700/50"></div>
            <div className="w-6 h-6 rounded bg-blue-400 dark:bg-blue-600/60"></div>
            <div className="w-6 h-6 rounded bg-blue-500 dark:bg-blue-500/70"></div>
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Más</span>
        </div>
      </div>
    </div>
  );
}
