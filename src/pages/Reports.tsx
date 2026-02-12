import { useState, useEffect } from 'react';
import {
    Box, Button, Card, CardContent, Grid, Typography, Chip, Stack, Snackbar, Paper, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, CircularProgress, Divider, TextField, InputAdornment
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PieChartIcon from '@mui/icons-material/PieChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { BarChart, Bar, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getProducts, type Product } from '../services/productService';
import { getTransactions, type Transaction } from '../services/transactionService';
import { getPartners, type Partner } from '../services/partnerService';

type ReportType = 'stock' | 'sales' | 'purchase' | 'profit';

const COLORS = ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#00897b', '#00bcd4', '#ff5722', '#3f51b5'];

export default function Reports() {
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'info' | 'warning';
    }>({ open: false, message: '', severity: 'info' });

    const [previewOpen, setPreviewOpen] = useState(false);
    const [currentReport, setCurrentReport] = useState<ReportType | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Data States
    const [products, setProducts] = useState<Product[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [partners, setPartners] = useState<Partner[]>([]);

    const reports = [
        { id: 'stock' as ReportType, name: 'Stock Report', description: 'Current stock levels and value', type: 'Inventory', icon: BarChartIcon, color: '#2196f3' },
        { id: 'sales' as ReportType, name: 'Sales Report', description: 'Sales by customer and product', type: 'Sales', icon: PieChartIcon, color: '#4caf50' },
        { id: 'purchase' as ReportType, name: 'Purchase Report', description: 'Purchase history and vendor stats', type: 'Purchases', icon: BarChartIcon, color: '#ff9800' },
        { id: 'profit' as ReportType, name: 'Profit & Loss', description: 'Revenue vs Cost analysis', type: 'Financial', icon: TrendingUpIcon, color: '#00897b' },
    ];

    const loadData = async () => {
        try {
            setLoading(true);
            const [productsData, transactionsData, partnersData] = await Promise.all([
                getProducts(),
                getTransactions(),
                getPartners()
            ]);
            setProducts(productsData);
            setTransactions(transactionsData);
            setPartners(partnersData);
        } catch (error) {
            console.error('Failed to load data:', error);
            setSnackbar({ open: true, message: 'Failed to load report data', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = async (reportId: ReportType) => {
        setCurrentReport(reportId);
        setPreviewOpen(true);
        setSearchTerm('');
        await loadData();
    };

    const handleExport = (reportId: ReportType) => {
        const report = reports.find(r => r.id === reportId);
        const data = getReportData(reportId);
        
        if (!data.length) {
            setSnackbar({ open: true, message: 'No data to export', severity: 'warning' });
            return;
        }

        // Convert to CSV
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => Object.values(row).join(',')).join('\n');
        const csv = `${headers}\n${rows}`;
        
        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report?.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        setSnackbar({ open: true, message: `${report?.name} exported successfully!`, severity: 'success' });
    };

    const getReportData = (reportId: ReportType) => {
        try {
            switch (reportId) {
                case 'stock': {
                    if (!products || products.length === 0) return [];
                    const filtered = products.filter(p => 
                        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                    return filtered.map(p => ({
                        'Product Name': p.name,
                        'SKU': p.sku,
                        'Stock Quantity': p.stock_quantity,
                        'Unit Cost': p.cost_price.toFixed(2),
                        'Unit Price': p.price.toFixed(2),
                        'Stock Value (Cost)': (p.stock_quantity * p.cost_price).toFixed(2),
                        'Stock Value (Retail)': (p.stock_quantity * p.price).toFixed(2),
                        'Status': p.stock_quantity < p.min_stock_level ? 'Low Stock' : 'In Stock'
                    }));
                }
                case 'sales': {
                    if (!transactions || transactions.length === 0) return [];
                    const sales = transactions.filter(t => t.type === 'sale');
                    if (sales.length === 0) return [];
                    const partnerMap = Object.fromEntries(partners.map(p => [p.id, p.name]));
                    const filtered = sales.filter(s => {
                        const partnerName = partnerMap[s.partner_id] || 'Unknown';
                        return partnerName.toLowerCase().includes(searchTerm.toLowerCase());
                    });
                    return filtered.map(t => ({
                        'Date': new Date(t.date).toLocaleDateString(),
                        'Customer': partnerMap[t.partner_id] || 'Unknown',
                        'Total Amount': t.total_amount.toFixed(2),
                        'VAT %': t.vat_percent || 0,
                        'Items': t.items?.length || 0
                    }));
                }
                case 'purchase': {
                    if (!transactions || transactions.length === 0) return [];
                    const purchases = transactions.filter(t => t.type === 'purchase');
                    if (purchases.length === 0) return [];
                    const partnerMap = Object.fromEntries(partners.map(p => [p.id, p.name]));
                    const filtered = purchases.filter(p => {
                        const partnerName = partnerMap[p.partner_id] || 'Unknown';
                        return partnerName.toLowerCase().includes(searchTerm.toLowerCase());
                    });
                    return filtered.map(t => ({
                        'Date': new Date(t.date).toLocaleDateString(),
                        'Vendor': partnerMap[t.partner_id] || 'Unknown',
                        'Total Amount': t.total_amount.toFixed(2),
                        'VAT %': t.vat_percent || 0,
                        'Items': t.items?.length || 0
                    }));
                }
                case 'profit': {
                    if (!transactions || transactions.length === 0) return [];
                    const sales = transactions.filter(t => t.type === 'sale');
                    const purchases = transactions.filter(t => t.type === 'purchase');
                    const totalRevenue = sales.reduce((sum, t) => sum + t.total_amount, 0);
                    const totalCost = purchases.reduce((sum, t) => sum + t.total_amount, 0);
                    const profit = totalRevenue - totalCost;
                    const margin = totalRevenue > 0 ? ((profit / totalRevenue) * 100) : 0;
                    return [{
                        'Total Sales Revenue': totalRevenue.toFixed(2),
                        'Total Purchase Cost': totalCost.toFixed(2),
                        'Gross Profit': profit.toFixed(2),
                        'Profit Margin %': margin.toFixed(2),
                        'Sales Transactions': sales.length,
                        'Purchase Transactions': purchases.length
                    }];
                }
                default:
                    return [];
            }
        } catch (error) {
            console.error('Error generating report data:', error);
            return [];
        }
    };

    const renderPreviewContent = () => {
        if (loading) {
            return (
                <Box display="flex" justifyContent="center" alignItems="center" py={8}>
                    <CircularProgress />
                </Box>
            );
        }

        const data = getReportData(currentReport!);

        // Empty state
        if (!data || data.length === 0) {
            return (
                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={8}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No Data Available
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {currentReport === 'stock' && 'No products found. Add products to see the stock report.'}
                        {currentReport === 'sales' && 'No sales transactions found. Create sales to see the sales report.'}
                        {currentReport === 'purchase' && 'No purchase transactions found. Create purchases to see the purchase report.'}
                        {currentReport === 'profit' && 'No transactions found. Create sales and purchases to see profit analysis.'}
                    </Typography>
                </Box>
            );
        }

        switch (currentReport) {
            case 'stock':
                return <StockReportPreview data={data} products={products} searchTerm={searchTerm} />;
            case 'sales':
                return <SalesReportPreview data={data} transactions={transactions.filter(t => t.type === 'sale')} partners={partners} searchTerm={searchTerm} />;
            case 'purchase':
                return <PurchaseReportPreview data={data} transactions={transactions.filter(t => t.type === 'purchase')} partners={partners} searchTerm={searchTerm} />;
            case 'profit':
                return <ProfitLossPreview data={data} transactions={transactions} />;
            default:
                return null;
        }
    };

    const currentReportInfo = reports.find(r => r.id === currentReport);

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
            {/* Header */}
            <Box sx={{ mb: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 400, color: '#1a1a1a' }}>Reports</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Preview and export detailed business reports
                </Typography>
            </Box>

            {/* Reports Grid */}
            <Grid container spacing={{ xs: 2, sm: 2, md: 3 }}>
                {reports.map((report) => {
                    const ReportIcon = report.icon;
                    return (
                        <Grid item xs={12} sm={6} md={6} lg={3} key={report.id}>
                            <Card 
                                elevation={2} 
                                sx={{ 
                                    height: '100%', 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    background: `linear-gradient(135deg, ${report.color}15 0%, ${report.color}05 100%)`, 
                                    border: `1px solid ${report.color}30`,
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 4
                                    }
                                }}
                            >
                                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pb: 1, height: '100%' }}>
                                    <Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                            <Box sx={{ 
                                                p: 1.5, 
                                                bgcolor: report.color, 
                                                color: 'white', 
                                                borderRadius: 2, 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center' 
                                            }}>
                                                <ReportIcon sx={{ fontSize: 24 }} />
                                            </Box>
                                            <Box>
                                                <Typography variant="h6" sx={{ fontWeight: 400, color: '#1a1a1a' }}>
                                                    {report.name}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {report.description}
                                        </Typography>
                                    </Box>

                                    <Stack direction="column" spacing={1} sx={{ mt: 'auto' }}>
                                        <Chip label={report.type} size="small" variant="outlined" />
                                        <Button 
                                            fullWidth
                                            variant="contained"
                                            startIcon={<VisibilityIcon />} 
                                            onClick={() => handlePreview(report.id)}
                                            sx={{ 
                                                bgcolor: report.color,
                                                '&:hover': { bgcolor: report.color, opacity: 0.9 }
                                            }}
                                        >
                                            Preview Report
                                        </Button>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {/* Preview Dialog */}
            <Dialog 
                open={previewOpen} 
                onClose={() => setPreviewOpen(false)}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: { minHeight: '80vh' }
                }}
            >
                <DialogTitle sx={{ 
                    bgcolor: currentReportInfo?.color, 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Box display="flex" alignItems="center" gap={2}>
                        {currentReportInfo && <currentReportInfo.icon />}
                        <Typography variant="h6">{currentReportInfo?.name} - Preview</Typography>
                    </Box>
                    <IconButton onClick={() => setPreviewOpen(false)} sx={{ color: 'white' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 3, bgcolor: '#f5f5f5', pt: 3 }}>
                    {currentReport && ['stock', 'sales', 'purchase'].includes(currentReport) && (
                        <Box sx={{ mb: 2 }}>
                            <TextField
                                fullWidth
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                sx={{ bgcolor: 'white' }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Box>
                    )}
                    
                    {renderPreviewContent()}
                </DialogContent>

                <DialogActions sx={{ p: 2, bgcolor: '#f9f9f9' }}>
                    <Button onClick={() => setPreviewOpen(false)}>Close</Button>
                    <Button 
                        variant="contained" 
                        startIcon={<DownloadIcon />}
                        onClick={() => currentReport && handleExport(currentReport)}
                        disabled={loading || getReportData(currentReport!).length === 0}
                    >
                        Export to CSV
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={4000} 
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Paper 
                    elevation={6} 
                    sx={{ 
                        p: 2, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        backgroundColor: snackbar.severity === 'success' ? '#4caf50' : 
                                       snackbar.severity === 'error' ? '#f44336' : 
                                       snackbar.severity === 'warning' ? '#ff9800' : '#2196f3',
                        color: 'white'
                    }}
                >
                    {snackbar.severity === 'success' && <CheckCircleIcon />}
                    {snackbar.severity === 'error' && <ErrorIcon />}
                    <Typography variant="body2">{snackbar.message}</Typography>
                    <IconButton size="small" onClick={() => setSnackbar({ ...snackbar, open: false })} sx={{ color: 'white' }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Paper>
            </Snackbar>
        </Box>
    );
}

// Stock Report Preview Component
function StockReportPreview({ data, products, searchTerm }: { data: any[], products: Product[], searchTerm: string }) {
    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalStockValue = filtered.reduce((sum, p) => sum + (p.stock_quantity * p.cost_price), 0);
    const totalRetailValue = filtered.reduce((sum, p) => sum + (p.stock_quantity * p.price), 0);
    const lowStockCount = filtered.filter(p => p.stock_quantity < p.min_stock_level).length;

    const chartData = filtered.slice(0, 10).map(p => ({
        name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
        stock: p.stock_quantity,
        minLevel: p.min_stock_level
    }));

    return (
        <Box>
            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: 'white' }}>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary">Total Stock Value (Cost)</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 400, color: '#2196f3' }}>
                                {totalStockValue.toFixed(2)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: 'white' }}>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary">Total Retail Value</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 400, color: '#4caf50' }}>
                                {totalRetailValue.toFixed(2)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: 'white' }}>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary">Low Stock Items</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 400, color: '#f44336' }}>
                                {lowStockCount}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Chart */}
            {chartData.length > 0 && (
                <Card sx={{ mb: 2, p: 2, bgcolor: 'white' }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 400 }}>Stock Levels (Top 10 Products)</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="stock" fill="#2196f3" name="Current Stock" />
                            <Bar dataKey="minLevel" fill="#f44336" name="Min Level" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            )}

            {/* Table */}
            <Card sx={{ bgcolor: 'white' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f9f9f9' }}>
                                {data.length > 0 && Object.keys(data[0]).map((key) => (
                                    <TableCell key={key} sx={{ fontWeight: 400 }}>{key}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.length > 0 ? (
                                data.map((row, idx) => (
                                    <TableRow key={idx} hover>
                                        {Object.entries(row).map(([key, value]: any, i) => (
                                            <TableCell key={i}>
                                                {key === 'Status' ? (
                                                    <Chip 
                                                        label={value} 
                                                        size="small" 
                                                        color={value === 'Low Stock' ? 'error' : 'success'}
                                                        variant="outlined"
                                                    />
                                                ) : value}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">No data to display</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>
        </Box>
    );
}

// Sales Report Preview Component
function SalesReportPreview({ data, transactions, partners, searchTerm }: { data: any[], transactions: Transaction[], partners: Partner[], searchTerm: string }) {
    const partnerMap = Object.fromEntries(partners.map(p => [p.id, p.name]));
    const filtered = transactions.filter(t => {
        const partnerName = partnerMap[t.partner_id] || 'Unknown';
        return partnerName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const totalRevenue = filtered.reduce((sum, t) => sum + t.total_amount, 0);
    const avgOrderValue = filtered.length > 0 ? totalRevenue / filtered.length : 0;

    // Top customers
    const customerSales = filtered.reduce((acc, t) => {
        const name = partnerMap[t.partner_id] || 'Unknown';
        acc[name] = (acc[name] || 0) + t.total_amount;
        return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(customerSales)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));

    return (
        <Box>
            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: 'white' }}>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary">Total Sales Revenue</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 400, color: '#4caf50' }}>
                                {totalRevenue.toFixed(2)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: 'white' }}>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary">Total Transactions</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 400, color: '#2196f3' }}>
                                {filtered.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: 'white' }}>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary">Average Order Value</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 400, color: '#ff9800' }}>
                                {avgOrderValue.toFixed(2)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Chart */}
            {chartData.length > 0 && (
                <Card sx={{ mb: 2, p: 2, bgcolor: 'white' }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 400 }}>Top 5 Customers</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                        <RechartsPie>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(entry) => `${entry.name}: ${entry.value.toFixed(2)}`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </RechartsPie>
                    </ResponsiveContainer>
                </Card>
            )}

            {/* Table */}
            <Card sx={{ bgcolor: 'white' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f9f9f9' }}>
                                {data.length > 0 && Object.keys(data[0]).map((key) => (
                                    <TableCell key={key} sx={{ fontWeight: 400 }}>{key}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.length > 0 ? (
                                data.map((row, idx) => (
                                    <TableRow key={idx} hover>
                                        {Object.values(row).map((value: any, i) => (
                                            <TableCell key={i}>{value}</TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">No sales data to display</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>
        </Box>
    );
}

// Purchase Report Preview Component
function PurchaseReportPreview({ data, transactions, partners, searchTerm }: { data: any[], transactions: Transaction[], partners: Partner[], searchTerm: string }) {
    const partnerMap = Object.fromEntries(partners.map(p => [p.id, p.name]));
    const filtered = transactions.filter(t => {
        const partnerName = partnerMap[t.partner_id] || 'Unknown';
        return partnerName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const totalCost = filtered.reduce((sum, t) => sum + t.total_amount, 0);
    const avgPurchaseValue = filtered.length > 0 ? totalCost / filtered.length : 0;

    // Top vendors
    const vendorPurchases = filtered.reduce((acc, t) => {
        const name = partnerMap[t.partner_id] || 'Unknown';
        acc[name] = (acc[name] || 0) + t.total_amount;
        return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(vendorPurchases)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([name, value]) => ({ 
            name: name.length > 15 ? name.substring(0, 15) + '...' : name, 
            amount: value 
        }));

    return (
        <Box>
            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: 'white' }}>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary">Total Purchase Cost</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 400, color: '#ff9800' }}>
                                {totalCost.toFixed(2)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: 'white' }}>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary">Total Transactions</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 400, color: '#2196f3' }}>
                                {filtered.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: 'white' }}>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary">Average Purchase Value</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 400, color: '#00897b' }}>
                                {avgPurchaseValue.toFixed(2)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Chart */}
            {chartData.length > 0 && (
                <Card sx={{ mb: 2, p: 2, bgcolor: 'white' }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 400 }}>Top Vendors by Purchase Amount</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="amount" fill="#ff9800" name="Purchase Amount" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            )}

            {/* Table */}
            <Card sx={{ bgcolor: 'white' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f9f9f9' }}>
                                {data.length > 0 && Object.keys(data[0]).map((key) => (
                                    <TableCell key={key} sx={{ fontWeight: 400 }}>{key}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.length > 0 ? (
                                data.map((row, idx) => (
                                    <TableRow key={idx} hover>
                                        {Object.values(row).map((value: any, i) => (
                                            <TableCell key={i}>{value}</TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">No purchase data to display</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>
        </Box>
    );
}

// Profit & Loss Preview Component
function ProfitLossPreview({ data, transactions }: { data: any[], transactions: Transaction[] }) {
    const sales = transactions.filter(t => t.type === 'sale');
    const purchases = transactions.filter(t => t.type === 'purchase');
    
    const totalRevenue = sales.reduce((sum, t) => sum + t.total_amount, 0);
    const totalCost = purchases.reduce((sum, t) => sum + t.total_amount, 0);
    const profit = totalRevenue - totalCost;
    const margin = totalRevenue > 0 ? ((profit / totalRevenue) * 100) : 0;

    const chartData = [
        { name: 'Sales Revenue', value: totalRevenue, fill: '#4caf50' },
        { name: 'Purchase Cost', value: totalCost, fill: '#f44336' }
    ];

    return (
        <Box>
            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={3}>
                    <Card sx={{ bgcolor: 'white', border: '2px solid #4caf50', height: '100%' }}>
                        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                                <TrendingUpIcon sx={{ color: '#4caf50' }} />
                                <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 400, color: '#4caf50' }}>
                                {totalRevenue.toFixed(2)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">{sales.length} transactions</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Card sx={{ bgcolor: 'white', border: '2px solid #f44336', height: '100%' }}>
                        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                                <TrendingDownIcon sx={{ color: '#f44336' }} />
                                <Typography variant="body2" color="text.secondary">Total Cost</Typography>
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 400, color: '#f44336' }}>
                                {totalCost.toFixed(2)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">{purchases.length} transactions</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Card sx={{ bgcolor: 'white', border: `2px solid ${profit >= 0 ? '#00897b' : '#f44336'}`, height: '100%' }}>
                        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Gross Profit</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 400, color: profit >= 0 ? '#00897b' : '#f44336' }}>
                                {profit.toFixed(2)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 'auto' }}>
                                {profit >= 0 ? 'Profitable' : 'Loss'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Card sx={{ bgcolor: 'white', border: '2px solid #2196f3', height: '100%' }}>
                        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Profit Margin</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 400, color: '#2196f3' }}>
                                {margin.toFixed(1)}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 'auto' }}>
                                {margin > 20 ? 'Excellent' : margin > 10 ? 'Good' : 'Low'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                    <Card sx={{ p: 2, bgcolor: 'white' }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 400 }}>Revenue vs Cost</Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#2196f3">
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Card sx={{ p: 2, bgcolor: 'white' }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 400 }}>Financial Breakdown</Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <RechartsPie>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry) => `${entry.name}: ${entry.value.toFixed(2)}`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </RechartsPie>
                        </ResponsiveContainer>
                    </Card>
                </Grid>
            </Grid>

            {/* Detailed Table */}
            <Card sx={{ bgcolor: 'white' }}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 400 }}>Financial Summary</Typography>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f9f9f9' }}>
                                    {Object.keys(data[0] || {}).map((key) => (
                                        <TableCell key={key} sx={{ fontWeight: 400 }}>{key}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.map((row, idx) => (
                                    <TableRow key={idx}>
                                        {Object.values(row).map((value: any, i) => (
                                            <TableCell key={i} sx={{ fontWeight: 400, fontSize: '1.1rem' }}>
                                                {value}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
        </Box>
    );
}

