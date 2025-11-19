import { useState, useEffect } from 'react';
import { Alert } from '../components/ui/Alert';
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// ==================== INTERFACES ====================

interface Cliente {
  id: string;
  nombre: string;
  email: string;
  empresa: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'paused' | 'trial' | 'cancelled';
  fecha_alta: Date;
  fecha_ultimo_pago?: Date;
  fecha_proximo_pago?: Date;
  precio_mensual: number;
  ciclo_facturacion: 'mensual' | 'anual';
  limite_mensajes: number;
  limite_tokens: number;
  limite_agentes: number;
  notas?: string;
  account_manager?: string;
  // Legacy fields for compatibility
  role?: 'admin' | 'user' | 'viewer';
  createdAt?: Date;
  startDate?: Date;
  endDate?: Date;
  botMessagesCount?: number;
  campaignsCount?: number;
  monthlyLimit?: number;
  usedMessages?: number;
  apiKey?: string;
}

interface Pago {
  id: string;
  cliente_id: string;
  monto: number;
  fecha: Date;
  fecha_vencimiento?: Date;
  estado: 'pagado' | 'pendiente' | 'vencido' | 'cancelado';
  metodo_pago: 'tarjeta' | 'transferencia' | 'paypal' | 'stripe' | 'otro';
  numero_factura: string;
  tipo: 'suscripcion' | 'one-time';
  // Campos fiscales
  es_fiscal?: boolean;
  subtotal?: number;
  iva_porcentaje?: number;
  iva_monto?: number;
  retenciones?: number;
  concepto?: string;
  items?: InvoiceItem[];
  notas?: string;
}

interface InvoiceItem {
  id: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

interface InvoiceTemplate {
  // Datos de la empresa
  empresa_nombre: string;
  empresa_logo?: string;
  empresa_direccion: string;
  empresa_ciudad: string;
  empresa_pais: string;
  empresa_telefono: string;
  empresa_email: string;
  empresa_website?: string;
  // Datos fiscales
  empresa_rfc?: string; // RFC/CUIT/NIT
  empresa_condicion_iva?: string;
  // Diseño
  color_primario: string;
  color_secundario: string;
  // Configuración
  iva_porcentaje_default: number;
  factura_fiscal_default: boolean;
  dias_vencimiento_default: number;
  // Términos
  terminos_condiciones?: string;
  nota_pie_pagina?: string;
}

interface Uso {
  id: string;
  cliente_id: string;
  fecha: Date;
  periodo: string; // "2024-11"
  mensajes_usados: number;
  tokens_input: number;
  tokens_output: number;
  agentes_activos: number;
  features_usadas: string[];
  costo_apis: number;
  costo_infraestructura: number;
}

interface MetricasMensuales {
  periodo: string; // "2024-11"
  mrr_total: number;
  mrr_nuevo: number;
  mrr_expansion: number;
  mrr_churn: number;
  arr: number;
  arpu: number;
  clientes_activos: number;
  churn_rate: number;
  ltv_promedio: number;
  cac: number;
  margen_ganancia: number;
}

interface AlertaCliente {
  id: string;
  nombre: string;
  tipo: 'fecha_pago' | 'consumo_mensajes' | 'consumo_tokens' | 'limite_agentes' | 'mrr_bajo' | 'custom';
  condicion: {
    tipo: 'menor_que' | 'mayor_que' | 'igual_a' | 'dias_restantes' | 'porcentaje_uso';
    valor: number;
    campo: string;
  };
  mensaje: string;
  severidad: 'info' | 'warning' | 'error';
  activo: boolean;
  aplicar_a: 'todos' | 'especificos';
  cliente_ids?: string[]; // If empty or aplicar_a='todos', applies to all
  created_at: Date;
}

type AdminSection = 'overview' | 'clientes' | 'ingresos' | 'costos' | 'uso-ia' | 'retencion' | 'facturacion' | 'alertas';

// ==================== DEMO DATA GENERATION ====================

const generateDemoClientes = (): Cliente[] => {
  const nombres = ['Juan Pérez', 'María García', 'Carlos López', 'Ana Martínez', 'Luis Rodríguez',
    'Carmen Sánchez', 'José Fernández', 'Laura González', 'Miguel Torres', 'Isabel Ramírez',
    'Francisco Díaz', 'Patricia Ruiz', 'Antonio Moreno', 'Rosa Jiménez', 'Manuel Álvarez',
    'Elena Castro', 'David Romero', 'Cristina Navarro', 'Pedro Vega', 'Silvia Molina',
    'Javier Ortiz', 'Lucía Delgado', 'Fernando Marín', 'Teresa Rubio', 'Alberto Serrano',
    'Beatriz Blanco', 'Raúl Suárez', 'Mónica Pascual', 'Ángel Herrera', 'Pilar Méndez'];

  const empresas = ['Tech Solutions SL', 'Marketing Digital Pro', 'Innovate Labs', 'Cloud Services Inc',
    'AI Consultants', 'DataVision Corp', 'Smart Business SA', 'Future Tech', 'Digital Growth',
    'Automation Hub', 'SaaS Factory', 'Growth Hacking Co', 'Customer Success Ltd', 'Sales AI',
    'ChatBot Masters', 'Messaging Solutions', 'WhatsApp Business Pro', 'Engagement Plus',
    'Communication Hub', 'Client Care 360', 'Retail Tech', 'E-commerce Boost', 'Lead Gen Pro',
    'Conversion Masters', 'Customer Journey Inc', 'Marketing Automation', 'CRM Solutions',
    'Business Intelligence SA', 'Analytics Pro', 'Revenue Growth'];

  const planes: Cliente['plan'][] = ['free', 'basic', 'pro', 'enterprise'];
  const estados: Cliente['status'][] = ['active', 'paused', 'trial', 'cancelled'];

  const clientes: Cliente[] = [];

  for (let i = 0; i < 30; i++) {
    const plan = planes[Math.floor(Math.random() * planes.length)];
    const status = estados[i < 20 ? 0 : Math.floor(Math.random() * estados.length)]; // Mayoría activos
    const mesesAtras = Math.floor(Math.random() * 12);
    const fecha_alta = new Date();
    fecha_alta.setMonth(fecha_alta.getMonth() - mesesAtras);

    const precios: Record<Cliente['plan'], number> = {
      free: 0,
      basic: 49,
      pro: 149,
      enterprise: 499
    };

    const limites_mensajes: Record<Cliente['plan'], number> = {
      free: 100,
      basic: 1000,
      pro: 5000,
      enterprise: 20000
    };

    const limites_tokens: Record<Cliente['plan'], number> = {
      free: 10000,
      basic: 100000,
      pro: 500000,
      enterprise: 2000000
    };

    clientes.push({
      id: `client-${i + 1}`,
      nombre: nombres[i],
      email: `${nombres[i].toLowerCase().replace(' ', '.')}@${empresas[i].toLowerCase().replace(/\s+/g, '')}.com`,
      empresa: empresas[i],
      plan,
      status,
      fecha_alta,
      fecha_ultimo_pago: status === 'active' || status === 'paused' ? new Date() : undefined,
      fecha_proximo_pago: status === 'active' ? (() => {
        const next = new Date();
        next.setMonth(next.getMonth() + 1);
        return next;
      })() : undefined,
      precio_mensual: precios[plan],
      ciclo_facturacion: Math.random() > 0.7 ? 'anual' : 'mensual',
      limite_mensajes: limites_mensajes[plan],
      limite_tokens: limites_tokens[plan],
      limite_agentes: plan === 'enterprise' ? 10 : plan === 'pro' ? 5 : plan === 'basic' ? 2 : 1,
      notas: i % 3 === 0 ? 'Cliente VIP - Alta prioridad' : undefined,
      account_manager: i % 2 === 0 ? 'Ana Manager' : 'Carlos Sales',
      // Legacy compatibility
      role: 'user',
      createdAt: fecha_alta,
      startDate: fecha_alta,
      monthlyLimit: limites_mensajes[plan],
      usedMessages: Math.floor(Math.random() * limites_mensajes[plan] * 0.8),
      botMessagesCount: Math.floor(Math.random() * 5000),
      campaignsCount: Math.floor(Math.random() * 20),
    });
  }

  return clientes;
};

const generateDemoPagos = (clientes: Cliente[]): Pago[] => {
  const pagos: Pago[] = [];
  let facturaNum = 1000;

  clientes.forEach(cliente => {
    if (cliente.status === 'cancelled' || cliente.plan === 'free') return;

    // Generar pagos históricos
    const mesesDesdeAlta = Math.floor((new Date().getTime() - cliente.fecha_alta.getTime()) / (1000 * 60 * 60 * 24 * 30));

    for (let i = 0; i <= mesesDesdeAlta; i++) {
      const fechaPago = new Date(cliente.fecha_alta);
      fechaPago.setMonth(fechaPago.getMonth() + i);

      pagos.push({
        id: `pago-${pagos.length + 1}`,
        cliente_id: cliente.id,
        monto: cliente.precio_mensual,
        fecha: fechaPago,
        estado: i === mesesDesdeAlta && Math.random() > 0.9 ? 'pendiente' : 'pagado',
        metodo_pago: ['tarjeta', 'stripe', 'paypal', 'transferencia'][Math.floor(Math.random() * 4)] as any,
        numero_factura: `INV-${facturaNum++}`,
        tipo: 'suscripcion',
      });
    }
  });

  return pagos;
};

const generateDemoUso = (clientes: Cliente[]): Uso[] => {
  const usos: Uso[] = [];

  clientes.forEach(cliente => {
    if (cliente.status === 'cancelled') return;

    // Generar uso para últimos 3 meses
    for (let i = 0; i < 3; i++) {
      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() - i);

      const periodo = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

      const mensajes_usados = Math.floor(Math.random() * cliente.limite_mensajes * 0.9);
      const tokens_input = mensajes_usados * Math.floor(Math.random() * 100 + 50);
      const tokens_output = mensajes_usados * Math.floor(Math.random() * 150 + 100);

      // Costos estimados (OpenAI pricing approximation)
      const costo_input = (tokens_input / 1000) * 0.0015;
      const costo_output = (tokens_output / 1000) * 0.002;

      usos.push({
        id: `uso-${usos.length + 1}`,
        cliente_id: cliente.id,
        fecha,
        periodo,
        mensajes_usados,
        tokens_input,
        tokens_output,
        agentes_activos: Math.floor(Math.random() * cliente.limite_agentes) + 1,
        features_usadas: ['WhatsApp Bot', 'Auto-response', 'Analytics', 'CRM Integration'].filter(() => Math.random() > 0.3),
        costo_apis: costo_input + costo_output,
        costo_infraestructura: Math.random() * 10 + 5,
      });
    }
  });

  return usos;
};

const generateDemoAlertas = (): AlertaCliente[] => {
  return [
    {
      id: 'alerta-1',
      nombre: 'Pago Próximo (7 días)',
      tipo: 'fecha_pago',
      condicion: {
        tipo: 'dias_restantes',
        valor: 7,
        campo: 'fecha_proximo_pago'
      },
      mensaje: '⚠️ Tu próximo pago vence en menos de 7 días. Por favor verifica que tu método de pago esté actualizado.',
      severidad: 'warning',
      activo: true,
      aplicar_a: 'todos',
      created_at: new Date('2024-01-15')
    },
    {
      id: 'alerta-2',
      nombre: 'Pago Urgente (3 días)',
      tipo: 'fecha_pago',
      condicion: {
        tipo: 'dias_restantes',
        valor: 3,
        campo: 'fecha_proximo_pago'
      },
      mensaje: '🚨 URGENTE: Tu pago vence en 3 días o menos. Actualiza tu información de pago para evitar la suspensión del servicio.',
      severidad: 'error',
      activo: true,
      aplicar_a: 'todos',
      created_at: new Date('2024-01-15')
    },
    {
      id: 'alerta-3',
      nombre: 'Consumo Alto de Mensajes (80%)',
      tipo: 'consumo_mensajes',
      condicion: {
        tipo: 'porcentaje_uso',
        valor: 80,
        campo: 'mensajes_usados'
      },
      mensaje: '📊 Has usado más del 80% de tu límite mensual de mensajes. Considera actualizar tu plan para evitar interrupciones.',
      severidad: 'warning',
      activo: true,
      aplicar_a: 'todos',
      created_at: new Date('2024-02-01')
    },
    {
      id: 'alerta-4',
      nombre: 'Límite de Mensajes Alcanzado',
      tipo: 'consumo_mensajes',
      condicion: {
        tipo: 'porcentaje_uso',
        valor: 95,
        campo: 'mensajes_usados'
      },
      mensaje: '🔴 CRÍTICO: Has alcanzado el 95% de tu límite de mensajes. Actualiza tu plan ahora para continuar usando el servicio.',
      severidad: 'error',
      activo: true,
      aplicar_a: 'todos',
      created_at: new Date('2024-02-01')
    },
    {
      id: 'alerta-5',
      nombre: 'Consumo Alto de Tokens (75%)',
      tipo: 'consumo_tokens',
      condicion: {
        tipo: 'porcentaje_uso',
        valor: 75,
        campo: 'tokens_usados'
      },
      mensaje: '⚡ Has consumido el 75% de tu límite mensual de tokens IA. Revisa tu uso para optimizar costos.',
      severidad: 'info',
      activo: true,
      aplicar_a: 'todos',
      created_at: new Date('2024-02-10')
    },
    {
      id: 'alerta-6',
      nombre: 'Límite de Agentes',
      tipo: 'limite_agentes',
      condicion: {
        tipo: 'mayor_que',
        valor: 90,
        campo: 'agentes_activos_porcentaje'
      },
      mensaje: '🤖 Estás cerca del límite de agentes activos. Considera actualizar tu plan para crear más agentes.',
      severidad: 'info',
      activo: true,
      aplicar_a: 'todos',
      created_at: new Date('2024-02-15')
    },
    {
      id: 'alerta-7',
      nombre: 'Clientes Plan Free - Upgrade',
      tipo: 'custom',
      condicion: {
        tipo: 'igual_a',
        valor: 0,
        campo: 'precio_mensual'
      },
      mensaje: '🎉 ¡Descubre todo el potencial de ChatFlow Pro! Actualiza a un plan de pago y accede a funciones premium.',
      severidad: 'info',
      activo: true,
      aplicar_a: 'todos',
      created_at: new Date('2024-03-01')
    }
  ];
};

const calculateMetricasMensuales = (clientes: Cliente[], pagos: Pago[], usos: Uso[]): MetricasMensuales[] => {
  const metricas: MetricasMensuales[] = [];

  for (let i = 0; i < 12; i++) {
    const fecha = new Date();
    fecha.setMonth(fecha.getMonth() - i);
    const periodo = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

    const clientesActivosMes = clientes.filter(c => {
      const altaMes = new Date(c.fecha_alta);
      return altaMes <= fecha && c.status === 'active';
    });

    const pagosMes = pagos.filter(p => {
      const mesPago = `${p.fecha.getFullYear()}-${String(p.fecha.getMonth() + 1).padStart(2, '0')}`;
      return mesPago === periodo && p.estado === 'pagado';
    });

    const usosMes = usos.filter(u => u.periodo === periodo);

    const mrr_total = pagosMes.reduce((sum, p) => sum + p.monto, 0);
    const totalCostosAPIs = usosMes.reduce((sum, u) => sum + u.costo_apis + u.costo_infraestructura, 0);

    metricas.push({
      periodo,
      mrr_total,
      mrr_nuevo: Math.floor(mrr_total * 0.15),
      mrr_expansion: Math.floor(mrr_total * 0.08),
      mrr_churn: Math.floor(mrr_total * 0.05),
      arr: mrr_total * 12,
      arpu: clientesActivosMes.length > 0 ? mrr_total / clientesActivosMes.length : 0,
      clientes_activos: clientesActivosMes.length,
      churn_rate: 3.5 + (Math.random() * 2),
      ltv_promedio: 2400 + (Math.random() * 1000),
      cac: 150 + (Math.random() * 100),
      margen_ganancia: ((mrr_total - totalCostosAPIs) / mrr_total) * 100 || 0,
    });
  }

  return metricas.reverse();
};

// ==================== MAIN COMPONENT ====================

export default function AdminPanel() {
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [usos, setUsos] = useState<Uso[]>([]);
  const [metricas, setMetricas] = useState<MetricasMensuales[]>([]);
  const [alertas, setAlertas] = useState<AlertaCliente[]>([]);
  const [alert, setAlert] = useState<{ type: 'success' | 'destructive' | 'warning' | 'info'; message: string } | null>(null);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState<Partial<Cliente>>({});
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAlertaModal, setShowAlertaModal] = useState(false);
  const [editingAlerta, setEditingAlerta] = useState<AlertaCliente | null>(null);
  const [alertaFormData, setAlertaFormData] = useState<Partial<AlertaCliente>>({});

  // Invoice/Factura Management
  const [showFacturaModal, setShowFacturaModal] = useState(false);
  const [editingFactura, setEditingFactura] = useState<Pago | null>(null);
  const [facturaFormData, setFacturaFormData] = useState<Partial<Pago>>({});
  const [showFacturaDetailModal, setShowFacturaDetailModal] = useState(false);
  const [selectedFactura, setSelectedFactura] = useState<Pago | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);

  // Invoice Template Configuration
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [invoiceTemplate, setInvoiceTemplate] = useState<InvoiceTemplate>({
    empresa_nombre: 'ChatFlow Pro',
    empresa_direccion: 'Av. Principal 123',
    empresa_ciudad: 'Buenos Aires',
    empresa_pais: 'Argentina',
    empresa_telefono: '+54 11 1234-5678',
    empresa_email: 'facturacion@chatflowpro.com',
    empresa_website: 'www.chatflowpro.com',
    empresa_rfc: 'XAXX010101000',
    empresa_condicion_iva: 'Responsable Inscripto',
    color_primario: '#3B82F6',
    color_secundario: '#1E40AF',
    iva_porcentaje_default: 21,
    factura_fiscal_default: true,
    dias_vencimiento_default: 30,
    terminos_condiciones: 'Pago dentro de los 30 días. Después de esta fecha se aplicarán intereses del 2% mensual.',
    nota_pie_pagina: 'Gracias por su preferencia',
  });

  // Client Selector Advanced
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [clientFilterPlan, setClientFilterPlan] = useState<string>('all');
  const [clientFilterStatus, setClientFilterStatus] = useState<string>('all');

  // Client filters and search
  const [clientSearch, setClientSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'nombre' | 'mrr' | 'fecha_alta' | 'uso'>('nombre');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    // Generate demo data on mount
    const clientesData = generateDemoClientes();
    const pagosData = generateDemoPagos(clientesData);
    const usosData = generateDemoUso(clientesData);
    const metricasData = calculateMetricasMensuales(clientesData, pagosData, usosData);
    const alertasData = generateDemoAlertas();

    setClientes(clientesData);
    setPagos(pagosData);
    setUsos(usosData);
    setMetricas(metricasData);
    setAlertas(alertasData);
  }, []);

  const showAlert = (type: 'success' | 'destructive' | 'warning' | 'info', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  // ==================== CRUD OPERATIONS ====================

  const openCreateModal = () => {
    setEditingCliente(null);
    setFormData({
      nombre: '',
      email: '',
      empresa: '',
      plan: 'basic',
      status: 'trial',
      precio_mensual: 49,
      ciclo_facturacion: 'mensual',
      limite_mensajes: 1000,
      limite_tokens: 100000,
      limite_agentes: 2,
      fecha_alta: new Date(),
    });
    setShowClienteModal(true);
  };

  const openEditModal = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData(cliente);
    setShowClienteModal(true);
  };

  const handleSaveCliente = () => {
    if (!formData.nombre || !formData.email || !formData.empresa) {
      showAlert('destructive', 'Nombre, email y empresa son obligatorios');
      return;
    }

    if (editingCliente) {
      setClientes(clientes.map(c => c.id === editingCliente.id ? { ...c, ...formData } as Cliente : c));
      showAlert('success', `Cliente ${formData.nombre} actualizado correctamente`);
    } else {
      const newCliente: Cliente = {
        ...formData,
        id: `client-${Date.now()}`,
        fecha_alta: new Date(),
        role: 'user',
        createdAt: new Date(),
        startDate: new Date(),
      } as Cliente;
      setClientes([...clientes, newCliente]);
      showAlert('success', `Cliente ${formData.nombre} creado correctamente`);
    }

    setShowClienteModal(false);
    setFormData({});
    setEditingCliente(null);
  };

  const handleDeleteCliente = (cliente: Cliente) => {
    if (window.confirm(`¿Estás seguro de eliminar a ${cliente.nombre}?`)) {
      setClientes(clientes.filter(c => c.id !== cliente.id));
      showAlert('success', `Cliente ${cliente.nombre} eliminado correctamente`);
    }
  };

  const handleToggleStatus = (clienteId: string, newStatus: Cliente['status']) => {
    setClientes(clientes.map(c =>
      c.id === clienteId ? { ...c, status: newStatus } : c
    ));
    showAlert('success', 'Estado del cliente actualizado');
  };

  // ==================== RENDER OVERVIEW ====================

  const renderOverview = () => {
    const currentMetric = metricas[metricas.length - 1];
    const previousMetric = metricas[metricas.length - 2];

    const mrrChange = previousMetric ? ((currentMetric.mrr_total - previousMetric.mrr_total) / previousMetric.mrr_total) * 100 : 0;
    const clientesActivos = clientes.filter(c => c.status === 'active').length;
    const totalMRR = clientes.filter(c => c.status === 'active').reduce((sum, c) => sum + c.precio_mensual, 0);
    const churnRate = currentMetric?.churn_rate || 0;

    // Calculate profit margin
    const totalCostos = usos.reduce((sum, u) => sum + u.costo_apis + u.costo_infraestructura, 0) / 3; // Average last 3 months
    const margen = ((totalMRR - totalCostos) / totalMRR) * 100;

    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                <i className="fas fa-dollar-sign text-xl"></i>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">MRR Actual</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">${totalMRR.toLocaleString()}</p>
            <p className="text-sm mt-2">
              <span className={`font-semibold ${mrrChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {mrrChange >= 0 ? '↑' : '↓'} {Math.abs(mrrChange).toFixed(1)}%
              </span>
              <span className="text-gray-500 dark:text-gray-400"> vs mes anterior</span>
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white">
                <i className="fas fa-users text-xl"></i>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Clientes Activos</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{clientesActivos}</p>
            <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">
              {clientes.filter(c => c.status === 'trial').length} en trial
            </p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-2xl p-6 border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white">
                <i className="fas fa-chart-line text-xl"></i>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Churn Rate</p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">{churnRate.toFixed(1)}%</p>
            <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">Últimos 30 días</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white">
                <i className="fas fa-percent text-xl"></i>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Margen de Ganancia</p>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{margen.toFixed(1)}%</p>
            <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">Promedio mensual</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* MRR Trend */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <i className="fas fa-chart-line text-blue-600 mr-2"></i>
              MRR Últimos 12 Meses
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={metricas}>
                <defs>
                  <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="periodo" stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                <Tooltip />
                <Area type="monotone" dataKey="mrr_total" stroke="#3b82f6" fillOpacity={1} fill="url(#colorMRR)" name="MRR" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Plan Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <i className="fas fa-chart-pie text-purple-600 mr-2"></i>
              Distribución de Planes
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Free', value: clientes.filter(c => c.plan === 'free').length, color: '#6b7280' },
                    { name: 'Basic', value: clientes.filter(c => c.plan === 'basic').length, color: '#10b981' },
                    { name: 'Pro', value: clientes.filter(c => c.plan === 'pro').length, color: '#3b82f6' },
                    { name: 'Enterprise', value: clientes.filter(c => c.plan === 'enterprise').length, color: '#8b5cf6' },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[
                    { name: 'Free', value: clientes.filter(c => c.plan === 'free').length, color: '#6b7280' },
                    { name: 'Basic', value: clientes.filter(c => c.plan === 'basic').length, color: '#10b981' },
                    { name: 'Pro', value: clientes.filter(c => c.plan === 'pro').length, color: '#3b82f6' },
                    { name: 'Enterprise', value: clientes.filter(c => c.plan === 'enterprise').length, color: '#8b5cf6' },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* MRR Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <i className="fas fa-layer-group text-green-600 mr-2"></i>
            Desglose de MRR
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart data={metricas.slice(-6)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="periodo" stroke="#6b7280" tick={{ fill: '#6b7280' }} />
              <YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="mrr_nuevo" stackId="a" fill="#10b981" name="Nuevo" />
              <Bar dataKey="mrr_expansion" stackId="a" fill="#3b82f6" name="Expansión" />
              <Bar dataKey="mrr_churn" stackId="a" fill="#ef4444" name="Churn" />
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Clients Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Clientes de Alto Valor
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">MRR</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {clientes
                  .filter(c => c.status === 'active')
                  .sort((a, b) => b.precio_mensual - a.precio_mensual)
                  .slice(0, 5)
                  .map(cliente => (
                    <tr key={cliente.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{cliente.nombre}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          cliente.plan === 'enterprise' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' :
                          cliente.plan === 'pro' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                          'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                        }`}>
                          {cliente.plan.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        ${cliente.precio_mensual}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                          Activo
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ==================== RENDER CLIENTES ====================

  const renderClientes = () => {
    // Filter and search logic
    let filteredClientes = clientes.filter(cliente => {
      // Search filter
      const searchLower = clientSearch.toLowerCase();
      const matchesSearch = !clientSearch ||
        cliente.nombre.toLowerCase().includes(searchLower) ||
        cliente.empresa.toLowerCase().includes(searchLower) ||
        cliente.email.toLowerCase().includes(searchLower);

      // Plan filter
      const matchesPlan = filterPlan === 'all' || cliente.plan === filterPlan;

      // Status filter
      const matchesStatus = filterStatus === 'all' || cliente.status === filterStatus;

      return matchesSearch && matchesPlan && matchesStatus;
    });

    // Sorting logic
    filteredClientes.sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case 'nombre':
          compareValue = a.nombre.localeCompare(b.nombre);
          break;
        case 'mrr':
          compareValue = a.precio_mensual - b.precio_mensual;
          break;
        case 'fecha_alta':
          compareValue = new Date(a.fecha_alta).getTime() - new Date(b.fecha_alta).getTime();
          break;
        case 'uso':
          const usageA = (a.usedMessages || 0) / (a.limite_mensajes || 1);
          const usageB = (b.usedMessages || 0) / (b.limite_mensajes || 1);
          compareValue = usageA - usageB;
          break;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Gestión CRM de Clientes ({filteredClientes.length}/{clientes.length})
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {clientes.filter(c => c.status === 'active').length} activos • {clientes.filter(c => c.status === 'trial').length} en trial
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const csv = [
                  ['Nombre', 'Email', 'Empresa', 'Plan', 'Estado', 'MRR', 'Fecha Alta'].join(','),
                  ...filteredClientes.map(c => [
                    c.nombre, c.email, c.empresa, c.plan, c.status,
                    c.precio_mensual, new Date(c.fecha_alta).toLocaleDateString()
                  ].join(','))
                ].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'clientes.csv';
                a.click();
              }}
              className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex items-center gap-2"
            >
              <i className="fas fa-download"></i>
              Exportar CSV
            </button>
            <button
              onClick={openCreateModal}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <i className="fas fa-plus"></i>
              Nuevo Cliente
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <i className="fas fa-search mr-2"></i>
                Buscar
              </label>
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Buscar por nombre, email, empresa..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Plan Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <i className="fas fa-layer-group mr-2"></i>
                Plan
              </label>
              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">Todos los Planes</option>
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <i className="fas fa-filter mr-2"></i>
                Estado
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">Todos los Estados</option>
                <option value="active">Activo</option>
                <option value="trial">Trial</option>
                <option value="paused">Pausado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <i className="fas fa-sort mr-2"></i>
                Ordenar por
              </label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [by, order] = e.target.value.split('-');
                  setSortBy(by as any);
                  setSortOrder(order as any);
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="nombre-asc">Nombre (A-Z)</option>
                <option value="nombre-desc">Nombre (Z-A)</option>
                <option value="mrr-desc">MRR (Mayor)</option>
                <option value="mrr-asc">MRR (Menor)</option>
                <option value="fecha_alta-desc">Más Recientes</option>
                <option value="fecha_alta-asc">Más Antiguos</option>
                <option value="uso-desc">Mayor Uso</option>
                <option value="uso-asc">Menor Uso</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {(clientSearch || filterPlan !== 'all' || filterStatus !== 'all') && (
            <div className="mt-4">
              <button
                onClick={() => {
                  setClientSearch('');
                  setFilterPlan('all');
                  setFilterStatus('all');
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                <i className="fas fa-times mr-1"></i>
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['active', 'trial', 'paused', 'cancelled'].map(status => {
            const count = clientes.filter(c => c.status === status).length;
            const filteredCount = filteredClientes.filter(c => c.status === status).length;
            const colors = {
              active: 'green',
              trial: 'blue',
              paused: 'yellow',
              cancelled: 'red'
            };
            const color = colors[status as keyof typeof colors];

            return (
              <div key={status} className={`bg-${color}-50 dark:bg-${color}-900/20 border border-${color}-200 dark:border-${color}-800 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-shadow`}
                onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}
              >
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{status.charAt(0).toUpperCase() + status.slice(1)}</p>
                <p className={`text-2xl font-bold text-${color}-600 dark:text-${color}-400`}>
                  {filterStatus === 'all' ? count : `${filteredCount}/${count}`}
                </p>
              </div>
            );
          })}
        </div>

        {/* Clients Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cliente</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Plan</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">MRR</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Próximo Pago</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Uso</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredClientes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <i className="fas fa-search text-4xl mb-4"></i>
                      <p className="text-lg font-medium">No se encontraron clientes</p>
                      <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                    </td>
                  </tr>
                ) : (
                  filteredClientes.map((cliente) => {
                    const usagePercent = (cliente.usedMessages || 0) / (cliente.monthlyLimit || 1) * 100;
                    const clientAlertas = evaluarAlertas(cliente);

                    return (
                      <tr key={cliente.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${clientAlertas.length > 0 ? 'bg-yellow-50/30 dark:bg-yellow-900/5' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold relative">
                              {cliente.nombre.charAt(0)}
                              {clientAlertas.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">
                                  {clientAlertas.length}
                                </span>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{cliente.nombre}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{cliente.empresa}</div>
                              {clientAlertas.length > 0 && (
                                <div className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                                  <i className="fas fa-exclamation-triangle"></i>
                                  {clientAlertas.length} alerta{clientAlertas.length > 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            cliente.plan === 'enterprise' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' :
                            cliente.plan === 'pro' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                            cliente.plan === 'basic' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {cliente.plan.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={cliente.status}
                            onChange={(e) => handleToggleStatus(cliente.id, e.target.value as Cliente['status'])}
                            className={`px-3 py-1 text-xs font-semibold rounded-full border-0 cursor-pointer ${
                              cliente.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                              cliente.status === 'trial' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                              cliente.status === 'paused' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                              'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                            }`}
                          >
                            <option value="active">Activo</option>
                            <option value="trial">Trial</option>
                            <option value="paused">Pausado</option>
                            <option value="cancelled">Cancelado</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                          ${cliente.precio_mensual}/mes
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {cliente.fecha_proximo_pago ? new Date(cliente.fecha_proximo_pago).toLocaleDateString('es-ES') : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <div className="text-xs text-gray-900 dark:text-gray-100">
                              {(cliente.usedMessages || 0).toLocaleString()} / {(cliente.monthlyLimit || 0).toLocaleString()}
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mt-1">
                              <div
                                className={`h-1.5 rounded-full ${
                                  usagePercent > 90 ? 'bg-red-500' :
                                  usagePercent > 70 ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(usagePercent, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedCliente(cliente);
                                setShowDetailModal(true);
                              }}
                              className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 p-2"
                              title="Ver detalle"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              onClick={() => openEditModal(cliente)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-2"
                              title="Editar"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              onClick={() => handleDeleteCliente(cliente)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-2"
                              title="Eliminar"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CRM Insights */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-800 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="fas fa-chart-line text-purple-600 dark:text-purple-400"></i>
            </div>
            <div>
              <h3 className="text-lg font-medium text-purple-900 dark:text-purple-100 mb-2">CRM Insights</h3>
              <div className="text-purple-800 dark:text-purple-200 text-sm space-y-1">
                <p>• <strong>{filteredClientes.length}</strong> clientes mostrados de <strong>{clientes.length}</strong> total</p>
                <p>• MRR Total: <strong>${clientes.filter(c => c.status === 'active').reduce((sum, c) => sum + c.precio_mensual, 0).toLocaleString()}</strong></p>
                <p>• Clientes con alertas activas: <strong>{clientes.filter(c => evaluarAlertas(c).length > 0).length}</strong></p>
                <p>• Puedes exportar la lista filtrada a CSV o editar el estado inline haciendo click en los dropdowns</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==================== RENDER INGRESOS ====================

  const renderIngresos = () => {
    const currentMetric = metricas[metricas.length - 1];
    const previousMetric = metricas[metricas.length - 2];

    const totalMRR = clientes.filter(c => c.status === 'active').reduce((sum, c) => sum + c.precio_mensual, 0);
    const totalARR = totalMRR * 12;
    const clientesActivos = clientes.filter(c => c.status === 'active').length;
    const arpu = clientesActivos > 0 ? totalMRR / clientesActivos : 0;

    const mrrChange = previousMetric ? ((currentMetric.mrr_total - previousMetric.mrr_total) / previousMetric.mrr_total) * 100 : 0;

    // Proyección próximos 3 meses
    const proyeccion = [
      { mes: 'Actual', mrr: totalMRR },
      { mes: 'Mes +1', mrr: Math.floor(totalMRR * 1.08) },
      { mes: 'Mes +2', mrr: Math.floor(totalMRR * 1.15) },
      { mes: 'Mes +3', mrr: Math.floor(totalMRR * 1.22) },
    ];

    // Ingresos por plan
    const ingresosPorPlan = [
      { plan: 'Free', ingresos: clientes.filter(c => c.plan === 'free' && c.status === 'active').reduce((s, c) => s + c.precio_mensual, 0), clientes: clientes.filter(c => c.plan === 'free' && c.status === 'active').length },
      { plan: 'Basic', ingresos: clientes.filter(c => c.plan === 'basic' && c.status === 'active').reduce((s, c) => s + c.precio_mensual, 0), clientes: clientes.filter(c => c.plan === 'basic' && c.status === 'active').length },
      { plan: 'Pro', ingresos: clientes.filter(c => c.plan === 'pro' && c.status === 'active').reduce((s, c) => s + c.precio_mensual, 0), clientes: clientes.filter(c => c.plan === 'pro' && c.status === 'active').length },
      { plan: 'Enterprise', ingresos: clientes.filter(c => c.plan === 'enterprise' && c.status === 'active').reduce((s, c) => s + c.precio_mensual, 0), clientes: clientes.filter(c => c.plan === 'enterprise' && c.status === 'active').length },
    ];

    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white">
                <i className="fas fa-dollar-sign text-xl"></i>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">MRR</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">${totalMRR.toLocaleString()}</p>
            <p className="text-sm mt-2">
              <span className={`font-semibold ${mrrChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {mrrChange >= 0 ? '↑' : '↓'} {Math.abs(mrrChange).toFixed(1)}%
              </span>
              <span className="text-gray-500 dark:text-gray-400"> vs mes anterior</span>
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                <i className="fas fa-chart-line text-xl"></i>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">ARR</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">${totalARR.toLocaleString()}</p>
            <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">Anual recurrente</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white">
                <i className="fas fa-user-circle text-xl"></i>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">ARPU</p>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">${arpu.toFixed(0)}</p>
            <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">Por usuario activo</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-2xl p-6 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center text-white">
                <i className="fas fa-trending-up text-xl"></i>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Revenue Growth</p>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{mrrChange.toFixed(1)}%</p>
            <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">Último mes</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* MRR/ARR Trend */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <i className="fas fa-chart-area text-green-600 mr-2"></i>
              MRR/ARR Últimos 12 Meses
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart data={metricas}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="periodo" stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="mrr_total" stroke="#10b981" strokeWidth={3} name="MRR" />
                <Line type="monotone" dataKey="arr" stroke="#3b82f6" strokeWidth={2} name="ARR" strokeDasharray="5 5" />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>

          {/* Ingresos por Plan */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <i className="fas fa-layer-group text-blue-600 mr-2"></i>
              Ingresos por Plan
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBarChart data={ingresosPorPlan}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="plan" stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="ingresos" fill="#10b981" name="Ingresos ($)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="clientes" fill="#3b82f6" name="Clientes (#)" radius={[8, 8, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Proyección */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <i className="fas fa-crystal-ball text-purple-600 mr-2"></i>
            Proyección de Ingresos (Próximos 3 Meses)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={proyeccion}>
              <defs>
                <linearGradient id="colorProyeccion" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="mes" stroke="#6b7280" tick={{ fill: '#6b7280' }} />
              <YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} />
              <Tooltip />
              <Area type="monotone" dataKey="mrr" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorProyeccion)" name="MRR Proyectado" />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">
            * Proyección basada en crecimiento histórico del 8% mensual
          </p>
        </div>

        {/* Top Revenue Clients */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Top 10 Clientes por Ingresos
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">MRR</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ARR</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ciclo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {clientes
                  .filter(c => c.status === 'active')
                  .sort((a, b) => b.precio_mensual - a.precio_mensual)
                  .slice(0, 10)
                  .map((cliente, idx) => (
                    <tr key={cliente.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{idx + 1}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{cliente.nombre}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          cliente.plan === 'enterprise' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' :
                          cliente.plan === 'pro' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                          'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                        }`}>
                          {cliente.plan.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-100">${cliente.precio_mensual}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">${cliente.precio_mensual * 12}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{cliente.ciclo_facturacion}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ==================== RENDER COSTOS ====================

  const renderCostos = () => {
    // Calcular costos totales
    const costosAPIs = usos.reduce((sum, u) => sum + u.costo_apis, 0);
    const costosInfra = usos.reduce((sum, u) => sum + u.costo_infraestructura, 0);
    const costosHerramientas = 150; // Fijo mensual estimado
    const costosTotal = costosAPIs + costosInfra + costosHerramientas;

    const totalMRR = clientes.filter(c => c.status === 'active').reduce((sum, c) => sum + c.precio_mensual, 0);
    const margenBruto = totalMRR - costosTotal;
    const margenPorcentaje = (margenBruto / totalMRR) * 100;
    const roi = ((margenBruto / costosTotal) * 100);

    // Desglose de costos
    const desgloseCostos = [
      { categoria: 'APIs (OpenAI/Claude)', costo: costosAPIs, porcentaje: (costosAPIs / costosTotal) * 100 },
      { categoria: 'Infraestructura', costo: costosInfra, porcentaje: (costosInfra / costosTotal) * 100 },
      { categoria: 'Herramientas', costo: costosHerramientas, porcentaje: (costosHerramientas / costosTotal) * 100 },
    ];

    // Ingresos vs Costos por mes
    const ingresosVsCostos = metricas.slice(-6).map((m, idx) => ({
      periodo: m.periodo,
      ingresos: m.mrr_total,
      costos: costosTotal / 6, // Distribuido
      margen: m.mrr_total - (costosTotal / 6),
    }));

    // Top clientes por margen
    const clientesConMargen = clientes
      .filter(c => c.status === 'active')
      .map(c => {
        const usosCliente = usos.filter(u => u.cliente_id === c.id);
        const costoCliente = usosCliente.reduce((sum, u) => sum + u.costo_apis + u.costo_infraestructura, 0) / 3;
        const margenCliente = c.precio_mensual - costoCliente;
        const margenPct = (margenCliente / c.precio_mensual) * 100;
        return { ...c, costoCliente, margenCliente, margenPct };
      })
      .sort((a, b) => b.margenCliente - a.margenCliente);

    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-2xl p-6 border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white">
                <i className="fas fa-money-bill-wave text-xl"></i>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Costos Totales</p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">${costosTotal.toFixed(0)}</p>
            <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">Mensual promedio</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white">
                <i className="fas fa-percentage text-xl"></i>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Margen Bruto</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{margenPorcentaje.toFixed(1)}%</p>
            <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">${margenBruto.toFixed(0)} neto</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                <i className="fas fa-chart-line text-xl"></i>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Ganancia Neta</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">${margenBruto.toFixed(0)}</p>
            <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">Mensual</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white">
                <i className="fas fa-trophy text-xl"></i>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">ROI</p>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{roi.toFixed(0)}%</p>
            <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">Retorno inversión</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Desglose de Costos */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <i className="fas fa-chart-pie text-red-600 mr-2"></i>
              Desglose de Costos
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={desgloseCostos}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ categoria, porcentaje }) => `${categoria}: ${porcentaje.toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="costo"
                >
                  <Cell fill="#ef4444" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#3b82f6" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Ingresos vs Costos */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <i className="fas fa-balance-scale text-green-600 mr-2"></i>
              Ingresos vs Costos
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart data={ingresosVsCostos}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="periodo" stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={3} name="Ingresos" />
                <Line type="monotone" dataKey="costos" stroke="#ef4444" strokeWidth={3} name="Costos" />
                <Line type="monotone" dataKey="margen" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" name="Margen" />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Desglose Detallado */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Desglose Detallado de Costos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {desgloseCostos.map((item, idx) => (
              <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.categoria}</h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{item.porcentaje.toFixed(1)}%</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${item.costo.toFixed(2)}</p>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-3">
                  <div
                    className={`h-2 rounded-full ${
                      idx === 0 ? 'bg-red-500' : idx === 1 ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${item.porcentaje}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Clientes por Margen */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Top 10 Clientes por Margen de Ganancia
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">MRR</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Costo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Margen $</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Margen %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {clientesConMargen.slice(0, 10).map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{cliente.nombre}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">${cliente.precio_mensual}</td>
                    <td className="px-6 py-4 text-sm text-red-600 dark:text-red-400">${cliente.costoCliente.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600 dark:text-green-400">${cliente.margenCliente.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${
                          cliente.margenPct > 80 ? 'text-green-600 dark:text-green-400' :
                          cliente.margenPct > 50 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {cliente.margenPct.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alertas de Costos */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-800 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="fas fa-exclamation-triangle text-yellow-600 dark:text-yellow-400"></i>
            </div>
            <div>
              <h3 className="text-lg font-medium text-yellow-900 dark:text-yellow-100 mb-2">Alertas de Costos</h3>
              <div className="text-yellow-800 dark:text-yellow-200 text-sm space-y-1">
                <p>• Costos de APIs representan el {((costosAPIs / costosTotal) * 100).toFixed(0)}% del total</p>
                <p>• {clientesConMargen.filter(c => c.margenPct < 50).length} clientes con margen inferior al 50%</p>
                <p>• Margen bruto actual: {margenPorcentaje.toFixed(1)}% (objetivo: &gt;70%)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==================== RENDER USO IA ====================

  const renderUsoIA = () => {
    // Cálculos de uso
    const totalMensajes = usos.reduce((sum, u) => sum + u.mensajes_usados, 0);
    const totalTokensInput = usos.reduce((sum, u) => sum + u.tokens_input, 0);
    const totalTokensOutput = usos.reduce((sum, u) => sum + u.tokens_output, 0);
    const totalTokens = totalTokensInput + totalTokensOutput;

    const agentesActivos = clientes.reduce((sum, c) => sum + (c.limite_agentes || 0), 0);
    const tasaAutomatizacion = 87.5; // Simulado
    const csatPromedio = 4.6; // Simulado

    // Uso por día (últimos 30 días)
    const usoPorDia = Array.from({ length: 30 }, (_, i) => {
      const dia = new Date();
      dia.setDate(dia.getDate() - (29 - i));
      return {
        dia: dia.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
        mensajes: Math.floor(Math.random() * 500 + 200),
        usuarios: Math.floor(Math.random() * 50 + 20),
      };
    });

    // Top 10 clientes por tokens
    const clientesPorTokens = clientes.map(c => {
      const usosCliente = usos.filter(u => u.cliente_id === c.id);
      const tokens = usosCliente.reduce((sum, u) => sum + u.tokens_input + u.tokens_output, 0);
      const mensajes = usosCliente.reduce((sum, u) => sum + u.mensajes_usados, 0);
      return { ...c, tokens, mensajes };
    }).sort((a, b) => b.tokens - a.tokens).slice(0, 10);

    // Tokens por día
    const tokensPorDia = usoPorDia.map(d => ({
      ...d,
      tokens: Math.floor(Math.random() * 50000 + 20000),
    }));

    // Features más usadas
    const featuresUsadas = [
      { feature: 'WhatsApp Bot', uso: 95, color: '#10b981' },
      { feature: 'Auto-response', uso: 87, color: '#3b82f6' },
      { feature: 'Analytics', uso: 76, color: '#8b5cf6' },
      { feature: 'CRM Integration', uso: 68, color: '#f59e0b' },
      { feature: 'Flow Builder', uso: 54, color: '#ef4444' },
    ];

    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white">
                <i className="fas fa-comments text-xl"></i>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Mensajes</p>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{totalMensajes.toLocaleString()}</p>
            <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">Últimos 3 meses</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                <i className="fas fa-database text-xl"></i>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Tokens</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{(totalTokens / 1000000).toFixed(1)}M</p>
            <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">{totalTokensInput.toLocaleString()} in / {totalTokensOutput.toLocaleString()} out</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white">
                <i className="fas fa-robot text-xl"></i>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tasa Automatización</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{tasaAutomatizacion}%</p>
            <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">Sin intervención humana</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-2xl p-6 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center text-white">
                <i className="fas fa-star text-xl"></i>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">CSAT Promedio</p>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{csatPromedio}/5</p>
            <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">Satisfacción del cliente</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Usuarios Activos Diarios */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <i className="fas fa-chart-line text-purple-600 mr-2"></i>
              Actividad Últimos 30 Días
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={usoPorDia}>
                <defs>
                  <linearGradient id="colorMensajes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="dia" stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="mensajes" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorMensajes)" name="Mensajes" />
                <Line type="monotone" dataKey="usuarios" stroke="#3b82f6" strokeWidth={2} name="Usuarios Activos" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Tokens Consumidos */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <i className="fas fa-server text-blue-600 mr-2"></i>
              Tokens Consumidos por Día
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={tokensPorDia}>
                <defs>
                  <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="dia" stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                <Tooltip />
                <Area type="monotone" dataKey="tokens" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTokens)" name="Tokens" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Clientes por Consumo */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Top 10 Clientes por Consumo de Tokens
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Mensajes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tokens</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Avg/Mensaje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {clientesPorTokens.map((cliente, idx) => (
                  <tr key={cliente.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{idx + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{cliente.nombre}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        cliente.plan === 'enterprise' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' :
                        cliente.plan === 'pro' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                        'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                      }`}>
                        {cliente.plan.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{cliente.mensajes.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-blue-600 dark:text-blue-400">{cliente.tokens.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{cliente.mensajes > 0 ? (cliente.tokens / cliente.mensajes).toFixed(0) : 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Features Más Usadas */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Features Más Utilizadas
          </h3>
          <div className="space-y-4">
            {featuresUsadas.map((feature, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{feature.feature}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{feature.uso}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all"
                    style={{ width: `${feature.uso}%`, backgroundColor: feature.color }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ==================== RENDER RETENCION ====================

  const renderRetencion = () => {
    const currentMetric = metricas[metricas.length - 1];
    const churnRate = currentMetric?.churn_rate || 0;
    const ltvPromedio = currentMetric?.ltv_promedio || 0;
    const cacPromedio = currentMetric?.cac || 0;
    const ltvCacRatio = ltvPromedio / cacPromedio;
    const retentionRate = 100 - churnRate;

    // Churn mensual últimos 12 meses
    const churnMensual = metricas.map(m => ({
      periodo: m.periodo,
      churn: m.churn_rate,
      retention: 100 - m.churn_rate,
    }));

    // LTV en el tiempo
    const ltvTrend = metricas.map(m => ({
      periodo: m.periodo,
      ltv: m.ltv_promedio,
      cac: m.cac,
    }));

    // Clientes cancelados recientemente
    const clientesCancelados = clientes
      .filter(c => c.status === 'cancelled')
      .sort((a, b) => new Date(b.fecha_alta).getTime() - new Date(a.fecha_alta).getTime())
      .slice(0, 10)
      .map(c => ({
        ...c,
        razon: ['Precio alto', 'Falta de features', 'Migró a competencia', 'Cerró negocio', 'Baja utilización'][Math.floor(Math.random() * 5)],
        tiempoVida: Math.floor((new Date().getTime() - new Date(c.fecha_alta).getTime()) / (1000 * 60 * 60 * 24 * 30)),
      }));

    // Cohort Analysis (simulado)
    const cohorts = Array.from({ length: 6 }, (_, i) => {
      const mes = new Date();
      mes.setMonth(mes.getMonth() - (5 - i));
      const mesNombre = mes.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });

      return {
        mes: mesNombre,
        mes0: 100,
        mes1: 92,
        mes2: 87,
        mes3: 83,
        mes4: 80,
        mes5: 78,
      };
    });

    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-2xl p-6 border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white">
                <i className="fas fa-user-times text-xl"></i>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Churn Rate</p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">{churnRate.toFixed(1)}%</p>
            <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">Mensual</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white">
                <i className="fas fa-heart text-xl"></i>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Retention Rate</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{retentionRate.toFixed(1)}%</p>
            <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">Clientes retenidos</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                <i className="fas fa-gem text-xl"></i>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">LTV Promedio</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">${ltvPromedio.toFixed(0)}</p>
            <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">Lifetime Value</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white">
                <i className="fas fa-balance-scale text-xl"></i>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">LTV:CAC Ratio</p>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{ltvCacRatio.toFixed(1)}:1</p>
            <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">CAC: ${cacPromedio.toFixed(0)}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Churn Mensual */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <i className="fas fa-chart-bar text-red-600 mr-2"></i>
              Churn Mensual (Últimos 12 Meses)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBarChart data={churnMensual}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="periodo" stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="churn" fill="#ef4444" name="Churn Rate %" radius={[8, 8, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>

          {/* LTV Trend */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <i className="fas fa-chart-line text-blue-600 mr-2"></i>
              LTV Promedio en el Tiempo
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart data={ltvTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="periodo" stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ltv" stroke="#3b82f6" strokeWidth={3} name="LTV ($)" />
                <Line type="monotone" dataKey="cac" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" name="CAC ($)" />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cohort Analysis */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Análisis de Cohortes - Retención por Mes
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cohorte</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Mes 0</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Mes 1</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Mes 2</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Mes 3</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Mes 4</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Mes 5</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {cohorts.map((cohort, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{cohort.mes}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 rounded text-xs font-semibold">{cohort.mes0}%</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 rounded text-xs font-semibold">{cohort.mes1}%</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 rounded text-xs font-semibold">{cohort.mes2}%</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 rounded text-xs font-semibold">{cohort.mes3}%</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300 rounded text-xs font-semibold">{cohort.mes4}%</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300 rounded text-xs font-semibold">{cohort.mes5}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            * Porcentaje de clientes que permanecen activos desde el mes de registro
          </p>
        </div>

        {/* Clientes Cancelados */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Clientes Cancelados Recientemente
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tiempo de Vida</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">MRR Perdido</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Razón</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {clientesCancelados.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{cliente.nombre}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        cliente.plan === 'enterprise' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' :
                        cliente.plan === 'pro' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                        'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                      }`}>
                        {cliente.plan.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{cliente.tiempoVida} meses</td>
                    <td className="px-6 py-4 text-sm font-semibold text-red-600 dark:text-red-400">-${cliente.precio_mensual}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{cliente.razon}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Insights */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="fas fa-lightbulb text-blue-600 dark:text-blue-400"></i>
            </div>
            <div>
              <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">Insights de Retención</h3>
              <div className="text-blue-800 dark:text-blue-200 text-sm space-y-1">
                <p>• LTV:CAC ratio de {ltvCacRatio.toFixed(1)}:1 {ltvCacRatio >= 3 ? '(Excelente)' : ltvCacRatio >= 2 ? '(Bueno)' : '(Mejorar)'}</p>
                <p>• Retención del {retentionRate.toFixed(1)}% - {retentionRate >= 95 ? 'Por encima del benchmark' : 'Oportunidad de mejora'}</p>
                <p>• {clientesCancelados.length} cancelaciones recientes - Principales razones: Precio, Features</p>
                <p>• Promedio tiempo de vida: {(clientesCancelados.reduce((s, c) => s + c.tiempoVida, 0) / clientesCancelados.length).toFixed(1)} meses</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==================== RENDER FACTURACION ====================

  const renderFacturacion = () => {
    // Próximos pagos (próximos 30 días)
    const proximosPagos = clientes
      .filter(c => c.status === 'active' && c.fecha_proximo_pago)
      .map(c => ({
        ...c,
        diasRestantes: Math.ceil((new Date(c.fecha_proximo_pago!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
      }))
      .filter(c => c.diasRestantes <= 30 && c.diasRestantes >= 0)
      .sort((a, b) => a.diasRestantes - b.diasRestantes);

    const totalProximosPagos = proximosPagos.reduce((sum, c) => sum + c.precio_mensual, 0);

    // Facturas pendientes/vencidas
    const facturasPendientes = pagos
      .filter(p => p.estado === 'pendiente')
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    const totalPendiente = facturasPendientes.reduce((sum, p) => sum + p.monto, 0);

    // Pagos recibidos por mes
    const pagosPorMes = metricas.slice(-6).map(m => ({
      periodo: m.periodo,
      pagos: m.mrr_total,
    }));

    // Métodos de pago
    const metodosPago = [
      { metodo: 'Stripe', cantidad: pagos.filter(p => p.metodo_pago === 'stripe').length, porcentaje: 45 },
      { metodo: 'Tarjeta', cantidad: pagos.filter(p => p.metodo_pago === 'tarjeta').length, porcentaje: 30 },
      { metodo: 'PayPal', cantidad: pagos.filter(p => p.metodo_pago === 'paypal').length, porcentaje: 15 },
      { metodo: 'Transferencia', cantidad: pagos.filter(p => p.metodo_pago === 'transferencia').length, porcentaje: 10 },
    ];

    // AR Balance
    const arBalance = totalPendiente;
    const pagosMesActual = pagos.filter(p => {
      const mesPago = `${p.fecha.getFullYear()}-${String(p.fecha.getMonth() + 1).padStart(2, '0')}`;
      const mesActual = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      return mesPago === mesActual && p.estado === 'pagado';
    }).reduce((sum, p) => sum + p.monto, 0);

    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white">
                <i className="fas fa-calendar-check text-xl"></i>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Próximos Pagos (30d)</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">${totalProximosPagos.toLocaleString()}</p>
            <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">{proximosPagos.length} facturas</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-2xl p-6 border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white">
                <i className="fas fa-exclamation-triangle text-xl"></i>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Facturas Pendientes</p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">${totalPendiente.toLocaleString()}</p>
            <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">{facturasPendientes.length} facturas</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                <i className="fas fa-money-check-alt text-xl"></i>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pagos Mes Actual</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">${pagosMesActual.toLocaleString()}</p>
            <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">Recibidos</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-2xl p-6 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center text-white">
                <i className="fas fa-file-invoice-dollar text-xl"></i>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">AR Balance</p>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">${arBalance.toLocaleString()}</p>
            <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">Cuentas por cobrar</p>
          </div>
        </div>

        {/* Próximos Pagos */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Próximos Pagos (30 días)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Monto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha Pago</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Días Restantes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {proximosPagos.slice(0, 15).map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{cliente.nombre}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        cliente.plan === 'enterprise' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' :
                        cliente.plan === 'pro' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                        'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                      }`}>
                        {cliente.plan.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-100">${cliente.precio_mensual}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {cliente.fecha_proximo_pago ? new Date(cliente.fecha_proximo_pago).toLocaleDateString('es-ES') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        cliente.diasRestantes <= 7 ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                        cliente.diasRestantes <= 15 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                        'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                      }`}>
                        {cliente.diasRestantes} días
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                        Pendiente
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pagos Recibidos */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <i className="fas fa-chart-bar text-green-600 mr-2"></i>
              Pagos Recibidos por Mes
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBarChart data={pagosPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="periodo" stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                <Tooltip />
                <Bar dataKey="pagos" fill="#10b981" name="Pagos ($)" radius={[8, 8, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>

          {/* Métodos de Pago */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <i className="fas fa-credit-card text-blue-600 mr-2"></i>
              Métodos de Pago Más Usados
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metodosPago}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ metodo, porcentaje }) => `${metodo}: ${porcentaje}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="porcentaje"
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#8b5cf6" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Facturas Pendientes/Vencidas */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <i className="fas fa-file-invoice text-blue-600 mr-2"></i>
              Todas las Facturas ({pagos.length})
            </h3>
            <button
              onClick={openCreateFactura}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <i className="fas fa-plus"></i>
              Crear Factura
            </button>
          </div>

          {pagos.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nº Factura</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Monto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Método</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {pagos.slice(0, 20).map((pago) => {
                    const cliente = clientes.find(c => c.id === pago.cliente_id);
                    return (
                      <tr key={pago.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-400">{pago.numero_factura}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{cliente?.nombre || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-100">${pago.monto}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(pago.fecha).toLocaleDateString('es-ES')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 capitalize">{pago.metodo_pago}</td>
                        <td className="px-6 py-4">
                          <select
                            value={pago.estado}
                            onChange={(e) => updatePaymentStatus(pago.id, e.target.value as Pago['estado'])}
                            className={`px-3 py-1 text-xs font-semibold rounded-full border-0 cursor-pointer ${
                              pago.estado === 'pagado' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                              pago.estado === 'vencido' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                              pago.estado === 'cancelado' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300' :
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                            }`}
                          >
                            <option value="pendiente">Pendiente</option>
                            <option value="pagado">Pagado</option>
                            <option value="vencido">Vencido</option>
                            <option value="cancelado">Cancelado</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => viewFacturaDetails(pago)}
                              className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Ver detalles"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              onClick={() => openEditFactura(pago)}
                              className="px-2 py-1 text-xs font-medium text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                              title="Editar"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              onClick={() => generateFacturaPDF(pago)}
                              className="px-2 py-1 text-xs font-medium text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                              title="Descargar PDF"
                            >
                              <i className="fas fa-file-pdf"></i>
                            </button>
                            <button
                              onClick={() => sendFacturaEmail(pago)}
                              className="px-2 py-1 text-xs font-medium text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300"
                              title="Enviar por email"
                            >
                              <i className="fas fa-envelope"></i>
                            </button>
                            <button
                              onClick={() => handleDuplicateFactura(pago)}
                              className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                              title="Duplicar"
                            >
                              <i className="fas fa-copy"></i>
                            </button>
                            <button
                              onClick={() => handleDeleteFactura(pago.id)}
                              className="px-2 py-1 text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              title="Eliminar"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="fas fa-chart-pie text-green-600 dark:text-green-400"></i>
              </div>
              <div>
                <h3 className="text-lg font-medium text-green-900 dark:text-green-100 mb-2">Resumen de Facturación</h3>
                <div className="text-green-800 dark:text-green-200 text-sm space-y-1">
                  <p>• Próximos 30 días: ${totalProximosPagos.toLocaleString()} en {proximosPagos.length} pagos esperados</p>
                  <p>• Facturas pendientes: ${totalPendiente.toLocaleString()} en {facturasPendientes.length} facturas</p>
                  <p>• Pagos este mes: ${pagosMesActual.toLocaleString()} recibidos</p>
                  <p>• Método más usado: Stripe ({metodosPago[0].porcentaje}% de transacciones)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="fas fa-info-circle text-blue-600 dark:text-blue-400"></i>
              </div>
              <div>
                <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">Origen de Datos de Facturación</h3>
                <div className="text-blue-800 dark:text-blue-200 text-sm space-y-1">
                  <p>• <strong>Pagos:</strong> Generados automáticamente desde la función generateDemoPagos()</p>
                  <p>• <strong>Facturas:</strong> Se crean al momento del alta del cliente y mensualmente según ciclo</p>
                  <p>• <strong>Estado:</strong> Editable directamente desde esta tabla (pendiente → pagado)</p>
                  <p>• <strong>Integración futura:</strong> Conectar con Stripe/PayPal para sincronización automática</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==================== ALERTAS MODULE ====================

  const openCreateAlertaModal = () => {
    setEditingAlerta(null);
    setAlertaFormData({
      nombre: '',
      tipo: 'fecha_pago',
      condicion: {
        tipo: 'dias_restantes',
        valor: 7,
        campo: 'fecha_proximo_pago'
      },
      mensaje: '',
      severidad: 'warning',
      activo: true,
      aplicar_a: 'todos',
      created_at: new Date(),
    });
    setShowAlertaModal(true);
  };

  const openEditAlertaModal = (alerta: AlertaCliente) => {
    setEditingAlerta(alerta);
    setAlertaFormData(alerta);
    setShowAlertaModal(true);
  };

  const saveAlerta = () => {
    if (!alertaFormData.nombre || !alertaFormData.mensaje) {
      showAlert('destructive', 'Por favor completa todos los campos requeridos');
      return;
    }

    if (editingAlerta) {
      // Update existing alerta
      setAlertas(alertas.map(a => a.id === editingAlerta.id ? { ...alertaFormData as AlertaCliente, id: editingAlerta.id } : a));
      showAlert('success', 'Alerta actualizada correctamente');
    } else {
      // Create new alerta
      const newAlerta: AlertaCliente = {
        ...alertaFormData as AlertaCliente,
        id: `alerta-${alertas.length + 1}`,
      };
      setAlertas([...alertas, newAlerta]);
      showAlert('success', 'Alerta creada correctamente');
    }
    setShowAlertaModal(false);
  };

  const deleteAlerta = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta alerta?')) {
      setAlertas(alertas.filter(a => a.id !== id));
      showAlert('success', 'Alerta eliminada correctamente');
    }
  };

  const toggleAlertaActiva = (id: string) => {
    setAlertas(alertas.map(a => a.id === id ? { ...a, activo: !a.activo } : a));
    const alerta = alertas.find(a => a.id === id);
    showAlert('success', `Alerta ${alerta?.activo ? 'desactivada' : 'activada'} correctamente`);
  };

  // ==================== PAYMENT STATUS UPDATE ====================

  const updatePaymentStatus = (pagoId: string, nuevoEstado: Pago['estado']) => {
    setPagos(pagos.map(p => p.id === pagoId ? { ...p, estado: nuevoEstado } : p));
    showAlert('success', `Pago actualizado a "${nuevoEstado}" correctamente`);
  };

  // ==================== FUNCIONES DE GESTIÓN DE FACTURAS ====================

  // Filtrar clientes para selector avanzado
  const getFilteredClients = () => {
    return clientes.filter(cliente => {
      const matchesSearch = !clientSearchTerm ||
        cliente.nombre.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
        cliente.email.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
        cliente.empresa.toLowerCase().includes(clientSearchTerm.toLowerCase());

      const matchesPlan = clientFilterPlan === 'all' || cliente.plan === clientFilterPlan;
      const matchesStatus = clientFilterStatus === 'all' || cliente.status === clientFilterStatus;

      return matchesSearch && matchesPlan && matchesStatus;
    });
  };

  // Calcular totales de factura con IVA
  const calculateInvoiceTotals = (subtotal: number, esFiscal: boolean, ivaPorcentaje: number) => {
    const iva = esFiscal ? (subtotal * ivaPorcentaje) / 100 : 0;
    const total = subtotal + iva;
    return { subtotal, iva, total };
  };

  const openCreateFactura = () => {
    setEditingFactura(null);
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + invoiceTemplate.dias_vencimiento_default);

    setFacturaFormData({
      fecha: new Date(),
      fecha_vencimiento: fechaVencimiento,
      estado: 'pendiente',
      metodo_pago: 'stripe',
      tipo: 'suscripcion',
      es_fiscal: invoiceTemplate.factura_fiscal_default,
      iva_porcentaje: invoiceTemplate.iva_porcentaje_default,
      concepto: 'Servicio de ChatFlow Pro',
    });
    setInvoiceItems([{
      id: `item-${Date.now()}`,
      descripcion: 'Servicio ChatFlow Pro - Plan Mensual',
      cantidad: 1,
      precio_unitario: 0,
      subtotal: 0,
    }]);
    setClientSearchTerm('');
    setClientFilterPlan('all');
    setClientFilterStatus('all');
    setShowFacturaModal(true);
  };

  const openEditFactura = (factura: Pago) => {
    setEditingFactura(factura);
    setFacturaFormData(factura);
    if (factura.items && factura.items.length > 0) {
      setInvoiceItems(factura.items);
    }
    setShowFacturaModal(true);
  };

  const addInvoiceItem = () => {
    setInvoiceItems([...invoiceItems, {
      id: `item-${Date.now()}`,
      descripcion: '',
      cantidad: 1,
      precio_unitario: 0,
      subtotal: 0,
    }]);
  };

  const updateInvoiceItem = (itemId: string, field: keyof InvoiceItem, value: any) => {
    setInvoiceItems(invoiceItems.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, [field]: value };
        if (field === 'cantidad' || field === 'precio_unitario') {
          updated.subtotal = updated.cantidad * updated.precio_unitario;
        }
        return updated;
      }
      return item;
    }));
  };

  const removeInvoiceItem = (itemId: string) => {
    setInvoiceItems(invoiceItems.filter(item => item.id !== itemId));
  };

  const handleSaveFactura = () => {
    if (!facturaFormData.cliente_id) {
      showAlert('destructive', 'Por favor selecciona un cliente');
      return;
    }

    // Calcular subtotal de todos los items
    const subtotal = invoiceItems.reduce((sum, item) => sum + item.subtotal, 0);

    if (subtotal === 0) {
      showAlert('destructive', 'Por favor agrega al menos un item con monto mayor a 0');
      return;
    }

    // Calcular IVA y total
    const esFiscal = facturaFormData.es_fiscal ?? invoiceTemplate.factura_fiscal_default;
    const ivaPorcentaje = facturaFormData.iva_porcentaje ?? invoiceTemplate.iva_porcentaje_default;
    const { iva, total } = calculateInvoiceTotals(subtotal, esFiscal, ivaPorcentaje);

    const facturaData: Pago = {
      ...facturaFormData,
      id: editingFactura?.id || `pago-${Date.now()}`,
      cliente_id: facturaFormData.cliente_id!,
      subtotal,
      iva_monto: iva,
      monto: total,
      fecha: facturaFormData.fecha || new Date(),
      estado: facturaFormData.estado || 'pendiente',
      metodo_pago: facturaFormData.metodo_pago || 'stripe',
      numero_factura: facturaFormData.numero_factura || `INV-${Date.now()}`,
      tipo: facturaFormData.tipo || 'suscripcion',
      es_fiscal: esFiscal,
      iva_porcentaje: ivaPorcentaje,
      items: [...invoiceItems],
    };

    if (editingFactura) {
      setPagos(pagos.map(p => p.id === editingFactura.id ? facturaData : p));
      showAlert('success', `Factura ${facturaData.numero_factura} actualizada correctamente`);
    } else {
      setPagos([...pagos, facturaData]);
      showAlert('success', `Factura ${facturaData.numero_factura} creada correctamente`);
    }

    setShowFacturaModal(false);
    setFacturaFormData({});
    setInvoiceItems([]);
  };

  const handleDeleteFactura = (facturaId: string) => {
    const factura = pagos.find(p => p.id === facturaId);
    if (window.confirm(`¿Está seguro que desea eliminar la factura ${factura?.numero_factura}?`)) {
      setPagos(pagos.filter(p => p.id !== facturaId));
      showAlert('success', `Factura eliminada correctamente`);
    }
  };

  const handleDuplicateFactura = (factura: Pago) => {
    const duplicated: Pago = {
      ...factura,
      id: `pago-${Date.now()}`,
      numero_factura: `INV-${Date.now()}`,
      fecha: new Date(),
      estado: 'pendiente',
    };
    setPagos([...pagos, duplicated]);
    showAlert('success', `Factura duplicada como ${duplicated.numero_factura}`);
  };

  const viewFacturaDetails = (factura: Pago) => {
    setSelectedFactura(factura);
    setShowFacturaDetailModal(true);
  };

  const generateFacturaPDF = (factura: Pago) => {
    const cliente = clientes.find(c => c.id === factura.cliente_id);
    showAlert('info', `Generando PDF de factura ${factura.numero_factura}...`);

    // Simular descarga
    setTimeout(() => {
      showAlert('success', `PDF de factura ${factura.numero_factura} descargado correctamente`);
      // Aquí irá la implementación real con jsPDF
    }, 1000);
  };

  const sendFacturaEmail = (factura: Pago) => {
    const cliente = clientes.find(c => c.id === factura.cliente_id);
    showAlert('info', `Enviando factura ${factura.numero_factura} a ${cliente?.email}...`);

    setTimeout(() => {
      showAlert('success', `Factura enviada correctamente a ${cliente?.email}`);
    }, 1500);
  };

  // Generación automática de facturas para clientes
  const generateAutoInvoices = () => {
    const today = new Date();
    let generatedCount = 0;

    clientes.forEach(cliente => {
      // Solo generar para clientes activos
      if (cliente.status !== 'active') return;

      // Verificar si es día de pago
      if (cliente.fecha_proximo_pago) {
        const fechaPago = new Date(cliente.fecha_proximo_pago);
        const isSameDay = fechaPago.getDate() === today.getDate() &&
                         fechaPago.getMonth() === today.getMonth() &&
                         fechaPago.getFullYear() === today.getFullYear();

        if (isSameDay) {
          // Verificar que no exista ya una factura para este período
          const mesActual = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
          const yaExiste = pagos.some(p =>
            p.cliente_id === cliente.id &&
            p.numero_factura.includes(mesActual)
          );

          if (!yaExiste) {
            // Generar factura automáticamente
            const subtotal = cliente.precio_mensual;
            const esFiscal = invoiceTemplate.factura_fiscal_default;
            const ivaPorcentaje = invoiceTemplate.iva_porcentaje_default;
            const { iva, total } = calculateInvoiceTotals(subtotal, esFiscal, ivaPorcentaje);

            const fechaVencimiento = new Date(today);
            fechaVencimiento.setDate(fechaVencimiento.getDate() + invoiceTemplate.dias_vencimiento_default);

            const newFactura: Pago = {
              id: `pago-${Date.now()}-${cliente.id}`,
              cliente_id: cliente.id,
              numero_factura: `INV-${mesActual}-${String(generatedCount + 1).padStart(4, '0')}`,
              fecha: today,
              fecha_vencimiento: fechaVencimiento,
              concepto: `Servicio ChatFlow Pro - Plan ${cliente.plan.toUpperCase()}`,
              subtotal,
              iva_porcentaje: ivaPorcentaje,
              iva_monto: iva,
              monto: total,
              estado: 'pendiente',
              metodo_pago: 'stripe',
              tipo: 'suscripcion',
              es_fiscal: esFiscal,
              items: [{
                id: `item-${Date.now()}`,
                descripcion: `Plan ${cliente.plan.toUpperCase()} - ${cliente.ciclo_facturacion === 'mensual' ? 'Mensual' : 'Anual'}`,
                cantidad: 1,
                precio_unitario: subtotal,
                subtotal,
              }],
            };

            setPagos(prev => [...prev, newFactura]);
            generatedCount++;
          }
        }
      }
    });

    if (generatedCount > 0) {
      showAlert('success', `Se generaron ${generatedCount} facturas automáticamente`);
    }
  };

  // Ejecutar generación automática al montar el componente (simula un cron job)
  useEffect(() => {
    // Comentado para evitar generación automática en cada render
    // En producción, esto debería ejecutarse con un cron job en el backend
    // generateAutoInvoices();
  }, []);

  // Función para editar la plantilla de factura
  const saveInvoiceTemplate = () => {
    // En producción, esto se guardaría en la base de datos
    localStorage.setItem('invoiceTemplate', JSON.stringify(invoiceTemplate));
    showAlert('success', 'Plantilla de factura guardada correctamente');
    setShowTemplateEditor(false);
  };

  // Evaluar qué clientes cumplen con cada alerta
  const evaluarAlertas = (cliente: Cliente): AlertaCliente[] => {
    return alertas.filter(alerta => {
      if (!alerta.activo) return false;

      // Check if alert applies to this client
      if (alerta.aplicar_a === 'especificos' && !alerta.cliente_ids?.includes(cliente.id)) {
        return false;
      }

      // Evaluate condition based on alert type
      switch (alerta.tipo) {
        case 'fecha_pago':
          if (alerta.condicion.tipo === 'dias_restantes' && cliente.fecha_proximo_pago) {
            const diasRestantes = Math.ceil((new Date(cliente.fecha_proximo_pago).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            return diasRestantes <= alerta.condicion.valor && diasRestantes >= 0;
          }
          break;

        case 'consumo_mensajes':
          if (alerta.condicion.tipo === 'porcentaje_uso') {
            const porcentajeUso = cliente.usedMessages ? (cliente.usedMessages / cliente.limite_mensajes) * 100 : 0;
            return porcentajeUso >= alerta.condicion.valor;
          }
          break;

        case 'consumo_tokens':
          if (alerta.condicion.tipo === 'porcentaje_uso') {
            // Calculate token usage from usos data
            const usosCliente = usos.filter(u => u.cliente_id === cliente.id);
            const totalTokens = usosCliente.reduce((sum, u) => sum + u.tokens_input + u.tokens_output, 0);
            const porcentajeUso = (totalTokens / cliente.limite_tokens) * 100;
            return porcentajeUso >= alerta.condicion.valor;
          }
          break;

        case 'limite_agentes':
          if (alerta.condicion.tipo === 'mayor_que') {
            const usosCliente = usos.filter(u => u.cliente_id === cliente.id);
            const agentesActivos = usosCliente.length > 0 ? usosCliente[0].agentes_activos : 0;
            const porcentaje = (agentesActivos / cliente.limite_agentes) * 100;
            return porcentaje >= alerta.condicion.valor;
          }
          break;

        case 'custom':
          if (alerta.condicion.campo === 'precio_mensual' && alerta.condicion.tipo === 'igual_a') {
            return cliente.precio_mensual === alerta.condicion.valor;
          }
          break;
      }

      return false;
    });
  };

  const renderAlertas = () => {
    // Calculate stats
    const alertasActivas = alertas.filter(a => a.activo).length;
    const alertasInactivas = alertas.filter(a => !a.activo).length;

    // Count how many clients match each alert
    const alertasConConteo = alertas.map(alerta => {
      const clientesAfectados = clientes.filter(cliente =>
        evaluarAlertas(cliente).some(a => a.id === alerta.id)
      );
      return { ...alerta, clientesAfectados: clientesAfectados.length, clientes: clientesAfectados };
    });

    const totalClientesConAlertas = new Set(
      clientes.filter(c => evaluarAlertas(c).length > 0).map(c => c.id)
    ).size;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Gestión de Alertas ({alertas.length})
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Configura alertas automáticas para tus clientes
            </p>
          </div>
          <button
            onClick={openCreateAlertaModal}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <i className="fas fa-plus"></i>
            Nueva Alerta
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                <i className="fas fa-bell text-xl"></i>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Alertas</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{alertas.length}</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white">
                <i className="fas fa-check-circle text-xl"></i>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Activas</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{alertasActivas}</p>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center text-white">
                <i className="fas fa-bell-slash text-xl"></i>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Inactivas</p>
            <p className="text-3xl font-bold text-gray-600 dark:text-gray-400">{alertasInactivas}</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-2xl p-6 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center text-white">
                <i className="fas fa-users text-xl"></i>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Clientes con Alertas</p>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{totalClientesConAlertas}</p>
          </div>
        </div>

        {/* Alertas Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Todas las Alertas
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Condición</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Severidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Clientes Afectados</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {alertasConConteo.map((alerta) => (
                  <tr key={alerta.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {alerta.nombre}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                        {alerta.tipo.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {alerta.condicion.tipo} {alerta.condicion.valor}
                      {alerta.condicion.tipo === 'porcentaje_uso' && '%'}
                      {alerta.condicion.tipo === 'dias_restantes' && ' días'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        alerta.severidad === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                        alerta.severidad === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                      }`}>
                        {alerta.severidad}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`font-semibold ${
                        alerta.clientesAfectados > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {alerta.clientesAfectados} clientes
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleAlertaActiva(alerta.id)}
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          alerta.activo
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                        }`}
                      >
                        {alerta.activo ? 'Activa' : 'Inactiva'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => openEditAlertaModal(alerta)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={() => deleteAlerta(alerta.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Preview de Clientes Afectados */}
        {totalClientesConAlertas > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <i className="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
              Clientes con Alertas Activas ({totalClientesConAlertas})
            </h3>
            <div className="space-y-3">
              {clientes.filter(c => evaluarAlertas(c).length > 0).slice(0, 10).map((cliente) => {
                const alertasCliente = evaluarAlertas(cliente);
                return (
                  <div key={cliente.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{cliente.nombre}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{cliente.empresa}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        cliente.plan === 'enterprise' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' :
                        cliente.plan === 'pro' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                        'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                      }`}>
                        {cliente.plan.toUpperCase()}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {alertasCliente.map((alerta) => (
                        <div key={alerta.id} className={`p-3 rounded-lg border ${
                          alerta.severidad === 'error' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' :
                          alerta.severidad === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800' :
                          'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                        }`}>
                          <p className={`text-sm font-medium ${
                            alerta.severidad === 'error' ? 'text-red-800 dark:text-red-200' :
                            alerta.severidad === 'warning' ? 'text-yellow-800 dark:text-yellow-200' :
                            'text-blue-800 dark:text-blue-200'
                          }`}>
                            {alerta.mensaje}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="fas fa-lightbulb text-blue-600 dark:text-blue-400"></i>
            </div>
            <div>
              <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">Sistema de Alertas</h3>
              <div className="text-blue-800 dark:text-blue-200 text-sm space-y-1">
                <p>• Las alertas se evalúan automáticamente en tiempo real para cada cliente</p>
                <p>• Los clientes verán estas alertas en su panel como mensajes destacados</p>
                <p>• Puedes configurar alertas globales (todos) o específicas por cliente</p>
                <p>• {totalClientesConAlertas} clientes tienen alertas activas en este momento</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==================== MAIN RENDER ====================

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
            <i className="fas fa-shield-alt text-blue-600 mr-3"></i>
            Panel de Administración SaaS
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Gestión completa de clientes, ingresos, costos y métricas
          </p>
        </div>

        {/* Alert */}
        {alert && (
          <div className="mb-6">
            <Alert
              variant={alert.type}
              description={alert.message}
              onClose={() => setAlert(null)}
            />
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Dashboard', icon: 'fa-chart-line' },
                { id: 'clientes', label: 'Clientes', icon: 'fa-users' },
                { id: 'ingresos', label: 'Ingresos', icon: 'fa-dollar-sign' },
                { id: 'costos', label: 'Costos', icon: 'fa-chart-pie' },
                { id: 'uso-ia', label: 'Uso IA', icon: 'fa-robot' },
                { id: 'retencion', label: 'Retención', icon: 'fa-user-check' },
                { id: 'facturacion', label: 'Facturación', icon: 'fa-file-invoice' },
                { id: 'alertas', label: 'Alertas', icon: 'fa-bell' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id as AdminSection)}
                  className={`
                    py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
                    ${activeSection === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                    }
                  `}
                >
                  <i className={`fas ${tab.icon}`}></i>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeSection === 'overview' && renderOverview()}
            {activeSection === 'clientes' && renderClientes()}
            {activeSection === 'ingresos' && renderIngresos()}
            {activeSection === 'costos' && renderCostos()}
            {activeSection === 'uso-ia' && renderUsoIA()}
            {activeSection === 'retencion' && renderRetencion()}
            {activeSection === 'facturacion' && renderFacturacion()}
            {activeSection === 'alertas' && renderAlertas()}
          </div>
        </div>

        {/* Cliente Modal (Create/Edit) */}
        {showClienteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full my-8">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
                  </h3>
                  <button
                    onClick={() => setShowClienteModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <i className="fas fa-times text-xl"></i>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={formData.nombre || ''}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Juan Pérez"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="juan@empresa.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Empresa *
                  </label>
                  <input
                    type="text"
                    value={formData.empresa || ''}
                    onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Mi Empresa SL"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Plan
                    </label>
                    <select
                      value={formData.plan || 'basic'}
                      onChange={(e) => {
                        const plan = e.target.value as Cliente['plan'];
                        const precios = { free: 0, basic: 49, pro: 149, enterprise: 499 };
                        const limites = { free: 100, basic: 1000, pro: 5000, enterprise: 20000 };
                        const tokens = { free: 10000, basic: 100000, pro: 500000, enterprise: 2000000 };
                        setFormData({
                          ...formData,
                          plan,
                          precio_mensual: precios[plan],
                          limite_mensajes: limites[plan],
                          monthlyLimit: limites[plan],
                          limite_tokens: tokens[plan],
                        });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="free">Free</option>
                      <option value="basic">Basic ($49/mes)</option>
                      <option value="pro">Pro ($149/mes)</option>
                      <option value="enterprise">Enterprise ($499/mes)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Estado
                    </label>
                    <select
                      value={formData.status || 'trial'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as Cliente['status'] })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="active">Activo</option>
                      <option value="trial">Trial</option>
                      <option value="paused">Pausado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ciclo Facturación
                    </label>
                    <select
                      value={formData.ciclo_facturacion || 'mensual'}
                      onChange={(e) => setFormData({ ...formData, ciclo_facturacion: e.target.value as Cliente['ciclo_facturacion'] })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="mensual">Mensual</option>
                      <option value="anual">Anual</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Precio Mensual
                    </label>
                    <input
                      type="number"
                      value={formData.precio_mensual || 0}
                      onChange={(e) => setFormData({ ...formData, precio_mensual: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Límite Mensajes
                    </label>
                    <input
                      type="number"
                      value={formData.limite_mensajes || 1000}
                      onChange={(e) => setFormData({ ...formData, limite_mensajes: parseInt(e.target.value), monthlyLimit: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Límite Tokens
                    </label>
                    <input
                      type="number"
                      value={formData.limite_tokens || 100000}
                      onChange={(e) => setFormData({ ...formData, limite_tokens: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Account Manager
                  </label>
                  <input
                    type="text"
                    value={formData.account_manager || ''}
                    onChange={(e) => setFormData({ ...formData, account_manager: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Nombre del Account Manager"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notas
                  </label>
                  <textarea
                    value={formData.notas || ''}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Notas sobre el cliente..."
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button
                  onClick={() => setShowClienteModal(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveCliente}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {editingCliente ? 'Guardar Cambios' : 'Crear Cliente'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cliente Detail Modal */}
        {showDetailModal && selectedCliente && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Detalle de Cliente
                  </h3>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <i className="fas fa-times text-xl"></i>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Client Info */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Información General</h4>
                    <div className="space-y-2">
                      <p className="text-gray-900 dark:text-gray-100"><strong>Nombre:</strong> {selectedCliente.nombre}</p>
                      <p className="text-gray-900 dark:text-gray-100"><strong>Email:</strong> {selectedCliente.email}</p>
                      <p className="text-gray-900 dark:text-gray-100"><strong>Empresa:</strong> {selectedCliente.empresa}</p>
                      <p className="text-gray-900 dark:text-gray-100"><strong>Account Manager:</strong> {selectedCliente.account_manager || 'N/A'}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Plan y Facturación</h4>
                    <div className="space-y-2">
                      <p className="text-gray-900 dark:text-gray-100"><strong>Plan:</strong> {selectedCliente.plan.toUpperCase()}</p>
                      <p className="text-gray-900 dark:text-gray-100"><strong>Precio:</strong> ${selectedCliente.precio_mensual}/{selectedCliente.ciclo_facturacion}</p>
                      <p className="text-gray-900 dark:text-gray-100"><strong>Fecha Alta:</strong> {new Date(selectedCliente.fecha_alta).toLocaleDateString('es-ES')}</p>
                      <p className="text-gray-900 dark:text-gray-100"><strong>Próximo Pago:</strong> {selectedCliente.fecha_proximo_pago ? new Date(selectedCliente.fecha_proximo_pago).toLocaleDateString('es-ES') : 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Usage Stats */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Uso y Límites</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Mensajes</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedCliente.usedMessages || 0}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">de {selectedCliente.limite_mensajes}</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Tokens</p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{selectedCliente.limite_tokens.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">límite mensual</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Agentes</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">{selectedCliente.limite_agentes}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">activos permitidos</p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedCliente.notas && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Notas</h4>
                    <p className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      {selectedCliente.notas}
                    </p>
                  </div>
                )}

                {/* Payment Alerts */}
                {selectedCliente.fecha_proximo_pago && (() => {
                  const diasRestantes = Math.ceil((new Date(selectedCliente.fecha_proximo_pago).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  if (diasRestantes <= 15 && diasRestantes >= 0) {
                    return (
                      <div className={`rounded-xl p-4 border ${
                        diasRestantes <= 3 ? 'bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-800' :
                        diasRestantes <= 7 ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-300 dark:border-yellow-800' :
                        'bg-blue-50 dark:bg-blue-900/10 border-blue-300 dark:border-blue-800'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            diasRestantes <= 3 ? 'bg-red-100 dark:bg-red-900' :
                            diasRestantes <= 7 ? 'bg-yellow-100 dark:bg-yellow-900' :
                            'bg-blue-100 dark:bg-blue-900'
                          }`}>
                            <i className={`fas fa-exclamation-triangle ${
                              diasRestantes <= 3 ? 'text-red-600 dark:text-red-400' :
                              diasRestantes <= 7 ? 'text-yellow-600 dark:text-yellow-400' :
                              'text-blue-600 dark:text-blue-400'
                            }`}></i>
                          </div>
                          <div>
                            <p className={`font-semibold ${
                              diasRestantes <= 3 ? 'text-red-800 dark:text-red-200' :
                              diasRestantes <= 7 ? 'text-yellow-800 dark:text-yellow-200' :
                              'text-blue-800 dark:text-blue-200'
                            }`}>
                              {diasRestantes <= 3 ? '🚨 PAGO URGENTE' :
                               diasRestantes <= 7 ? '⚠️ Pago Próximo' :
                               '📅 Pago en 15 días'}
                            </p>
                            <p className={`text-sm ${
                              diasRestantes <= 3 ? 'text-red-700 dark:text-red-300' :
                              diasRestantes <= 7 ? 'text-yellow-700 dark:text-yellow-300' :
                              'text-blue-700 dark:text-blue-300'
                            }`}>
                              Vence en <strong>{diasRestantes} días</strong> - ${selectedCliente.precio_mensual} ({new Date(selectedCliente.fecha_proximo_pago).toLocaleDateString('es-ES')})
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Payment History */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 flex items-center justify-between">
                    <span>Historial Completo de Pagos</span>
                    <span className="text-xs font-normal text-gray-400">
                      Total: {pagos.filter(p => p.cliente_id === selectedCliente.id).length} pagos
                    </span>
                  </h4>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Fecha</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Monto</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Método</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Estado</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Factura</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {pagos
                          .filter(p => p.cliente_id === selectedCliente.id)
                          .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                          .map((pago, index) => (
                            <tr key={pago.id} className={index < 3 ? 'bg-blue-50/30 dark:bg-blue-900/5' : ''}>
                              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                                {new Date(pago.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                ${pago.monto}
                              </td>
                              <td className="px-4 py-2 text-xs text-gray-600 dark:text-gray-400 capitalize">
                                {pago.metodo_pago}
                              </td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  pago.estado === 'pagado' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                                  pago.estado === 'vencido' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                                  pago.estado === 'cancelado' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300' :
                                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                                }`}>
                                  {pago.estado}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-xs font-mono text-gray-600 dark:text-gray-400">
                                {pago.numero_factura}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Payment Summary */}
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Pagado</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        ${pagos.filter(p => p.cliente_id === selectedCliente.id && p.estado === 'pagado').reduce((sum, p) => sum + p.monto, 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Pendiente</p>
                      <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                        ${pagos.filter(p => p.cliente_id === selectedCliente.id && p.estado === 'pendiente').reduce((sum, p) => sum + p.monto, 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Lifetime Value</p>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        ${pagos.filter(p => p.cliente_id === selectedCliente.id && p.estado === 'pagado').length * selectedCliente.precio_mensual}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Alerta Modal (Create/Edit) */}
        {showAlertaModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full my-8">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {editingAlerta ? 'Editar Alerta' : 'Nueva Alerta'}
                  </h3>
                  <button
                    onClick={() => setShowAlertaModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <i className="fas fa-times text-xl"></i>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre de la Alerta *
                  </label>
                  <input
                    type="text"
                    value={alertaFormData.nombre || ''}
                    onChange={(e) => setAlertaFormData({ ...alertaFormData, nombre: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Ej: Pago próximo a vencer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo de Alerta
                    </label>
                    <select
                      value={alertaFormData.tipo || 'fecha_pago'}
                      onChange={(e) => setAlertaFormData({ ...alertaFormData, tipo: e.target.value as AlertaCliente['tipo'] })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="fecha_pago">Fecha de Pago</option>
                      <option value="consumo_mensajes">Consumo de Mensajes</option>
                      <option value="consumo_tokens">Consumo de Tokens</option>
                      <option value="limite_agentes">Límite de Agentes</option>
                      <option value="mrr_bajo">MRR Bajo</option>
                      <option value="custom">Personalizada</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Severidad
                    </label>
                    <select
                      value={alertaFormData.severidad || 'warning'}
                      onChange={(e) => setAlertaFormData({ ...alertaFormData, severidad: e.target.value as AlertaCliente['severidad'] })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="info">Info (Azul)</option>
                      <option value="warning">Advertencia (Amarillo)</option>
                      <option value="error">Error (Rojo)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo de Condición
                    </label>
                    <select
                      value={alertaFormData.condicion?.tipo || 'dias_restantes'}
                      onChange={(e) => setAlertaFormData({
                        ...alertaFormData,
                        condicion: {
                          ...alertaFormData.condicion!,
                          tipo: e.target.value as AlertaCliente['condicion']['tipo']
                        }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="dias_restantes">Días Restantes</option>
                      <option value="porcentaje_uso">Porcentaje de Uso</option>
                      <option value="mayor_que">Mayor Que</option>
                      <option value="menor_que">Menor Que</option>
                      <option value="igual_a">Igual A</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Valor
                    </label>
                    <input
                      type="number"
                      value={alertaFormData.condicion?.valor || 7}
                      onChange={(e) => setAlertaFormData({
                        ...alertaFormData,
                        condicion: {
                          ...alertaFormData.condicion!,
                          valor: parseFloat(e.target.value)
                        }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="7"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Campo a Evaluar
                  </label>
                  <input
                    type="text"
                    value={alertaFormData.condicion?.campo || 'fecha_proximo_pago'}
                    onChange={(e) => setAlertaFormData({
                      ...alertaFormData,
                      condicion: {
                        ...alertaFormData.condicion!,
                        campo: e.target.value
                      }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="fecha_proximo_pago, mensajes_usados, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mensaje de la Alerta *
                  </label>
                  <textarea
                    value={alertaFormData.mensaje || ''}
                    onChange={(e) => setAlertaFormData({ ...alertaFormData, mensaje: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Este mensaje aparecerá en el panel del cliente..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Aplicar a
                  </label>
                  <select
                    value={alertaFormData.aplicar_a || 'todos'}
                    onChange={(e) => setAlertaFormData({ ...alertaFormData, aplicar_a: e.target.value as 'todos' | 'especificos' })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="todos">Todos los Clientes</option>
                    <option value="especificos">Clientes Específicos</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="alertaActiva"
                    checked={alertaFormData.activo !== false}
                    onChange={(e) => setAlertaFormData({ ...alertaFormData, activo: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="alertaActiva" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Alerta Activa
                  </label>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <i className="fas fa-info-circle mr-2"></i>
                    Esta alerta se evaluará automáticamente para cada cliente que cumpla con las condiciones especificadas.
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button
                  onClick={() => setShowAlertaModal(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveAlerta}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {editingAlerta ? 'Guardar Cambios' : 'Crear Alerta'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Create/Edit Modal */}
        {showFacturaModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full my-8">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    <i className="fas fa-file-invoice text-blue-600 mr-2"></i>
                    {editingFactura ? 'Editar Factura' : 'Nueva Factura'}
                  </h3>
                  <button
                    onClick={() => setShowFacturaModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <i className="fas fa-times text-xl"></i>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Cliente Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cliente *
                  </label>
                  <select
                    value={facturaFormData.cliente_id || ''}
                    onChange={(e) => setFacturaFormData({ ...facturaFormData, cliente_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  >
                    <option value="">Seleccione un cliente</option>
                    {clientes.map(cliente => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre} ({cliente.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Monto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Monto *
                  </label>
                  <input
                    type="number"
                    value={facturaFormData.monto || ''}
                    onChange={(e) => setFacturaFormData({ ...facturaFormData, monto: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                {/* Número de Factura */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Número de Factura
                  </label>
                  <input
                    type="text"
                    value={facturaFormData.numero_factura || ''}
                    onChange={(e) => setFacturaFormData({ ...facturaFormData, numero_factura: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="INV-001"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Si se deja vacío, se generará automáticamente
                  </p>
                </div>

                {/* Grid for Date, Status, Payment Method, Type */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Fecha */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={facturaFormData.fecha ? new Date(facturaFormData.fecha).toISOString().split('T')[0] : ''}
                      onChange={(e) => setFacturaFormData({ ...facturaFormData, fecha: new Date(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  {/* Estado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Estado
                    </label>
                    <select
                      value={facturaFormData.estado || 'pendiente'}
                      onChange={(e) => setFacturaFormData({ ...facturaFormData, estado: e.target.value as Pago['estado'] })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="pagado">Pagado</option>
                      <option value="vencido">Vencido</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>

                  {/* Método de Pago */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Método de Pago
                    </label>
                    <select
                      value={facturaFormData.metodo_pago || 'stripe'}
                      onChange={(e) => setFacturaFormData({ ...facturaFormData, metodo_pago: e.target.value as Pago['metodo_pago'] })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="tarjeta">Tarjeta</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="paypal">PayPal</option>
                      <option value="stripe">Stripe</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  {/* Tipo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo
                    </label>
                    <select
                      value={facturaFormData.tipo || 'suscripcion'}
                      onChange={(e) => setFacturaFormData({ ...facturaFormData, tipo: e.target.value as Pago['tipo'] })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="suscripcion">Suscripción</option>
                      <option value="one-time">Pago Único</option>
                    </select>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <i className="fas fa-info-circle mr-2"></i>
                    Los campos marcados con * son obligatorios
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button
                  onClick={() => setShowFacturaModal(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveFactura}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <i className="fas fa-save"></i>
                  {editingFactura ? 'Guardar Cambios' : 'Crear Factura'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Detail Modal */}
        {showFacturaDetailModal && selectedFactura && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full my-8">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    <i className="fas fa-file-invoice text-blue-600 mr-2"></i>
                    Detalles de Factura
                  </h3>
                  <button
                    onClick={() => setShowFacturaDetailModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <i className="fas fa-times text-xl"></i>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Invoice Header */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {selectedFactura.numero_factura}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(selectedFactura.fecha).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        ${selectedFactura.monto.toLocaleString()}
                      </p>
                      <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mt-2 ${
                        selectedFactura.estado === 'pagado' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                        selectedFactura.estado === 'vencido' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                        selectedFactura.estado === 'cancelado' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                      }`}>
                        {selectedFactura.estado.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Client Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                      <i className="fas fa-user text-blue-600 mr-2"></i>
                      Información del Cliente
                    </h5>
                    {(() => {
                      const cliente = clientes.find(c => c.id === selectedFactura.cliente_id);
                      return cliente ? (
                        <div className="space-y-2 text-sm">
                          <p className="text-gray-900 dark:text-gray-100 font-medium">{cliente.nombre}</p>
                          <p className="text-gray-600 dark:text-gray-400">{cliente.email}</p>
                          <p className="text-gray-600 dark:text-gray-400">{cliente.telefono}</p>
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Cliente no encontrado</p>
                      );
                    })()}
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                      <i className="fas fa-credit-card text-blue-600 mr-2"></i>
                      Detalles de Pago
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Método:</span>
                        <span className="text-gray-900 dark:text-gray-100 font-medium capitalize">
                          {selectedFactura.metodo_pago}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Tipo:</span>
                        <span className="text-gray-900 dark:text-gray-100 font-medium capitalize">
                          {selectedFactura.tipo === 'suscripcion' ? 'Suscripción' : 'Pago Único'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Estado:</span>
                        <span className="text-gray-900 dark:text-gray-100 font-medium capitalize">
                          {selectedFactura.estado}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setShowFacturaDetailModal(false);
                      openEditFactura(selectedFactura);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-edit"></i>
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      generateFacturaPDF(selectedFactura);
                      setShowFacturaDetailModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-file-pdf"></i>
                    Descargar PDF
                  </button>
                  <button
                    onClick={() => {
                      sendFacturaEmail(selectedFactura);
                      setShowFacturaDetailModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-envelope"></i>
                    Enviar Email
                  </button>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  onClick={() => setShowFacturaDetailModal(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
