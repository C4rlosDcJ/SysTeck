import { useState, useEffect } from 'react';
import { statsService } from '../../services/api';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line
} from 'recharts';
import {
    DollarSign,
    Wrench,
    Users,
    TrendingUp,
    Calendar,
    Award
} from 'lucide-react';
import './AdminReports.css';

const COLORS = ['#DA0037', '#00C49F', '#FFBB28', '#FF8042', '#0088FE', '#8884d8', '#82ca9d'];

const statusLabels = {
    received: 'Recibido',
    diagnosing: 'En Diagnóstico',
    waiting_approval: 'Esperando Aprobación',
    waiting_parts: 'Esperando Refacciones',
    repairing: 'En Reparación',
    quality_check: 'Control de Calidad',
    ready: 'Listo para Entrega',
    delivered: 'Entregado',
    cancelled: 'Cancelado'
};

export default function AdminReports() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [technicians, setTechnicians] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [dashboardStats, techStats] = await Promise.all([
                statsService.getDashboard(),
                statsService.getTechniciansStats()
            ]);
            setData(dashboardStats);
            setTechnicians(techStats);
        } catch (error) {
            console.error('Error al cargar reportes:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount || 0);
    };

    if (loading) {
        return (
            <div className="loading-state">
                <div className="spinner"></div>
                <p>Generando reportes...</p>
            </div>
        );
    }

    const pieData = Object.entries(data?.statusSummary || {}).map(([key, value]) => ({
        name: statusLabels[key] || key,
        value
    }));

    const revenueData = data?.monthlyRevenue?.map(item => ({
        month: item.month,
        revenue: parseFloat(item.revenue)
    })) || [];

    return (
        <div className="reports-container">
            <header className="reports-header">
                <h1>Análisis y Reportes</h1>
                <p className="text-muted">Visualización detallada del rendimiento del negocio</p>
            </header>

            <div className="stats-summary">
                <div className="stat-box">
                    <div className="stat-icon"><DollarSign size={24} /></div>
                    <div className="stat-data">
                        <span className="stat-label">Ingresos Totales (Mes)</span>
                        <span className="stat-value">{formatCurrency(data?.thisMonth?.revenue)}</span>
                    </div>
                </div>
                <div className="stat-box">
                    <div className="stat-icon"><Wrench size={24} /></div>
                    <div className="stat-data">
                        <span className="stat-label">Reparaciones (Mes)</span>
                        <span className="stat-value">{data?.thisMonth?.repairs}</span>
                    </div>
                </div>
                <div className="stat-box">
                    <div className="stat-icon"><Users size={24} /></div>
                    <div className="stat-data">
                        <span className="stat-label">Nuevos Clientes</span>
                        <span className="stat-value">{data?.totalCustomers}</span>
                    </div>
                </div>
            </div>

            <div className="reports-grid">
                {/* Gráfico de Ingresos Mensuales */}
                <div className="report-card full-width">
                    <h2><TrendingUp size={20} /> Tendencia de Ingresos (Últimos 6 meses)</h2>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#555" vertical={false} />
                                <XAxis dataKey="month" stroke="#bbb" />
                                <YAxis stroke="#bbb" tickFormatter={(value) => `$${value}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#333', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    formatter={(value) => formatCurrency(value)}
                                />
                                <Bar dataKey="revenue" fill="#DA0037" radius={[4, 4, 0, 0]} name="Ingresos" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distribución por Estado */}
                <div className="report-card">
                    <h2><Calendar size={20} /> Distribución por Estado</h2>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#333', border: 'none', borderRadius: '8px', color: '#fff' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Rendimiento de Técnicos */}
                <div className="report-card">
                    <h2><Award size={20} /> Rendimiento de Técnicos</h2>
                    <div className="table-container">
                        <table className="technician-table">
                            <thead>
                                <tr>
                                    <th>Técnico</th>
                                    <th>Completadas</th>
                                    <th>En Proceso</th>
                                </tr>
                            </thead>
                            <tbody>
                                {technicians.map((tech) => (
                                    <tr key={tech.id}>
                                        <td>{tech.first_name} {tech.last_name}</td>
                                        <td>{tech.completed}</td>
                                        <td>{tech.in_progress}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Servicios Populares */}
                <div className="report-card">
                    <h2><Wrench size={20} /> Servicios más Solicitados</h2>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={data?.topServices || []}
                                margin={{ left: 20 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#555" horizontal={false} />
                                <XAxis type="number" stroke="#bbb" />
                                <YAxis dataKey="name" type="category" stroke="#bbb" width={100} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#333', border: 'none', borderRadius: '8px', color: '#fff' }}
                                />
                                <Bar dataKey="count" fill="#0088FE" radius={[0, 4, 4, 0]} name="Cantidad" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
