import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import {
  getTriggerLabel,
  getActionLabel,
  TriggerNodeData,
  ActionNodeData,
  ConditionNodeData,
  DelayNodeData,
} from '../../utils/automationStorage';

interface CustomNodeData {
  triggerType?: string;
  actionType?: string;
  field?: string;
  operator?: string;
  value?: string;
  delayType?: string;
  delayAmount?: number;
  [key: string]: any;
}

const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({ data, type }) => {
  const getIcon = () => {
    switch (type) {
      case 'trigger':
        return 'fa-bolt';
      case 'action':
        return 'fa-paper-plane';
      case 'condition':
        return 'fa-code-branch';
      case 'delay':
        return 'fa-clock';
      default:
        return 'fa-circle';
    }
  };

  const getLabel = () => {
    switch (type) {
      case 'trigger':
        return data.triggerType ? getTriggerLabel(data.triggerType as any) : 'Trigger';
      case 'action':
        return data.actionType ? getActionLabel(data.actionType as any) : 'Acción';
      case 'condition':
        return data.field ? `${data.field} ${data.operator} ${data.value}` : 'Condición';
      case 'delay':
        return data.delayAmount ? `Esperar ${data.delayAmount} ${data.delayType}` : 'Delay';
      default:
        return 'Nodo';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'trigger':
        return 'border-green-500';
      case 'action':
        return 'border-blue-500';
      case 'condition':
        return 'border-orange-500';
      case 'delay':
        return 'border-purple-500';
      default:
        return 'border-gray-500';
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border-2 ${getColor()} p-4 min-w-[200px] shadow-lg hover:shadow-xl transition-shadow cursor-pointer`}>
      {/* Handle de entrada (excepto para trigger) */}
      {type !== 'trigger' && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 !bg-gray-400 dark:!bg-gray-500 border-2 border-white dark:border-gray-800"
        />
      )}

      <div className="flex items-center gap-2 mb-2">
        <i className={`fas ${getIcon()} ${
          type === 'trigger' ? 'text-green-600 dark:text-green-400' :
          type === 'action' ? 'text-blue-600 dark:text-blue-400' :
          type === 'condition' ? 'text-orange-600 dark:text-orange-400' :
          'text-purple-600 dark:text-purple-400'
        }`}></i>
        <span className="font-semibold text-sm text-gray-700 dark:text-gray-300 uppercase">
          {type}
        </span>
      </div>
      <div className="text-gray-900 dark:text-white font-medium text-sm">{getLabel()}</div>

      {/* Handle de salida */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-gray-400 dark:!bg-gray-500 border-2 border-white dark:border-gray-800"
      />
    </div>
  );
};

export default CustomNode;
