import { useEffect, useState } from 'react';
import { getDashboardStats, type DashboardStats } from '../services/dashboardService';
import { BarChart3 } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleIcon from '@mui/icons-material/People';
import WarningIcon from '@mui/icons-material/Warning';

const StatCard = ({ title, value, subtext, icon: Icon, color, trend }: { title: string; value: string; subtext?: string, icon: any, color: string, trend?: number }) => (
    <Card elevation={2} sx={{ background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`, border: `1px solid ${color}30`, height: '100%' }}>
        <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', py: 1.5, px: 2 }}>
            <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, fontSize: 11 }}>{title}</Typography>
                <Typography variant="subtitle1" sx={{ mt: 0.5, fontWeight: 400, color: '#1a1a1a', fontSize: '1.25rem' }}>{value}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    {trend && trend > 0 && <TrendingUpIcon sx={{ fontSize: 12, color: '#4caf50' }} />}
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>{subtext}</Typography>
                </Box>
            </Box>
            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon sx={{ fontSize: 20 }} />
            </Box>
        </CardContent>
    </Card>
);

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const data = await getDashboardStats();
                setStats(data);
            } catch (error) {
                console.error('Failed to load dashboard stats', error);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, []);

    if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><Typography>Loading dashboard...</Typography></Box>;
    if (!stats) return <Box sx={{ p: 4, textAlign: 'center' }}><Typography color="error">Error loading dashboard.</Typography></Box>;

    // Prepare chart data
    const chartData = stats.top_stock_products.map(p => ({
        name: p.name,
        value: p.stock_quantity,
        min_stock_level: p.min_stock_level
    }));
    const pieData = [
        { name: 'In Stock', value: Math.max(stats.total_products - stats.low_stock_items, 0), color: '#4caf50' },
        { name: 'Low Stock', value: stats.low_stock_items, color: '#ff9800' }
    ];

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
            {/* Page Header */}
            <Box sx={{ mb: 2.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 400, color: '#1a1a1a', fontSize: '1.25rem' }}>Dashboard</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, fontSize: 11 }}>Welcome back! Here's your inventory overview.</Typography>
            </Box>

            {/* KPI Cards Grid - Responsive */}
            <Grid container spacing={{ xs: 1.5, sm: 1.5, md: 2 }} sx={{ mb: 2.5 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Total Stock Value (Cost)" value={stats.total_stock_value.toFixed(2)} subtext="Inventory cost" icon={InventoryIcon} color="#2196f3" trend={1} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Total Retail Value" value={stats.total_retail_value.toFixed(2)} subtext="Retail value" icon={BarChart3} color="#4caf50" trend={1} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Low Stock Items" value={stats.low_stock_items.toString()} subtext="Requires attention" icon={WarningIcon} color="#f44336" trend={-1} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Total Products" value={stats.total_products.toString()} subtext="In inventory" icon={PeopleIcon} color="#9c27b0" trend={0} />
                </Grid>
            </Grid>

            {/* Charts Section */}
            <Grid container spacing={{ xs: 1.5, sm: 1.5, md: 2 }} sx={{ mb: 2.5 }}>
                {/* Bar Chart - Top Stocked Products */}
                <Grid item xs={12} md={8} lg={8}>
                    <Card elevation={2} sx={{ height: '100%' }}>
                        <CardHeader title="Stock Levels (Top 10 Products)" subheader="Current vs Min Level" sx={{ pb: 0.5, '& .MuiCardHeader-title': { fontSize: 14 }, '& .MuiCardHeader-subheader': { fontSize: 11 } }} />
                        <CardContent sx={{ height: 280 }}>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 8, right: 20, left: 0, bottom: 24 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 10 }} />
                                        <YAxis tick={{ fontSize: 10 }} />
                                        <Tooltip content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const p = payload[0].payload;
                                                return (
                                                    <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 6, padding: 8, fontSize: 12 }}>
                                                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                                                        <div style={{ color: '#2196f3' }}>Current Stock : {p.value}</div>
                                                        <div style={{ color: '#f44336' }}>Min Level : {p.min_stock_level}</div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }} />
                                        <Bar dataKey="value" fill="#2196f3" radius={[6, 6, 0, 0]} />
                                        <Bar dataKey="min_stock_level" fill="#f44336" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
                                    <Typography>No stock data yet</Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Pie Chart - Stock Status */}
                <Grid item xs={12} sm={6} md={4} lg={4}>
                    <Card elevation={2} sx={{ height: '100%' }}>
                        <CardHeader title="Stock Status" subheader="Product availability" sx={{ pb: 0.5, '& .MuiCardHeader-title': { fontSize: 14 }, '& .MuiCardHeader-subheader': { fontSize: 11 } }} />
                        <CardContent sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={5} dataKey="value">
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `${value} items`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Recent Sales Table */}
            <Grid item xs={12}>
                <Card elevation={2}>
                    <CardHeader title="Recent Sales" subheader="Latest transactions" sx={{ '& .MuiCardHeader-title': { fontSize: 14 }, '& .MuiCardHeader-subheader': { fontSize: 11 } }} />
                    <CardContent sx={{ py: 1 }}>
                        {stats.recent_sales.length > 0 ? (
                            <Box sx={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #f0f0f0', backgroundColor: '#f9f9f9' }}>
                                            <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 400, fontSize: '0.75rem' }}>Date</th>
                                            <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 400, fontSize: '0.75rem' }}>Amount</th>
                                            <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 400, fontSize: '0.75rem' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.recent_sales.map((sale, idx) => (
                                            <tr key={sale.id} style={{ borderBottom: idx < stats.recent_sales.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                                                <td style={{ padding: '8px 12px', fontSize: '0.75rem' }}>{new Date(sale.date).toLocaleDateString()}</td>
                                                <td style={{ padding: '8px 12px', fontWeight: 400, color: '#2e7d32', fontSize: '0.75rem' }}>{sale.total_amount.toFixed(2)}</td>
                                                <td style={{ padding: '8px 12px' }}>
                                                    <span style={{ display: 'inline-block', padding: '2px 8px', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: 3, fontSize: '0.65rem', fontWeight: 400 }}>Completed</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Box>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 2 }}>
                                <Typography variant="caption" color="text.secondary">No recent sales</Typography>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Grid>
        </Box>
    );
}
