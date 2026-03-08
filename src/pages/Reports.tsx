import { useState, useEffect, useMemo } from 'react';
import { useUser } from '../context/UserContext';
import {
    Box, Button, Card, CardContent, Grid, Typography, Chip, Stack, Snackbar, Paper, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, CircularProgress, TextField, InputAdornment
} from '@mui/material';
import PieChartIcon from '@mui/icons-material/PieChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { BarChart, Bar, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getProducts, type Product } from '../services/productService';
import { getTransactions, type Transaction } from '../services/transactionService';
import { getPartners, type Partner } from '../services/partnerService';
import { exportReport } from '../services/reportService';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';

type ReportType = 'stock' | 'sales' | 'purchase' | 'profit';

const COLORS = ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#00897b', '#00bcd4', '#ff5722', '#3f51b5'];

export default function Reports() {
    const { role } = useUser();
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'info' | 'warning';
    }>({ open: false, message: '', severity: 'info' });

    const [previewOpen, setPreviewOpen] = useState(false);
    const [currentReport, setCurrentReport] = useState<ReportType | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [fromDate, setFromDate] = useState<string | null>(null);
    const [toDate, setToDate] = useState<string | null>(null);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Pagination State
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(25);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // ...existing code...

    // Reload data when filters or pagination changes
    useEffect(() => {
        if (previewOpen && currentReport) {
            loadData();
        }
    }, [previewOpen, currentReport, page, pageSize, debouncedSearch, fromDate, toDate]);

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
            const skip = page * pageSize;
            const limit = pageSize;
            const formatDate = (d: string | null) => d ? new Date(d).toISOString().slice(0, 10) : undefined;
            const fDate = formatDate(fromDate);
            const tDate = formatDate(toDate);

            let productsData: any;
            let transactionsData: any;
            let partnersData: any;

            if (currentReport === 'sales') {
                transactionsData = await getTransactions(skip, limit, 'sale', fDate, tDate, debouncedSearch);
                setTransactions(transactionsData.data);
                setTotal(transactionsData.total);
            } else if (currentReport === 'purchase') {
                transactionsData = await getTransactions(skip, limit, 'purchase', fDate, tDate, debouncedSearch);
                setTransactions(transactionsData.data);
                setTotal(transactionsData.total);
            } else if (currentReport === 'stock') {
                productsData = await getProducts(skip, limit, debouncedSearch);
                setProducts(productsData.data);
                setTotal(productsData.total);
            } else if (currentReport === 'profit') {
                [productsData, transactionsData] = await Promise.all([
                    getProducts(0, 1000),
                    getTransactions(0, 1000, undefined, fDate, tDate)
                ]);
                setProducts(productsData.data);
                setTransactions(transactionsData.data);
                setTotal(1);
            }

            // Always ensure partners are loaded for mapping
            if (partners.length === 0) {
                partnersData = await getPartners(0, 1000);
                setPartners(partnersData.data);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            setSnackbar({ open: true, message: 'Failed to load report data', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = async (reportId: ReportType) => {
        setCurrentReport(reportId);
        setPage(0); // Reset pagination
        setPreviewOpen(true);
        setSearchTerm('');
        // Reset date range when opening preview
        setFromDate(null);
        setToDate(null);
    };

    const handleExport = async (reportId: ReportType, format: 'excel' | 'csv' = 'csv') => {
        const report = reports.find(r => r.id === reportId);
        try {
            setLoading(true);
            const formatDate = (d: string | null) => d ? new Date(d).toISOString().slice(0, 10) : undefined;
            const blob = await exportReport(
                reportId, 
                format, 
                formatDate(fromDate), 
                formatDate(toDate), 
                debouncedSearch
            );

            // Download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${report?.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            setSnackbar({ open: true, message: `${report?.name} exported as ${format.toUpperCase()} successfully!`, severity: 'success' });
        } catch (error) {
            console.error('Export failed:', error);
            setSnackbar({ open: true, message: 'Failed to export report data', severity: 'error' });
        } finally {
            setLoading(false);
        }
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
                        'Category': p.category?.name || '-',
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
                    return sales.map((t, idx) => {
                        let itemName = '-';
                        let skuCode = '-';
                        if (t.items && t.items.length > 0) {
                            const item = t.items[0];
                            skuCode = (item.product && item.product.sku) ? item.product.sku : '-';
                            itemName = (item.product && item.product.name) ? item.product.name : '-';
                        }
                        return {
                            'Sr. No.': idx + 1,
                            'Date': new Date(t.date).toLocaleDateString(),
                            'Customer': partnerMap[t.partner_id] || 'Unknown',
                            'SKU Code': skuCode,
                            'Item Name': itemName,
                            'Amount': t.total_amount.toFixed(2),
                            'Payment Method': t.payment_method || '-',
                            'Sales Person': t.sales_person || '-',
                            'Status': 'Completed',
                        };
                    });
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

                    // Calculate COGS (Cost of Goods Sold)
                    // Iterate through all sales items and sum (quantity * product.cost_price)
                    // Note: This uses CURRENT cost price, which is an approximation if cost price changed over time
                    let totalCOGS = 0;

                    sales.forEach(transaction => {
                        transaction.items.forEach(item => {
                            const product = products.find(p => p.id === item.product_id);
                            if (product) {
                                totalCOGS += item.quantity * product.cost_price;
                            }
                        });
                    });

                    const profit = totalRevenue - totalCOGS;
                    const margin = totalRevenue > 0 ? ((profit / totalRevenue) * 100) : 0;

                    // Also useful metrics
                    const totalInventoryPurchase = purchases.reduce((sum, t) => sum + t.total_amount, 0);

                    return [{
                        'Total Sales Revenue': totalRevenue.toFixed(2),
                        'Total COGS': totalCOGS.toFixed(2),
                        'Gross Profit': profit.toFixed(2),
                        'Profit Margin %': margin.toFixed(2),
                        'Sales Transactions': sales.length,
                        'Inventory Purchases': totalInventoryPurchase.toFixed(2)
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
        if (loading && total === 0) return (
            <Box display="flex" justifyContent="center" alignItems="center" p={4}>
                <CircularProgress size={40} />
            </Box>
        );

        switch (currentReport) {
            case 'stock':
                return (
                    <StockReportPreview 
                        products={products} 
                        loading={loading}
                        total={total}
                        page={page}
                        pageSize={pageSize}
                        onPageChange={setPage}
                        onPageSizeChange={setPageSize}
                    />
                );
            case 'sales':
                return (
                    <SalesReportPreview 
                        transactions={transactions} 
                        partners={partners}
                        loading={loading}
                        total={total}
                        page={page}
                        pageSize={pageSize}
                        onPageChange={setPage}
                        onPageSizeChange={setPageSize}
                        searchTerm={debouncedSearch}
                    />
                );
            case 'purchase':
                return (
                    <PurchaseReportPreview 
                        transactions={transactions} 
                        partners={partners}
                        loading={loading}
                        total={total}
                        page={page}
                        pageSize={pageSize}
                        onPageChange={setPage}
                        onPageSizeChange={setPageSize}
                        searchTerm={debouncedSearch}
                    />
                );
            case 'profit':
                // Profit & Loss doesn't have server-side pagination yet in backend, using client data
                return <ProfitLossPreview data={getReportData('profit')} transactions={transactions} />;
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
                                            onClick={() => role !== 'viewonly' && handlePreview(report.id)}
                                            sx={{
                                                bgcolor: report.color,
                                                '&:hover': { bgcolor: report.color, opacity: 0.9 }
                                            }}
                                            disabled={role === 'viewonly'}
                                        >
                                            Preview Report
                                        </Button>
                                        <Stack direction="row" spacing={1}>
                                            <Button
                                                fullWidth
                                                variant="outlined"
                                                size="small"
                                                startIcon={<FileDownloadIcon />}
                                                onClick={() => handleExport(report.id, 'excel')}
                                                disabled={role === 'viewonly'}
                                                sx={{ color: report.color, borderColor: report.color }}
                                            >
                                                Excel
                                            </Button>
                                            <Button
                                                fullWidth
                                                variant="outlined"
                                                size="small"
                                                startIcon={<FileDownloadIcon />}
                                                onClick={() => handleExport(report.id, 'csv')}
                                                disabled={role === 'viewonly'}
                                                sx={{ color: report.color, borderColor: report.color }}
                                            >
                                                CSV
                                            </Button>
                                        </Stack>
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
                    sx: { minHeight: '80vh', maxHeight: '90vh' }
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


                <DialogContent sx={{ p: 3, bgcolor: '#f5f5f5', pt: 3, display: 'flex', flexDirection: 'column' }}>
                    {previewOpen && (
                        <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <TextField
                                size="small"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                sx={{ bgcolor: 'white', minWidth: 200, flex: 1 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon fontSize="small" />
                                        </InputAdornment>
                                    )
                                }}
                            />
                            {(currentReport === 'sales' || currentReport === 'purchase' || currentReport === 'profit') && (
                                <>
                                    <TextField
                                        label="From Date"
                                        type="date"
                                        size="small"
                                        value={fromDate || ''}
                                        onChange={e => setFromDate(e.target.value || null)}
                                        sx={{ bgcolor: 'white', minWidth: 150, flex: 1 }}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                    <TextField
                                        label="To Date"
                                        type="date"
                                        size="small"
                                        value={toDate || ''}
                                        onChange={e => setToDate(e.target.value || null)}
                                        sx={{ bgcolor: 'white', minWidth: 150, flex: 1 }}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </>
                            )}
                        </Box>
                    )}
                    <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                        {renderPreviewContent()}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button 
                        startIcon={<FileDownloadIcon />} 
                        onClick={() => handleExport(currentReport!, 'excel')}
                        variant="outlined"
                        sx={{ color: currentReportInfo?.color, borderColor: currentReportInfo?.color }}
                    >
                        Excel
                    </Button>
                    <Button 
                        startIcon={<FileDownloadIcon />} 
                        onClick={() => handleExport(currentReport!, 'csv')}
                        variant="outlined"
                        sx={{ color: currentReportInfo?.color, borderColor: currentReportInfo?.color }}
                    >
                        CSV
                    </Button>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button onClick={() => setPreviewOpen(false)} variant="contained" sx={{ bgcolor: '#757575', '&:hover': { bgcolor: '#616161' } }}>
                        Close
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
function StockReportPreview({ 
    products, 
    loading, 
    total, 
    page, 
    pageSize, 
    onPageChange, 
    onPageSizeChange 
}: { 
    products: Product[], 
    loading: boolean,
    total: number,
    page: number,
    pageSize: number,
    onPageChange: (params: any) => void,
    onPageSizeChange: (pageSize: number) => void
}) {
    const totalInventoryValueCost = useMemo(() => products.reduce((sum, p) => sum + (p.stock_quantity * p.cost_price), 0), [products]);
    const totalRetailValue = useMemo(() => products.reduce((sum, p) => sum + (p.stock_quantity * p.price), 0), [products]);
    const lowStockCount = useMemo(() => products.filter(p => p.stock_quantity < p.min_stock_level).length, [products]);

    const columns: GridColDef[] = [
        { field: 'name', headerName: 'Product Name', flex: 1, valueGetter: (params) => params.row.name.toUpperCase() },
        { field: 'sku', headerName: 'SKU', width: 130 },
        { field: 'category', headerName: 'Category', width: 150, valueGetter: (params) => params.row.category?.name?.toUpperCase() || '-' },
        { field: 'stock_quantity', headerName: 'Stock', width: 100, type: 'number' },
        { field: 'cost_price', headerName: 'Cost', width: 100, type: 'number', valueFormatter: (params) => params.value?.toFixed(2) },
        { field: 'price', headerName: 'Retail', width: 100, type: 'number', valueFormatter: (params) => params.value?.toFixed(2) },
        { 
            field: 'status', 
            headerName: 'Status', 
            width: 130,
            renderCell: (params) => {
                const isLow = params.row.stock_quantity < params.row.min_stock_level;
                return (
                    <Chip
                        label={isLow ? 'Low Stock' : 'In Stock'}
                        size="small"
                        color={isLow ? 'error' : 'success'}
                        variant="outlined"
                    />
                );
            }
        },
    ];

    const chartData = useMemo(() => products.slice(0, 10).map(p => ({
        name: p.name.length > 10 ? p.name.substring(0, 10) + '...' : p.name,
        stock: p.stock_quantity,
        minLevel: p.min_stock_level
    })), [products]);

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: 'white' }}>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary">Total Stock Value (Cost)</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 400, color: '#2196f3' }}>
                                {totalInventoryValueCost.toFixed(2)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: 'white' }}>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary">Est. Retail Value</Typography>
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

            {chartData.length > 0 && (
                <Card sx={{ mb: 2, p: 2, bgcolor: 'white' }}>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 400 }}>Stock Levels (Current Page Top 10)</Typography>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} fontSize={10} />
                            <YAxis fontSize={10} />
                            <Tooltip />
                            <Bar dataKey="stock" fill="#2196f3" name="Current Stock" />
                            <Bar dataKey="minLevel" fill="#f44336" name="Min Level" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            )}

            <Card sx={{ flexGrow: 1, minHeight: 400, bgcolor: 'white' }}>
                <DataGrid
                    rows={products}
                    columns={columns}
                    loading={loading}
                    rowCount={total}
                    paginationMode="server"
                    paginationModel={{ page, pageSize }}
                    onPaginationModelChange={(model) => {
                        onPageChange(model.page);
                        onPageSizeChange(model.pageSize);
                    }}
                    pageSizeOptions={[10, 25, 50, 100]}
                    disableRowSelectionOnClick
                    density="compact"
                    sx={{ border: 'none' }}
                />
            </Card>
        </Box>
    );
}

// Sales Report Preview Component
function SalesReportPreview({ 
    transactions, 
    partners, 
    loading, 
    total, 
    page, 
    pageSize, 
    onPageChange, 
    onPageSizeChange,
    searchTerm
}: {
    transactions: Transaction[],
    partners: Partner[],
    loading: boolean,
    total: number,
    page: number,
    pageSize: number,
    onPageChange: (page: number) => void,
    onPageSizeChange: (pageSize: number) => void,
    searchTerm?: string
}) {
    const partnerMap = useMemo(() => Object.fromEntries(partners.map(p => [p.id, p.name])), [partners]);
    
    // Aggregation for summary cards
    const totalRevenue = useMemo(() => transactions.reduce((sum, t) => sum + t.total_amount, 0), [transactions]);
    // Remove avgOrderValue if unused

    const chartData = useMemo(() => {
        const customerSales = transactions.reduce((acc, t) => {
            const name = partnerMap[t.partner_id] || 'Unknown';
            acc[name] = (acc[name] || 0) + t.total_amount;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(customerSales)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, value]) => ({ name, value }));
    }, [transactions, partnerMap]);

    // Flatten transactions for DataGrid (showing items separately if needed, but summary is usually better for table)
    const rows = useMemo(() => {
        const flattened: any[] = [];
        transactions.forEach((t) => {
            t.items.forEach((item, iIdx) => {
                // If search is active, only show items matching name or SKU
                if (searchTerm && searchTerm.length > 2) {
                    const skuMatch = item.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase());
                    const nameMatch = item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase());
                    if (!skuMatch && !nameMatch) return;
                }
                
                flattened.push({
                    id: `${t.id}-${item.product_id}-${iIdx}`,
                    transactionId: t.id,
                    date: t.date,
                    customer: partnerMap[t.partner_id] || 'Unknown',
                    sku: item.product?.sku || '-',
                    itemName: item.product?.name?.toUpperCase() || '-',
                    amount: item.price * item.quantity,
                    paymentMethod: t.payment_method || 'Cash',
                    salesPerson: t.sales_person || '-',
                    status: 'Completed'
                });
            });
        });
        return flattened;
    }, [transactions, partnerMap, searchTerm]);

    const columns: GridColDef[] = [
        { field: 'date', headerName: 'Date', width: 140, valueFormatter: (params) => new Date(params.value).toLocaleDateString() },
        { field: 'customer', headerName: 'Customer', flex: 1 },
        { field: 'sku', headerName: 'SKU', width: 120 },
        { field: 'itemName', headerName: 'Product', flex: 1.5 },
        { field: 'amount', headerName: 'Amount', width: 110, type: 'number', valueFormatter: (params) => params.value?.toFixed(2) },
        { field: 'paymentMethod', headerName: 'Method', width: 110 },
        { field: 'salesPerson', headerName: 'Sales Person', width: 130 },
    ];

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: 'white' }}>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary">Page Revenue</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 400, color: '#4caf50' }}>
                                {totalRevenue.toFixed(2)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: 'white' }}>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary">Page Transactions</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 400, color: '#2196f3' }}>
                                {transactions.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: 'white' }}>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary">Total Records</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 400, color: '#ff9800' }}>
                                {total}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {chartData.length > 0 && (
                <Card sx={{ mb: 2, p: 2, bgcolor: 'white' }}>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 400 }}>Top Customers (Page Data)</Typography>
                    <ResponsiveContainer width="100%" height={200}>
                        <RechartsPie>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(entry) => `${(entry.name || '').substring(0, 10)}: ${entry.value.toFixed(0)}`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {chartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </RechartsPie>
                    </ResponsiveContainer>
                </Card>
            )}

            <Card sx={{ flexGrow: 1, minHeight: 400, bgcolor: 'white' }}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    loading={loading}
                    rowCount={total}
                    paginationMode="server"
                    paginationModel={{ page, pageSize }}
                    onPaginationModelChange={(model) => {
                        onPageChange(model.page);
                        onPageSizeChange(model.pageSize);
                    }}
                    pageSizeOptions={[10, 25, 50, 100]}
                    disableRowSelectionOnClick
                    density="compact"
                    sx={{ border: 'none' }}
                />
            </Card>
        </Box>
    );
}

// Purchase Report Preview Component
function PurchaseReportPreview({ 
    transactions, 
    partners, 
    loading, 
    total, 
    page, 
    pageSize, 
    onPageChange, 
    onPageSizeChange,
    searchTerm
}: { 
    transactions: Transaction[], 
    partners: Partner[], 
    loading: boolean,
    total: number,
    page: number,
    pageSize: number,
    onPageChange: (page: number) => void,
    onPageSizeChange: (pageSize: number) => void,
    searchTerm?: string
}) {
    const partnerMap = useMemo(() => Object.fromEntries(partners.map(p => [p.id, p.name])), [partners]);
    const totalCost = useMemo(() => transactions.reduce((sum, t) => sum + t.total_amount, 0), [transactions]);
    // Remove avgPurchaseValue if unused

    const chartData = useMemo(() => {
        const vendorPurchases = transactions.reduce((acc, t) => {
            const name = partnerMap[t.partner_id] || 'Unknown';
            acc[name] = (acc[name] || 0) + t.total_amount;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(vendorPurchases)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 8)
            .map(([name, value]) => ({
                name: name.length > 12 ? name.substring(0, 12) + '...' : name,
                amount: value
            }));
    }, [transactions, partnerMap]);

    const rows = useMemo(() => {
        const flattened: any[] = [];
        transactions.forEach((t) => {
            t.items.forEach((item, iIdx) => {
                // If search is active, only show items matching name or SKU
                if (searchTerm && searchTerm.length > 2) {
                    const skuMatch = item.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase());
                    const nameMatch = item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase());
                    if (!skuMatch && !nameMatch) return;
                }

                flattened.push({
                    id: `${t.id}-${item.product_id}-${iIdx}`,
                    transactionId: t.id,
                    date: t.date,
                    vendor: partnerMap[t.partner_id] || 'Unknown',
                    sku: item.product?.sku || '-',
                    itemName: item.product?.name?.toUpperCase() || '-',
                    amount: item.price * item.quantity,
                    paymentMethod: t.payment_method || 'Cash',
                    status: 'Completed'
                });
            });
        });
        return flattened;
    }, [transactions, partnerMap, searchTerm]);

    const columns: GridColDef[] = [
        { field: 'date', headerName: 'Date', width: 140, valueFormatter: (params) => new Date(params.value).toLocaleDateString() },
        { field: 'vendor', headerName: 'Vendor', flex: 1 },
        { field: 'sku', headerName: 'SKU', width: 120 },
        { field: 'itemName', headerName: 'Product', flex: 1.5 },
        { field: 'amount', headerName: 'Amount', width: 110, type: 'number', valueFormatter: (params) => params.value?.toFixed(2) },
        { field: 'paymentMethod', headerName: 'Method', width: 110 },
    ];

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: 'white' }}>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary">Page Purchase Cost</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 400, color: '#ff9800' }}>
                                {totalCost.toFixed(2)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: 'white' }}>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary">Page Transactions</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 400, color: '#2196f3' }}>
                                {transactions.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: 'white' }}>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary">Total Records</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 400, color: '#00897b' }}>
                                {total}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {chartData.length > 0 && (
                <Card sx={{ mb: 2, p: 2, bgcolor: 'white' }}>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 400 }}>Top Vendors (Page Data)</Typography>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} fontSize={10} />
                            <YAxis fontSize={10} />
                            <Tooltip />
                            <Bar dataKey="amount" fill="#ff9800" name="Purchase Amount" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            )}

            <Card sx={{ flexGrow: 1, minHeight: 400, bgcolor: 'white' }}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    loading={loading}
                    rowCount={total}
                    paginationMode="server"
                    paginationModel={{ page, pageSize }}
                    onPaginationModelChange={(model) => {
                        onPageChange(model.page);
                        onPageSizeChange(model.pageSize);
                    }}
                    pageSizeOptions={[10, 25, 50, 100]}
                    disableRowSelectionOnClick
                    density="compact"
                    sx={{ border: 'none' }}
                />
            </Card>
        </Box>
    );
}

// Profit & Loss Preview Component
function ProfitLossPreview({ data, transactions }: { data: any[], transactions: Transaction[] }) {
    const sales = transactions.filter(t => t.type === 'sale');

    const reportData = data[0] || {};
    const totalRevenue = parseFloat(reportData['Total Sales Revenue'] || '0');
    const totalCOGS = parseFloat(reportData['Total COGS'] || '0');
    const profit = parseFloat(reportData['Gross Profit'] || '0');
    const margin = totalRevenue > 0 ? ((profit / totalRevenue) * 100) : 0;

    const chartData = [
        { name: 'Sales Revenue', value: totalRevenue, fill: '#4caf50' },
        { name: 'Cost of Goods Sold', value: totalCOGS, fill: '#f44336' }
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
                                <Typography variant="body2" color="text.secondary">Cost of Goods Sold (COGS)</Typography>
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 400, color: '#f44336' }}>
                                {totalCOGS.toFixed(2)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">Based on products sold</Typography>
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

