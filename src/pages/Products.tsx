import React, { useEffect, useState } from 'react';

// Extend the Window interface to allow __refreshProducts
declare global {
    interface Window {
        __refreshProducts?: () => void;
    }
}
import { useUser } from '../context/UserContext';
import { useSnackbar } from '../context/SnackbarContext';
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
    LinearProgress,
    Checkbox,
    Tooltip,
    CircularProgress,
    MenuItem
} from '@mui/material';
import { getProducts, type Product, type ProductForm, createProduct, updateProduct, deleteProduct, importProducts, bulkDeleteProducts } from '../services/productService';
import { getCategories, createCategory, deleteCategory, type Category } from '../services/categoryService';
import ConfirmDialog from '../components/ConfirmDialog';

export function refreshProductsGlobal() {
    // This can be imported and called from anywhere to refresh products
    if (window.__refreshProducts) window.__refreshProducts();
}

export default function Products() {
    const { role } = useUser();
    const { showSnackbar } = useSnackbar();
    const [products, setProducts] = useState<Product[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    // Selection State
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

    // Loading States
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Removed local snackbar state, using global snackbar

    // Import Dialog State
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [uploadMessage, setUploadMessage] = useState('');
    const [dragActive, setDragActive] = useState(false);


    // Category State
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryLoading, setCategoryLoading] = useState(false);
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [categoryError, setCategoryError] = useState('');

    // Form State
    const [formData, setFormData] = useState<ProductForm>({
        name: '',
        sku: '',
        price: 0,
        cost_price: 0,
        stock_quantity: 0,
        min_stock_level: 5,
        description: '',
        category_id: null
    });


    useEffect(() => {
        window.__refreshProducts = loadProducts;
        loadProducts();
        loadCategories();
        return () => { delete window.__refreshProducts; };
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await getProducts();
            setProducts(data);
        } catch (error: any) {
            console.error('Failed to load products', error);
            const msg = error?.response?.data?.detail || 'Failed to load products';
            showSnackbar(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        setCategoryLoading(true);
        try {
            const data = await getCategories();
            setCategories(data);
        } catch (error: any) {
            const msg = error?.response?.data?.detail || 'Failed to load categories';
            showSnackbar(msg, 'error');
        } finally {
            setCategoryLoading(false);
        }
    };


    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (role === 'viewonly') {
            showSnackbar('View Only users cannot add or edit products.', 'error');
            return;
        }
        setSaving(true);
        try {
            // Validation: Selling price cannot be less than cost price
            if (formData.price < formData.cost_price) {
                showSnackbar('Selling price cannot be less than cost price.', 'error');
                setSaving(false);
                return;
            }
            // Check for SKU uniqueness right before creation
            let uniqueSKU = formData.sku;
            const allSKUs = new Set(products.map(p => p.sku.toLowerCase()));
            if (!editingId) {
                // If the SKU already exists, find a new one
                if (allSKUs.has(uniqueSKU.toLowerCase())) {
                    let nextNumber = 1;
                    while (allSKUs.has(`sku-${String(nextNumber).padStart(3, '0')}`)) {
                        nextNumber++;
                    }
                    uniqueSKU = `SKU-${String(nextNumber).padStart(3, '0')}`;
                }
            }
            const productToSave = { ...formData, sku: uniqueSKU };
            // Validation for edit: Selling price cannot be less than cost price
            if (editingId && formData.price < formData.cost_price) {
                showSnackbar('Selling price cannot be less than cost price.', 'error');
                setSaving(false);
                return;
            }
            if (editingId) {
                await updateProduct(editingId, productToSave);
                showSnackbar('Product updated successfully', 'success');
            } else {
                await createProduct(productToSave);
                showSnackbar('Product created successfully', 'success');
            }
            setIsModalOpen(false);
            setEditingId(null);
            await loadProducts();
            setFormData({
                name: '',
                sku: '',
                price: 0,
                cost_price: 0,
                stock_quantity: 0,
                min_stock_level: 5,
                description: '',
                category_id: null
            });
        } catch (error: any) {
            console.error('Failed to create/update product', error);
            const msg = error?.response?.data?.detail || 'Failed to create/update product';
            showSnackbar(msg, 'error');
        } finally {
            setSaving(false);
        }
    };


    const handleEdit = (product: Product) => {
        if (role === 'viewonly') return;
        setEditingId(product.id);
        setFormData({
            name: product.name,
            sku: product.sku,
            price: product.price,
            cost_price: product.cost_price,
            stock_quantity: product.stock_quantity,
            min_stock_level: product.min_stock_level,
            description: product.description || '',
            category_id: product.category_id || null
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (role === 'viewonly') {
            showSnackbar('View Only users cannot delete products.', 'error');
            return;
        }
        setDeleting(true);
        try {
            await deleteProduct(id);
            setProducts(products.filter(p => p.id !== id));
            setDeleteConfirm(null);
            setSelectedIds(selectedIds.filter(sid => sid !== id));
            showSnackbar('Product deleted successfully', 'success');
        } catch (error: any) {
            console.error('Failed to delete product', error);
            const msg = error?.response?.data?.detail || 'Failed to delete product';
            showSnackbar(msg, 'error');
        } finally {
            setDeleting(false);
        }
    };


    const openAddModal = async () => {
        if (role === 'viewonly') return;
        setEditingId(null);
        setLoading(true);
        try {
            // Fetch latest products to get SKUs
            const latestProducts = await getProducts();
            const usedNumbers = new Set(
                latestProducts
                    .map(p => {
                        const match = p.sku.match(/SKU-(\d+)/i);
                        return match ? parseInt(match[1]) : null;
                    })
                    .filter((n): n is number => n !== null && !isNaN(n))
            );
            let nextNumber = 1;
            while (usedNumbers.has(nextNumber)) {
                nextNumber++;
            }
            const nextSKU = `SKU-${String(nextNumber).padStart(3, '0')}`;
            setFormData({
                name: '',
                sku: nextSKU,
                price: 0,
                cost_price: 0,
                stock_quantity: 0,
                min_stock_level: 5,
                description: ''
            });
            setIsModalOpen(true);
        } catch (error: any) {
            const msg = error?.response?.data?.detail || 'Failed to fetch SKUs for new product';
            showSnackbar(msg, 'error');
        } finally {
            setLoading(false);
        }
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
        if (role === 'viewonly') return;
        if (selectedIds.length === 0) return;
        setBulkDeleteConfirm(true);
    };

    const handleBulkDelete = async () => {
        if (role === 'viewonly') {
            showSnackbar('View Only users cannot delete products.', 'error');
            return;
        }
        setBulkDeleteConfirm(false);
        try {
            setBulkDeleteLoading(true);
            await bulkDeleteProducts(selectedIds);
            setProducts(products.filter(p => !selectedIds.includes(p.id)));
            setSelectedIds([]);
            showSnackbar(`Successfully deleted ${selectedIds.length} product(s)`, 'success');
        } catch (error: any) {
            console.error('Failed to bulk delete products', error);
            const msg = error?.response?.data?.detail || 'Failed to delete products';
            showSnackbar(msg, 'error');
        } finally {
            setBulkDeleteLoading(false);
        }
    };

    // Import Dialog Functions
    const handleImportClick = () => {
        if (role === 'viewonly') return;
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
            showSnackbar('Products imported successfully!', 'success');

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
            showSnackbar(errorMessage, 'error');
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

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === '' || (p.category_id === categoryFilter);
        return matchesSearch && matchesCategory;
    });

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 400, color: '#1a1a1a' }}>Products</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Manage your inventory items</Typography>
                </Box>
                <Box>
                    {selectedIds.length > 0 && (
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={bulkDeleteLoading ? <CircularProgress size={16} /> : <DeleteSweepIcon />}
                            onClick={handleBulkDeleteClick}
                            disabled={bulkDeleteLoading || role === 'viewonly'}
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
                        disabled={role === 'viewonly'}
                    >
                        Import Data
                    </Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={openAddModal} size="large" disabled={role === 'viewonly'}>
                        Add Product
                    </Button>
                </Box>
            </Box>

            {/* Search & Filter */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
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
                <Grid item xs={12} md={6}>
                    <TextField
                        select
                        fullWidth
                        label="Filter by Category"
                        value={categoryFilter}
                        onChange={e => setCategoryFilter(e.target.value === '' ? '' : Number(e.target.value))}
                        sx={{ backgroundColor: '#fff' }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <FilterListIcon />
                                </InputAdornment>
                            )
                        }}
                    >
                        <MenuItem value="">All Categories</MenuItem>
                        {categories.map(cat => (
                            <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                        ))}
                    </TextField>
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
                                        <TableCell sx={{ fontWeight: 400, color: '#1a1a1a' }}>Product Name</TableCell>
                                        <TableCell sx={{ fontWeight: 400, color: '#1a1a1a' }}>SKU</TableCell>
                                        <TableCell sx={{ fontWeight: 400, color: '#1a1a1a' }}>Category</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 400, color: '#1a1a1a' }}>Price</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 400, color: '#1a1a1a' }}>Stock</TableCell>
                                        <TableCell sx={{ fontWeight: 400, color: '#1a1a1a' }}>Status</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 400, color: '#1a1a1a' }}>Actions</TableCell>
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
                                            <TableCell>{product.category?.name || <span style={{ color: '#aaa' }}>Uncategorized</span>}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 400, color: '#2e7d32' }}>{product.price}</TableCell>
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
                                                    <span>
                                                        <IconButton size="small" color="primary" onClick={() => handleEdit(product)} disabled={role === 'viewonly'}>
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <span>
                                                        <IconButton size="small" color="error" onClick={() => setDeleteConfirm(product.id)} disabled={role === 'viewonly'}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </span>
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
                <DialogTitle sx={{ fontWeight: 400, py: 2 }}>{editingId ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                <DialogContent>
                    <Box component="form" id="product-form" onSubmit={handleCreate} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
                        <TextField required fullWidth label="Product Name" placeholder="e.g., Laptop" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        <TextField required fullWidth label="SKU / Barcode" placeholder="e.g., SKU001" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} />
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={10}>
                                    <TextField
                                        select
                                        fullWidth
                                        required
                                        label="Category (Vehicle Type)"
                                        value={formData.category_id ?? ''}
                                        onChange={e => setFormData({ ...formData, category_id: e.target.value ? Number(e.target.value) : null })}
                                        disabled={categoryLoading}
                                        helperText={categoryLoading ? 'Loading categories...' : ''}
                                    >
                                        <MenuItem value="">Uncategorized</MenuItem>
                                        {categories.map(cat => (
                                            <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                                        ))}
                                    </TextField>
                            </Grid>
                            <Grid item xs={2}>
                                <Button variant="outlined" size="small" onClick={() => setCategoryDialogOpen(true)} sx={{ minWidth: 0, px: 1 }}>
                                    Manage
                                </Button>
                            </Grid>
                        </Grid>
                                    {/* Category Management Dialog */}
                                    <Dialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)} maxWidth="xs" fullWidth>
                                        <DialogTitle>Manage Categories</DialogTitle>
                                        <DialogContent>
                                            <Box display="flex" gap={1} mb={2}>
                                                <TextField
                                                    label="New Category Name"
                                                    value={newCategoryName}
                                                    onChange={e => setNewCategoryName(e.target.value)}
                                                    fullWidth
                                                    error={!!categoryError}
                                                    helperText={categoryError}
                                                />
                                                <Button
                                                    variant="contained"
                                                    onClick={async () => {
                                                        if (!newCategoryName.trim()) {
                                                            setCategoryError('Name required');
                                                            return;
                                                        }
                                                        setCategoryError('');
                                                        try {
                                                            await createCategory({ name: newCategoryName });
                                                            setNewCategoryName('');
                                                            await loadCategories();
                                                        } catch {
                                                            setCategoryError('Failed to add');
                                                        }
                                                    }}
                                                >
                                                    Add
                                                </Button>
                                            </Box>
                                            <Box>
                                                {categories.map(cat => (
                                                    <Box key={cat.id} display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                                        <span>{cat.name}</span>
                                                        <IconButton size="small" color="error" onClick={async () => {
                                                            await deleteCategory(cat.id);
                                                            await loadCategories();
                                                        }}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                ))}
                                            </Box>
                                        </DialogContent>
                                        <DialogActions>
                                            <Button onClick={() => setCategoryDialogOpen(false)}>Close</Button>
                                        </DialogActions>
                                    </Dialog>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField required fullWidth label="Selling Price" type="number" inputProps={{ step: '0.01', min: '0' }} value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField required fullWidth label="Cost Price" type="number" inputProps={{ step: '0.01', min: '0' }} value={formData.cost_price} onChange={e => setFormData({ ...formData, cost_price: Number(e.target.value) })} />
                            </Grid>
                        </Grid>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField required fullWidth label="Current Stock" type="number" inputProps={{ min: '0' }} value={formData.stock_quantity} onChange={e => setFormData({ ...formData, stock_quantity: Number(e.target.value) })} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField required fullWidth label="Min Stock Level" type="number" inputProps={{ min: '0' }} value={formData.min_stock_level} onChange={e => setFormData({ ...formData, min_stock_level: Number(e.target.value) })} />
                            </Grid>
                        </Grid>
                        <TextField required fullWidth label="Description" multiline rows={3} placeholder="Add product details..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
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
                    <Paper elevation={0} sx={{ mb: 2, p: 2, backgroundColor: '#e3f2fd', border: '1px solid #90caf9' }}>
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

            {/* Global snackbar is now used via SnackbarProvider; local snackbar JSX removed */}
        </Box>
    );
}
