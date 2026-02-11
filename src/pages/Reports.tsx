import DownloadIcon from '@mui/icons-material/Download';
import PieChartIcon from '@mui/icons-material/PieChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import { Box, Button, Card, CardContent, Grid, Typography, Chip, Stack, Snackbar, Paper, IconButton } from '@mui/material';
import { useState } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CloseIcon from '@mui/icons-material/Close';

export default function Reports() {
    // Snackbar State
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'info' | 'warning';
    }>({ open: false, message: '', severity: 'info' });
    const reports = [
        { name: 'Stock Report', description: 'Current stock levels and value', type: 'Inventory', icon: BarChartIcon, color: '#2196f3' },
        { name: 'Sales Report', description: 'Sales by customer and product', type: 'Sales', icon: PieChartIcon, color: '#4caf50' },
        { name: 'Purchase Report', description: 'Purchase history and vendor stats', type: 'Purchases', icon: BarChartIcon, color: '#ff9800' },
        { name: 'Profit & Loss', description: 'Revenue vs Cost analysis', type: 'Financial', icon: PieChartIcon, color: '#9c27b0' },
    ];

    const handleExport = (reportName: string) => {
        setSnackbar({ open: true, message: `Exporting ${reportName}...`, severity: 'info' });
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a' }}>Reports</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Generate and export detailed business reports</Typography>
            </Box>

            {/* Reports Grid */}
            <Grid container spacing={{ xs: 2, sm: 2, md: 3 }}>
                {reports.map((report, index) => {
                    const ReportIcon = report.icon;
                    return (
                        <Grid item xs={12} sm={6} md={6} lg={3} key={index}>
                            <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: `linear-gradient(135deg, ${report.color}15 0%, ${report.color}05 100%)`, border: `1px solid ${report.color}30` }}>
                                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pb: 1, height: '100%' }}>
                                    <Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                            <Box sx={{ p: 1.5, bgcolor: report.color, color: 'white', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <ReportIcon sx={{ fontSize: 24 }} />
                                            </Box>
                                            <Box>
                                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a' }}>{report.name}</Typography>
                                            </Box>
                                        </Box>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{report.description}</Typography>
                                    </Box>

                                    <Stack direction="row" spacing={1} sx={{ mt: 'auto' }}>
                                        <Chip label={report.type} size="small" variant="outlined" />
                                        <Button size="small" startIcon={<DownloadIcon />} onClick={() => handleExport(report.name)} sx={{ ml: 'auto' }}>Export</Button>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {/* Snackbar for notifications */}
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

