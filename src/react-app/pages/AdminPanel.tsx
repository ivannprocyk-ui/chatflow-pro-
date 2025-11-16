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

  // ==================== RENDER PLACEHOLDER SECTIONS ====================
  // These will be fully implemented in the next phase

  const renderIngresos = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
      <i className="fas fa-money-bill-wave text-6xl text-green-500 mb-4"></i>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Ingresos y Finanzas</h2>
      <p className="text-gray-600 dark:text-gray-400">Módulo en desarrollo - Próximamente</p>
    </div>
  );

  const renderCostos = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
      <i className="fas fa-chart-pie text-6xl text-red-500 mb-4"></i>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Costos y Rentabilidad</h2>
      <p className="text-gray-600 dark:text-gray-400">Módulo en desarrollo - Próximamente</p>
    </div>
  );

  const renderUsoIA = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
      <i className="fas fa-robot text-6xl text-purple-500 mb-4"></i>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Uso y Performance IA</h2>
      <p className="text-gray-600 dark:text-gray-400">Módulo en desarrollo - Próximamente</p>
    </div>
  );

  const renderRetencion = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
      <i className="fas fa-user-check text-6xl text-blue-500 mb-4"></i>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Retención y Churn</h2>
      <p className="text-gray-600 dark:text-gray-400">Módulo en desarrollo - Próximamente</p>
    </div>
  );

  const renderFacturacion = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
      <i className="fas fa-file-invoice-dollar text-6xl text-yellow-500 mb-4"></i>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Facturación y Pagos</h2>
      <p className="text-gray-600 dark:text-gray-400">Módulo en desarrollo - Próximamente</p>
    </div>
  );

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
