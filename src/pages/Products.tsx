import React, { useEffect, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import {
    Box,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    IconButton,
    InputAdornment,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    Chip,
    Stack,
    LinearProgress,
    Snackbar,
    Checkbox,
    Tooltip,
    CircularProgress
} from '@mui/material';
import { getProducts, type Product, createProduct, updateProduct, deleteProduct, importProducts, bulkDeleteProducts } from '../services/productService';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    
    // Selection State
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
    
    // Loading States
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    
    // Snackbar State
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'info' | 'warning';
    }>({ open: false, message: '', severity: 'success' });
    
    // Import Dialog State
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [uploadMessage, setUploadMessage] = useState('');
    const [dragActive, setDragActive] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        price: 0,
        cost_price: 0,
        min_stock_level: 5,
        description: ''
    });

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await getProducts();
            setProducts(data);
        } catch (error) {
            console.error('Failed to load products', error);
            setSnackbar({ open: true, message: 'Failed to load products', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingId) {
                await updateProduct(editingId, formData);
                setSnackbar({ open: true, message: 'Product updated successfully', severity: 'success' });
            } else {
                await createProduct(formData);
                setSnackbar({ open: true, message: 'Product created successfully', severity: 'success' });
            }
            setIsModalOpen(false);
            setEditingId(null);
            await loadProducts();
            setFormData({
                name: '',
                sku: '',
                price: 0,
                cost_price: 0,
                min_stock_level: 5,
                description: ''
            });
        } catch (error) {
            console.error('Failed to create/update product', error);
            setSnackbar({ open: true, message: 'Failed to create/update product', severity: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (product: Product) => {
        setEditingId(product.id);
        setFormData({
            name: product.name,
            sku: product.sku,
            price: product.price,
            cost_price: product.cost_price,
            min_stock_level: product.min_stock_level,
            description: product.description || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        setDeleting(true);
        try {
            await deleteProduct(id);
            setProducts(products.filter(p => p.id !== id));
            setDeleteConfirm(null);
            setSelectedIds(selectedIds.filter(sid => sid !== id));
            setSnackbar({ open: true, message: 'Product deleted successfully', severity: 'success' });
        } catch (error) {
            console.error('Failed to delete product', error);
            setSnackbar({ open: true, message: 'Failed to delete product', severity: 'error' });
        } finally {
            setDeleting(false);
        }
    };

    const openAddModal = () => {
        setEditingId(null);
        setFormData({
            name: '',
            sku: '',
            price: 0,
            cost_price: 0,
            min_stock_level: 5,
            description: ''
        });
        setIsModalOpen(true);
    };

    // Selection Functions
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(filteredProducts.map(p => p.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedIds([...selectedIds, id]);
        } else {
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        }
    };

    const handleBulkDeleteClick = () => {
        if (selectedIds.length === 0) return;
        setBulkDeleteConfirm(true);
    };

    const handleBulkDelete = async () => {
        setBulkDeleteConfirm(false);
        
        try {
            setBulkDeleteLoading(true);
            await bulkDeleteProducts(selectedIds);
            setProducts(products.filter(p => !selectedIds.includes(p.id)));
            setSelectedIds([]);
            setSnackbar({ 
                open: true, 
                message: `Successfully deleted ${selectedIds.length} product(s)`, 
                severity: 'success' 
            });
        } catch (error) {
            console.error('Failed to bulk delete products', error);
            setSnackbar({ open: true, message: 'Failed to delete products', severity: 'error' });
        } finally {
            setBulkDeleteLoading(false);
        }
    };

    // Import Dialog Functions
    const handleImportClick = () => {
        setImportDialogOpen(true);
        setSelectedFile(null);
        setUploadStatus('idle');
        setUploadMessage('');
        setUploadProgress(0);
    };

    const handleFileSelect = (file: File) => {
        if (file && file.name.endsWith('.xlsx')) {
            setSelectedFile(file);
            setUploadStatus('idle');
            setUploadMessage('');
        } else {
            setUploadMessage('Please select a valid Excel file (.xlsx)');
            setUploadStatus('error');
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleImportUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        setUploadProgress(0);
        setUploadStatus('idle');

        // Simulate progress
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 90) {
                    clearInterval(progressInterval);
                    return 90;
                }
                return prev + 10;
            });
        }, 200);

        try {
            const result = await importProducts(selectedFile);
            clearInterval(progressInterval);
            setUploadProgress(100);
            setUploadStatus('success');
            setUploadMessage(result.message || 'Products imported successfully!');
            
            // Show snackbar and reload
            setSnackbar({ open: true, message: 'Products imported successfully!', severity: 'success' });
            
            // Reload products after 1.5 seconds
            setTimeout(async () => {
                await loadProducts();
                setTimeout(() => {
                    setImportDialogOpen(false);
                    setSelectedFile(null);
                    setUploadStatus('idle');
                    setUploadMessage('');
                }, 1000);
            }, 1500);
        } catch (err: any) {
            clearInterval(progressInterval);
            setUploadProgress(0);
            setUploadStatus('error');
            const errorMessage = err.response?.data?.detail || 'Failed to import products. Please check the file format.';
            setUploadMessage(errorMessage);
            setSnackbar({ open: true, message: errorMessage, severity: 'error' });
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setUploadStatus('idle');
        setUploadMessage('');
        setUploadProgress(0);
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a' }}>Products</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Manage your inventory items</Typography>
                </Box>
                <Box>
                    {selectedIds.length > 0 && (
                        <Button 
                            variant="outlined" 
                            color="error"
                            startIcon={bulkDeleteLoading ? <CircularProgress size={16} /> : <DeleteSweepIcon />}
                            onClick={handleBulkDeleteClick}
                            disabled={bulkDeleteLoading}
                            sx={{ mr: 2 }}
                        >
                            Delete {selectedIds.length} Selected
                        </Button>
                    )}
                    <Button 
                        variant="outlined" 
                        startIcon={<CloudUploadIcon />}
                        onClick={handleImportClick}
                        sx={{ mr: 2 }}
                    >
                        Import Data
                    </Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={openAddModal} size="large">
                        Add Product
                    </Button>
                </Box>
            </Box>

            {/* Search & Filter */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={8}>
                    <TextField
                        fullWidth
                        placeholder="Search by name or SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            )
                        }}
                        sx={{ backgroundColor: '#fff' }}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <Stack direction="row" spacing={1}>
                        <Button fullWidth variant="outlined" startIcon={<FilterListIcon />}>Filter</Button>
                    </Stack>
                </Grid>
            </Grid>

            {/* Products Table */}
            <Card elevation={2}>
                <CardContent>
                    {loading ? (
                        <Box display="flex" justifyContent="center" py={4}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #f0f0f0' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={filteredProducts.length > 0 && selectedIds.length === filteredProducts.length}
                                                indeterminate={selectedIds.length > 0 && selectedIds.length < filteredProducts.length}
                                                onChange={(e) => handleSelectAll(e.target.checked)}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#1a1a1a' }}>Product Name</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#1a1a1a' }}>SKU</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, color: '#1a1a1a' }}>Price</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, color: '#1a1a1a' }}>Stock</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#1a1a1a' }}>Status</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, color: '#1a1a1a' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredProducts.map(product => (
                                        <TableRow key={product.id} hover sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }}>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={selectedIds.includes(product.id)}
                                                    onChange={(e) => handleSelectOne(product.id, e.target.checked)}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 500 }}>{product.name}</TableCell>
                                            <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{product.sku}</Typography></TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, color: '#2e7d32' }}>{product.price}</TableCell>
                                            <TableCell align="right">{product.stock_quantity}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={product.stock_quantity < product.min_stock_level ? 'Low Stock' : 'In Stock'}
                                                    color={product.stock_quantity < product.min_stock_level ? 'error' : 'success'}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Tooltip title="Edit">
                                                    <IconButton size="small" color="primary" onClick={() => handleEdit(product)}>
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton size="small" color="error" onClick={() => setDeleteConfirm(product.id)}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredProducts.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                                <Typography color="text.secondary">No products found</Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Product Dialog */}
            <Dialog open={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingId(null); }} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 700, py: 2 }}>{editingId ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                <DialogContent>
                    <Box component="form" id="product-form" onSubmit={handleCreate} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
                        <TextField required fullWidth label="Product Name" placeholder="e.g., Laptop" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        <TextField required fullWidth label="SKU / Barcode" placeholder="e.g., SKU001" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} />
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField required fullWidth label="Selling Price" type="number" inputProps={{ step: '0.01', min: '0' }} value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField required fullWidth label="Cost Price" type="number" inputProps={{ step: '0.01', min: '0' }} value={formData.cost_price} onChange={e => setFormData({ ...formData, cost_price: Number(e.target.value) })} />
                            </Grid>
                        </Grid>
                        <TextField required fullWidth label="Min Stock Level" type="number" inputProps={{ min: '0' }} value={formData.min_stock_level} onChange={e => setFormData({ ...formData, min_stock_level: Number(e.target.value) })} />
                        <TextField fullWidth label="Description" multiline rows={3} placeholder="Add product details..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => { setIsModalOpen(false); setEditingId(null); }} disabled={saving}>Cancel</Button>
                    <Button 
                        type="submit" 
                        form="product-form" 
                        variant="contained"
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
                    >
                        {saving ? 'Saving...' : (editingId ? 'Update' : 'Save')} Product
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={deleteConfirm !== null}
                title="Delete Product?"
                message="Are you sure you want to delete this product? This action cannot be undone."
                onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
                onCancel={() => setDeleteConfirm(null)}
                confirmText="Delete"
                confirmColor="error"
                severity="error"
                loading={deleting}
            />

            {/* Bulk Delete Confirmation Dialog */}
            <ConfirmDialog
                open={bulkDeleteConfirm}
                title="Delete Multiple Products?"
                message={`Are you sure you want to delete ${selectedIds.length} product(s)? This action cannot be undone.`}
                onConfirm={handleBulkDelete}
                onCancel={() => setBulkDeleteConfirm(false)}
                confirmText="Delete All"
                confirmColor="error"
                severity="warning"
                loading={bulkDeleteLoading}
            />

            {/* Import Dialog */}
            <Dialog 
                open={importDialogOpen} 
                onClose={() => !uploading && setImportDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ pb: 1 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={1}>
                            <CloudUploadIcon />
                            <Typography variant="h6">Import Products</Typography>
                        </Box>
                        <IconButton 
                            onClick={() => !uploading && setImportDialogOpen(false)}
                            disabled={uploading}
                            size="small"
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                
                <DialogContent>
                    {/* Instructions */}
                    <Paper elevation={0} sx={{ mb: 3, p: 2, backgroundColor: '#e3f2fd', border: '1px solid #90caf9' }}>
                        <Typography variant="body2" fontWeight={700} sx={{ mb: 1, color: '#1976d2' }}>
                            📋 Excel File Requirements:
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                            ✓ <strong>File format:</strong> .xlsx (Excel file)
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                            ✓ <strong>Header row:</strong> Must be on row 3 of your Excel sheet
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            ✓ <strong>Required columns</strong> (exact names):
                        </Typography>
                        <Box sx={{ pl: 2, mb: 1 }}>
                            <Typography variant="caption" component="div" sx={{ fontFamily: 'monospace', mb: 0.3 }}>
                                • DESCRIPTION (product name)
                            </Typography>
                            <Typography variant="caption" component="div" sx={{ fontFamily: 'monospace', mb: 0.3 }}>
                                • RATE (cost price)
                            </Typography>
                            <Typography variant="caption" component="div" sx={{ fontFamily: 'monospace', mb: 0.3 }}>
                                • Retail Price without VAT (selling price)
                            </Typography>
                            <Typography variant="caption" component="div" sx={{ fontFamily: 'monospace', mb: 0.3 }}>
                                • Order Qty (stock quantity)
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            💡 Tip: Column names must match exactly (case-sensitive)
                        </Typography>
                    </Paper>

                    {!selectedFile ? (
                        /* Drag & Drop Area */
                        <Box
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            sx={{
                                border: '2px dashed',
                                borderColor: dragActive ? 'primary.main' : 'grey.300',
                                borderRadius: 2,
                                p: 4,
                                textAlign: 'center',
                                backgroundColor: dragActive ? 'action.hover' : 'background.paper',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    backgroundColor: 'action.hover'
                                }
                            }}
                            onClick={() => document.getElementById('file-input')?.click()}
                        >
                            <CloudUploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                Drag & Drop your Excel file here
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                or
                            </Typography>
                            <Button variant="contained" sx={{ mt: 2 }}>
                                Browse Files
                            </Button>
                            <input
                                id="file-input"
                                type="file"
                                accept=".xlsx"
                                style={{ display: 'none' }}
                                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                            />
                        </Box>
                    ) : (
                        /* Selected File Display */
                        <Box>
                            <Paper 
                                elevation={0}
                                sx={{ 
                                    p: 2, 
                                    backgroundColor: '#f5f5f5',
                                    border: '1px solid',
                                    borderColor: 'grey.300',
                                    borderRadius: 2
                                }}
                            >
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Box display="flex" alignItems="center" gap={2} flex={1}>
                                        <DescriptionIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                                        <Box flex={1}>
                                            <Typography variant="subtitle1" fontWeight={600}>
                                                {selectedFile.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {(selectedFile.size / 1024).toFixed(2)} KB
                                            </Typography>
                                        </Box>
                                    </Box>
                                    {!uploading && (
                                        <IconButton 
                                            onClick={handleRemoveFile}
                                            size="small"
                                            color="error"
                                        >
                                            <CloseIcon />
                                        </IconButton>
                                    )}
                                </Box>
                            </Paper>

                            {/* Progress Bar */}
                            {uploading && (
                                <Box sx={{ mt: 3 }}>
                                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                        <Typography variant="body2" color="text.secondary">
                                            Uploading...
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600}>
                                            {uploadProgress}%
                                        </Typography>
                                    </Box>
                                    <LinearProgress 
                                        variant="determinate" 
                                        value={uploadProgress}
                                        sx={{
                                            height: 8,
                                            borderRadius: 1,
                                            backgroundColor: 'grey.200',
                                            '& .MuiLinearProgress-bar': {
                                                backgroundColor: '#1a1a1a',
                                                borderRadius: 1
                                            }
                                        }}
                                    />
                                </Box>
                            )}

                            {/* Status Messages */}
                            {uploadStatus === 'success' && (
                                <Paper elevation={0} sx={{ mt: 2, p: 2, backgroundColor: '#e8f5e9', border: '1px solid #4caf50', display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CheckCircleIcon sx={{ color: '#4caf50' }} />
                                    <Typography variant="body2">{uploadMessage}</Typography>
                                </Paper>
                            )}
                            {uploadStatus === 'error' && (
                                <Paper elevation={0} sx={{ mt: 2, p: 2, backgroundColor: '#ffebee', border: '1px solid #f44336', display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ErrorIcon sx={{ color: '#f44336' }} />
                                    <Typography variant="body2">{uploadMessage}</Typography>
                                </Paper>
                            )}
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button 
                        onClick={() => setImportDialogOpen(false)}
                        disabled={uploading}
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="contained"
                        onClick={handleImportUpload}
                        disabled={!selectedFile || uploading || uploadStatus === 'success'}
                        startIcon={uploading ? null : <CloudUploadIcon />}
                    >
                        {uploading ? 'Importing...' : 'Import Products'}
                    </Button>
                </DialogActions>
            </Dialog>

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
