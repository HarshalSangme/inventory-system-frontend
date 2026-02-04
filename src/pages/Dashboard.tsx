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
        <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pb: 2 }}>
            <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{title}</Typography>
                <Typography variant="h4" sx={{ mt: 1.5, fontWeight: 700, color: '#1a1a1a' }}>{value}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                    {trend && trend > 0 && <TrendingUpIcon sx={{ fontSize: 16, color: '#4caf50' }} />}
                    <Typography variant="body2" color="text.secondary">{subtext}</Typography>
                </Box>
            </Box>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon sx={{ fontSize: 28 }} />
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

    // Prepare chart data with realistic values if empty
    const chartData = stats.top_products.length > 0 
        ? stats.top_products 
        : [{ name: 'No Data', value: 0 }];

    const pieData = [
        { name: 'In Stock', value: Math.max(stats.total_products - stats.low_stock_items, 0), color: '#4caf50' },
        { name: 'Low Stock', value: stats.low_stock_items, color: '#ff9800' }
    ];

    return (
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            {/* Page Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a' }}>Dashboard</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Welcome back! Here's your inventory overview.</Typography>
            </Box>

            {/* KPI Cards Grid - Responsive */}
            <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Total Customers" value={stats.total_customers.toString()} subtext="Active partners" icon={PeopleIcon} color="#2196f3" trend={1} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Total Revenue" value={`${stats.total_sales.toFixed(0)}`} subtext="Lifetime sales" icon={InventoryIcon} color="#4caf50" trend={1} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Total Products" value={stats.total_products.toString()} subtext="In inventory" icon={BarChart3} color="#9c27b0" trend={0} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Low Stock Items" value={stats.low_stock_items.toString()} subtext="Requires attention" icon={WarningIcon} color="#f44336" trend={-1} />
                </Grid>
            </Grid>

            {/* Charts Section */}
            <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} sx={{ mb: 4 }}>
                {/* Bar Chart - Top Products */}
                <Grid item xs={12} md={8} lg={8}>
                    <Card elevation={2} sx={{ height: '100%' }}>
                        <CardHeader title="Top Selling Products" subheader="Sales by product" sx={{ pb: 1 }} />
                        <CardContent sx={{ height: 380 }}>
                            {chartData.length > 0 && chartData[0].value !== 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                                        <YAxis />
                                        <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} />
                                        <Bar dataKey="value" fill="#2196f3" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
                                    <Typography>No sales data yet</Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Pie Chart - Stock Status */}
                <Grid item xs={12} sm={6} md={4} lg={4}>
                    <Card elevation={2} sx={{ height: '100%' }}>
                        <CardHeader title="Stock Status" subheader="Product availability" sx={{ pb: 1 }} />
                        <CardContent sx={{ height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
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
                    <CardHeader title="Recent Sales" subheader="Latest transactions" />
                    <CardContent>
                        {stats.recent_sales.length > 0 ? (
                            <Box sx={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #f0f0f0', backgroundColor: '#f9f9f9' }}>
                                            <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: '0.875rem' }}>Date</th>
                                            <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: '0.875rem' }}>Amount</th>
                                            <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, fontSize: '0.875rem' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.recent_sales.map((sale, idx) => (
                                            <tr key={sale.id} style={{ borderBottom: idx < stats.recent_sales.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                                                <td style={{ padding: '12px 16px' }}>{new Date(sale.date).toLocaleDateString()}</td>
                                                <td style={{ padding: '12px 16px', fontWeight: 600, color: '#2e7d32' }}>₹ {sale.total_amount.toFixed(2)}</td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <span style={{ display: 'inline-block', padding: '4px 12px', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>Completed</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Box>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography color="text.secondary">No recent sales</Typography>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Grid>
        </Box>
    );
}
