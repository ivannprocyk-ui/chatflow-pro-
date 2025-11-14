import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Connection,
  useNodesState,
  useEdgesState,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  createAutomation,
  updateAutomation,
  getAutomationById,
  validateAutomation,
  Automation,
  AutomationNode,
  AutomationEdge,
  TriggerType,
  ActionType,
} from '../utils/automationStorage';
import {
  loadTemplates,
  loadTags,
  loadContactLists,
} from '../utils/storage';
import CustomNode from '../components/automation/CustomNode';

// NodeTypes fuera del componente para evitar re-renders
const nodeTypes: NodeTypes = {
  trigger: CustomNode,
  action: CustomNode,
  condition: CustomNode,
  delay: CustomNode,
};

interface FlowBuilderProps {
  onNavigate: (section: string) => void;
  automationId?: string | null;
}

const FlowBuilder: React.FC<FlowBuilderProps> = ({ onNavigate, automationId }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [automationName, setAutomationName] = useState('Nueva Automatización');
  const [automationDescription, setAutomationDescription] = useState('');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showNodeConfig, setShowNodeConfig] = useState(false);
  const nodeIdCounter = useRef(1);

  // Cargar datos para selectores
  const [templates, setTemplates] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [contactLists, setContactLists] = useState<any[]>([]);

  // Cargar datos al montar el componente
  useEffect(() => {
    setTemplates(loadTemplates());
    setTags(loadTags());
    setContactLists(loadContactLists());
  }, []);

  useEffect(() => {
    if (automationId) {
      // Cargar automatización existente
      const automation = getAutomationById(automationId);
      if (automation) {
        setAutomationName(automation.name);
        setAutomationDescription(automation.description);

        // Convertir los nodos al formato esperado por React Flow
        const loadedNodes = automation.nodes.map(node => ({
          ...node,
          data: { ...node.data },
        })) as Node[];

        setNodes(loadedNodes);
        setEdges(automation.edges as Edge[]);

        // Actualizar el contador para evitar IDs duplicados
        const maxId = automation.nodes.reduce((max, node) => {
          const idNum = parseInt(node.id.split('_')[1] || '0');
          return Math.max(max, idNum);
        }, 0);
        nodeIdCounter.current = maxId + 1;
      }
    } else {
      // Limpiar cuando no hay automationId (nueva automatización)
      setAutomationName('Nueva Automatización');
      setAutomationDescription('');
      setNodes([]);
      setEdges([]);
      nodeIdCounter.current = 1;
    }
  }, [automationId, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setShowNodeConfig(true);
  }, []);

  const addNode = (type: 'trigger' | 'action' | 'condition' | 'delay') => {
    const newNode: Node = {
      id: `${type}_${nodeIdCounter.current++}`,
      type,
      position: {
        x: Math.random() * 400 + 50,
        y: Math.random() * 400 + 50,
      },
      data: getDefaultNodeData(type),
    };

    setNodes((nds) => nds.concat(newNode));
  };

  const getDefaultNodeData = (type: string) => {
    switch (type) {
      case 'trigger':
        return {
          triggerType: 'new_contact' as TriggerType,
          config: {},
        };
      case 'action':
        return {
          actionType: 'send_message' as ActionType,
          config: {},
        };
      case 'condition':
        return {
          field: 'status',
          operator: 'equals',
          value: '',
        };
      case 'delay':
        return {
          delayType: 'days',
          delayAmount: 1,
        };
      default:
        return {};
    }
  };

  const updateNodeData = (nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...newData,
            },
          };
        }
        return node;
      })
    );
  };

  const deleteSelectedNode = () => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
      setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
      setSelectedNode(null);
      setShowNodeConfig(false);
    }
  };

  const handleSave = () => {
    const automation: Automation = {
      id: automationId || '',
      name: automationName,
      description: automationDescription,
      active: false,
      nodes: nodes as AutomationNode[],
      edges: edges as AutomationEdge[],
      createdAt: '',
      updatedAt: '',
      stats: {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
      },
    };

    const validation = validateAutomation(automation);
    if (!validation.valid) {
      alert(`Errores de validación:\n${validation.errors.join('\n')}`);
      return;
    }

    if (automationId) {
      updateAutomation(automationId, {
        name: automationName,
        description: automationDescription,
        nodes: nodes as AutomationNode[],
        edges: edges as AutomationEdge[],
      });
      alert('Automatización actualizada exitosamente');
    } else {
      createAutomation({
        name: automationName,
        description: automationDescription,
        active: false,
        nodes: nodes as AutomationNode[],
        edges: edges as AutomationEdge[],
      });
      alert('Automatización creada exitosamente');
    }

    onNavigate('automations');
  };

  const nodeColor = (node: Node): string => {
    switch (node.type) {
      case 'trigger':
        return '#10b981'; // green
      case 'action':
        return '#3b82f6'; // blue
      case 'condition':
        return '#f59e0b'; // orange
      case 'delay':
        return '#8b5cf6'; // purple
      default:
        return '#6b7280'; // gray
    }
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('automations')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <i className="fas fa-arrow-left text-gray-700 dark:text-gray-300"></i>
            </button>
            <div>
              <input
                type="text"
                value={automationName}
                onChange={(e) => setAutomationName(e.target.value)}
                className="text-xl font-bold bg-transparent border-none focus:outline-none text-gray-900 dark:text-white"
                placeholder="Nombre de la automatización"
              />
              <input
                type="text"
                value={automationDescription}
                onChange={(e) => setAutomationDescription(e.target.value)}
                className="text-sm bg-transparent border-none focus:outline-none text-gray-600 dark:text-gray-400 block w-full mt-1"
                placeholder="Descripción"
              />
            </div>
          </div>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center gap-2"
          >
            <i className="fas fa-save"></i>
            Guardar
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Node Palette */}
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-800 dark:text-blue-300">
              <i className="fas fa-info-circle mr-1"></i>
              <strong>Instrucciones:</strong>
              <br/>1. Añade nodos al canvas
              <br/>2. Conecta arrastrando desde el punto derecho al izquierdo
              <br/>3. Haz clic en un nodo para configurarlo
            </p>
          </div>

          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Añadir Nodo</h3>

          <div className="space-y-2">
            <button
              onClick={() => addNode('trigger')}
              className="w-full p-3 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors flex items-center gap-2"
            >
              <i className="fas fa-bolt"></i>
              Trigger
            </button>
            <button
              onClick={() => addNode('action')}
              className="w-full p-3 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors flex items-center gap-2"
            >
              <i className="fas fa-paper-plane"></i>
              Acción
            </button>
            <button
              onClick={() => addNode('condition')}
              className="w-full p-3 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/30 transition-colors flex items-center gap-2"
            >
              <i className="fas fa-code-branch"></i>
              Condición
            </button>
            <button
              onClick={() => addNode('delay')}
              className="w-full p-3 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/30 transition-colors flex items-center gap-2"
            >
              <i className="fas fa-clock"></i>
              Delay
            </button>
          </div>

          {selectedNode && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Nodo Seleccionado</h3>
              <button
                onClick={deleteSelectedNode}
                className="w-full p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2"
              >
                <i className="fas fa-trash"></i>
                Eliminar Nodo
              </button>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Estadísticas</h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <div>Nodos: {nodes.length}</div>
              <div>Conexiones: {edges.length}</div>
              <div>Triggers: {nodes.filter(n => n.type === 'trigger').length}</div>
              <div>Acciones: {nodes.filter(n => n.type === 'action').length}</div>
            </div>
          </div>
        </div>

        {/* Flow Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-50 dark:bg-gray-900"
          >
            <Background />
            <Controls />
            <MiniMap
              nodeColor={nodeColor}
              nodeStrokeWidth={3}
              zoomable
              pannable
            />
          </ReactFlow>
        </div>

        {/* Right Panel - Node Configuration */}
        {showNodeConfig && selectedNode ? (
          <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Configuración</h3>
              <button
                onClick={() => setShowNodeConfig(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <i className="fas fa-times text-gray-600 dark:text-gray-400"></i>
              </button>
            </div>

            {selectedNode.type === 'trigger' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo de Trigger
                  </label>
                  <select
                    value={selectedNode.data.triggerType}
                    onChange={(e) =>
                      updateNodeData(selectedNode.id, { triggerType: e.target.value as TriggerType })
                    }
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="new_contact">Nuevo Contacto</option>
                    <option value="contact_birthday">Cumpleaños</option>
                    <option value="contact_inactive">Contacto Inactivo</option>
                    <option value="contact_status_change">Cambio de Estado</option>
                    <option value="specific_date">Fecha Específica</option>
                    <option value="tag_added">Tag Agregado</option>
                    <option value="message_no_response">Sin Respuesta a Mensaje</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>

                {selectedNode.data.triggerType === 'contact_inactive' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Días de Inactividad
                    </label>
                    <input
                      type="number"
                      value={selectedNode.data.config.daysInactive || 7}
                      onChange={(e) =>
                        updateNodeData(selectedNode.id, {
                          config: { ...selectedNode.data.config, daysInactive: parseInt(e.target.value) },
                        })
                      }
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                )}

                {selectedNode.data.triggerType === 'message_no_response' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Horas sin Respuesta
                    </label>
                    <input
                      type="number"
                      value={selectedNode.data.config.hoursWithoutResponse || 24}
                      onChange={(e) =>
                        updateNodeData(selectedNode.id, {
                          config: { ...selectedNode.data.config, hoursWithoutResponse: parseInt(e.target.value) },
                        })
                      }
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      min="1"
                      max="168"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Tiempo que debe pasar sin respuesta del cliente antes de disparar esta automatización (1-168 horas)
                    </p>
                  </div>
                )}
              </div>
            )}

            {selectedNode.type === 'action' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo de Acción
                  </label>
                  <select
                    value={selectedNode.data.actionType}
                    onChange={(e) =>
                      updateNodeData(selectedNode.id, { actionType: e.target.value as ActionType })
                    }
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="send_message">📤 Enviar Mensaje - Envía un mensaje de WhatsApp al contacto</option>
                    <option value="add_tag">🏷️ Agregar Tag - Agrega una etiqueta al contacto</option>
                    <option value="remove_tag">🗑️ Remover Tag - Quita una etiqueta del contacto</option>
                    <option value="update_field">✏️ Actualizar Campo - Modifica un campo del contacto (nombre, email, etc)</option>
                    <option value="change_status">🔄 Cambiar Estado - Cambia el estado del contacto (lead, cliente, etc)</option>
                    <option value="add_to_list">📋 Agregar a Lista - Añade el contacto a una lista específica</option>
                    <option value="create_event">📅 Crear Evento - Crea un evento en el calendario para este contacto</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    💡 Selecciona qué acción quieres que se ejecute cuando el flujo llegue a este nodo
                  </p>
                </div>

                {selectedNode.data.actionType === 'send_message' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        <i className="fas fa-info-circle mr-1"></i>
                        <strong>Enviar Mensaje de WhatsApp</strong><br/>
                        Esta acción enviará un mensaje usando una plantilla aprobada de WhatsApp Business.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Plantilla de WhatsApp
                      </label>
                      <select
                        value={selectedNode.data.config.templateName || ''}
                        onChange={(e) =>
                          updateNodeData(selectedNode.id, {
                            config: { ...selectedNode.data.config, templateName: e.target.value },
                          })
                        }
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Selecciona una plantilla...</option>
                        {templates.filter(t => t.status === 'APPROVED').map((template) => (
                          <option key={template.name} value={template.name}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                      {templates.length === 0 && (
                        <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <p className="text-xs text-yellow-800 dark:text-yellow-300">
                            ⚠️ <strong>No hay plantillas sincronizadas.</strong><br/>
                            Para enviar mensajes de WhatsApp necesitas:
                            <br/>1. Ir a la sección "Plantillas"
                            <br/>2. Configurar tu API de WhatsApp Business
                            <br/>3. Sincronizar tus plantillas aprobadas
                            <br/>4. Volver aquí y seleccionar la plantilla
                          </p>
                        </div>
                      )}
                      {templates.length > 0 && templates.filter(t => t.status === 'APPROVED').length === 0 && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                          ⚠️ Tienes plantillas pero ninguna está aprobada. Solo puedes usar plantillas con estado "APPROVED".
                        </p>
                      )}
                    </div>

                    {/* Mostrar si la plantilla tiene imagen */}
                    {selectedNode.data.config.templateName && templates.find(t => t.name === selectedNode.data.config.templateName)?.components?.some((c: any) => c.type === 'HEADER' && c.format === 'IMAGE') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          URL de Imagen (opcional)
                        </label>
                        <input
                          type="url"
                          value={selectedNode.data.config.imageUrl || ''}
                          onChange={(e) =>
                            updateNodeData(selectedNode.id, {
                              config: { ...selectedNode.data.config, imageUrl: e.target.value },
                            })
                          }
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="https://ejemplo.com/imagen.jpg"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          La plantilla seleccionada requiere una imagen
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {selectedNode.data.actionType === 'change_status' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nuevo Estado
                    </label>
                    <input
                      type="text"
                      value={selectedNode.data.config.newStatus || ''}
                      onChange={(e) =>
                        updateNodeData(selectedNode.id, {
                          config: { ...selectedNode.data.config, newStatus: e.target.value },
                        })
                      }
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="ej: qualified, interested"
                    />
                  </div>
                )}

                {(selectedNode.data.actionType === 'add_tag' || selectedNode.data.actionType === 'remove_tag') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tag
                    </label>
                    <select
                      value={selectedNode.data.config.tagId || ''}
                      onChange={(e) =>
                        updateNodeData(selectedNode.id, {
                          config: { ...selectedNode.data.config, tagId: e.target.value },
                        })
                      }
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Selecciona un tag...</option>
                      {tags.map((tag) => (
                        <option key={tag.id} value={tag.id}>
                          {tag.name}
                        </option>
                      ))}
                    </select>
                    {tags.length === 0 && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                        ⚠️ No hay tags. Crea tags en la sección "CRM Panel"
                      </p>
                    )}
                  </div>
                )}

                {selectedNode.data.actionType === 'add_to_list' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Lista de Contactos
                    </label>
                    <select
                      value={selectedNode.data.config.listId || ''}
                      onChange={(e) =>
                        updateNodeData(selectedNode.id, {
                          config: { ...selectedNode.data.config, listId: e.target.value },
                        })
                      }
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Selecciona una lista...</option>
                      {contactLists.map((list) => (
                        <option key={list.id} value={list.id}>
                          {list.name} ({list.contacts.length} contactos)
                        </option>
                      ))}
                    </select>
                    {contactLists.length === 0 && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                        ⚠️ No hay listas. Crea listas en "Listas de Contactos"
                      </p>
                    )}
                  </div>
                )}

                {selectedNode.data.actionType === 'create_event' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Título del Evento
                      </label>
                      <input
                        type="text"
                        value={selectedNode.data.config.eventTitle || ''}
                        onChange={(e) =>
                          updateNodeData(selectedNode.id, {
                            config: { ...selectedNode.data.config, eventTitle: e.target.value },
                          })
                        }
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="ej: Llamada de seguimiento"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fecha del Evento
                      </label>
                      <input
                        type="datetime-local"
                        value={selectedNode.data.config.eventDate || ''}
                        onChange={(e) =>
                          updateNodeData(selectedNode.id, {
                            config: { ...selectedNode.data.config, eventDate: e.target.value },
                          })
                        }
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tipo de Evento
                      </label>
                      <select
                        value={selectedNode.data.config.eventType || 'other'}
                        onChange={(e) =>
                          updateNodeData(selectedNode.id, {
                            config: { ...selectedNode.data.config, eventType: e.target.value },
                          })
                        }
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="call">Llamada</option>
                        <option value="meeting">Reunión</option>
                        <option value="follow-up">Seguimiento</option>
                        <option value="reminder">Recordatorio</option>
                        <option value="other">Otro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Descripción (opcional)
                      </label>
                      <textarea
                        value={selectedNode.data.config.eventDescription || ''}
                        onChange={(e) =>
                          updateNodeData(selectedNode.id, {
                            config: { ...selectedNode.data.config, eventDescription: e.target.value },
                          })
                        }
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        rows={3}
                        placeholder="Detalles del evento..."
                      />
                    </div>
                  </div>
                )}

                {selectedNode.data.actionType === 'update_field' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nombre del Campo
                      </label>
                      <input
                        type="text"
                        value={selectedNode.data.config.fieldName || ''}
                        onChange={(e) =>
                          updateNodeData(selectedNode.id, {
                            config: { ...selectedNode.data.config, fieldName: e.target.value },
                          })
                        }
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="ej: email, phone, empresa"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nuevo Valor
                      </label>
                      <input
                        type="text"
                        value={selectedNode.data.config.fieldValue || ''}
                        onChange={(e) =>
                          updateNodeData(selectedNode.id, {
                            config: { ...selectedNode.data.config, fieldValue: e.target.value },
                          })
                        }
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Nuevo valor para el campo"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedNode.type === 'delay' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    value={selectedNode.data.delayAmount}
                    onChange={(e) =>
                      updateNodeData(selectedNode.id, { delayAmount: parseInt(e.target.value) })
                    }
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Unidad
                  </label>
                  <select
                    value={selectedNode.data.delayType}
                    onChange={(e) => updateNodeData(selectedNode.id, { delayType: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="hours">Horas</option>
                    <option value="days">Días</option>
                    <option value="weeks">Semanas</option>
                  </select>
                </div>
              </div>
            )}

            {selectedNode.type === 'condition' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Campo
                  </label>
                  <input
                    type="text"
                    value={selectedNode.data.field}
                    onChange={(e) => updateNodeData(selectedNode.id, { field: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="ej: status, name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Operador
                  </label>
                  <select
                    value={selectedNode.data.operator}
                    onChange={(e) => updateNodeData(selectedNode.id, { operator: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="equals">Igual a</option>
                    <option value="not_equals">Diferente de</option>
                    <option value="contains">Contiene</option>
                    <option value="not_contains">No contiene</option>
                    <option value="greater_than">Mayor que</option>
                    <option value="less_than">Menor que</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valor
                  </label>
                  <input
                    type="text"
                    value={selectedNode.data.value}
                    onChange={(e) => updateNodeData(selectedNode.id, { value: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Valor a comparar"
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-mouse-pointer text-2xl text-gray-400 dark:text-gray-500"></i>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Selecciona un nodo
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Haz clic en un nodo del canvas para ver y editar su configuración
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlowBuilder;
