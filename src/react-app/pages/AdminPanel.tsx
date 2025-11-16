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
  estado: 'pagado' | 'pendiente' | 'vencido' | 'cancelado';
  metodo_pago: 'tarjeta' | 'transferencia' | 'paypal' | 'stripe' | 'otro';
  numero_factura: string;
  tipo: 'suscripcion' | 'one-time';
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

type AdminSection = 'overview' | 'clientes' | 'ingresos' | 'costos' | 'uso-ia' | 'retencion' | 'facturacion';

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
  const [alert, setAlert] = useState<{ type: 'success' | 'destructive' | 'warning' | 'info'; message: string } | null>(null);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState<Partial<Cliente>>({});
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    // Generate demo data on mount
    const clientesData = generateDemoClientes();
    const pagosData = generateDemoPagos(clientesData);
    const usosData = generateDemoUso(clientesData);
    const metricasData = calculateMetricasMensuales(clientesData, pagosData, usosData);

    setClientes(clientesData);
    setPagos(pagosData);
    setUsos(usosData);
    setMetricas(metricasData);
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

  const renderClientes = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Gestión de Clientes ({clientes.length})
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {clientes.filter(c => c.status === 'active').length} activos • {clientes.filter(c => c.status === 'trial').length} en trial
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
        >
          <i className="fas fa-plus"></i>
          Nuevo Cliente
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['active', 'trial', 'paused', 'cancelled'].map(status => {
          const count = clientes.filter(c => c.status === status).length;
          const colors = {
            active: 'green',
            trial: 'blue',
            paused: 'yellow',
            cancelled: 'red'
          };
          const color = colors[status as keyof typeof colors];

          return (
            <div key={status} className={`bg-${color}-50 dark:bg-${color}-900/20 border border-${color}-200 dark:border-${color}-800 rounded-xl p-4`}>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{status.charAt(0).toUpperCase() + status.slice(1)}</p>
              <p className={`text-2xl font-bold text-${color}-600 dark:text-${color}-400`}>{count}</p>
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
              {clientes.map((cliente) => {
                const usagePercent = (cliente.usedMessages || 0) / (cliente.monthlyLimit || 1) * 100;

                return (
                  <tr key={cliente.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                          {cliente.nombre.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{cliente.nombre}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{cliente.empresa}</div>
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
                        className={`px-3 py-1 text-xs font-semibold rounded-full border-0 ${
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
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

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
        {facturasPendientes.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <i className="fas fa-file-invoice text-red-600 mr-2"></i>
              Facturas Pendientes ({facturasPendientes.length})
            </h3>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {facturasPendientes.map((pago) => {
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
                          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                            Pendiente
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary */}
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

                {/* Payment History */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Historial de Pagos (Últimos 5)</h4>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Fecha</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Monto</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Estado</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Factura</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {pagos
                          .filter(p => p.cliente_id === selectedCliente.id)
                          .slice(-5)
                          .reverse()
                          .map(pago => (
                            <tr key={pago.id}>
                              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                                {new Date(pago.fecha).toLocaleDateString('es-ES')}
                              </td>
                              <td className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                ${pago.monto}
                              </td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  pago.estado === 'pagado' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                                }`}>
                                  {pago.estado}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                                {pago.numero_factura}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
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
      </div>
    </div>
  );
}
