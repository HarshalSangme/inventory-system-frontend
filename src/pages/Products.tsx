import React, { useEffect, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
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
    Alert
} from '@mui/material';
import { getProducts, type Product, createProduct, updateProduct, deleteProduct } from '../services/productService';

export default function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

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
            const data = await getProducts();
            setProducts(data);
        } catch (error) {
            console.error('Failed to load products', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateProduct(editingId, formData);
                alert('Product updated successfully');
            } else {
                await createProduct(formData);
                alert('Product created successfully');
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
            alert('Failed to create/update product');
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
        try {
            await deleteProduct(id);
            setProducts(products.filter(p => p.id !== id));
            setDeleteConfirm(null);
            alert('Product deleted successfully');
        } catch (error) {
            console.error('Failed to delete product', error);
            alert('Failed to delete product');
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
                <Button variant="contained" startIcon={<AddIcon />} onClick={openAddModal} size="large">
                    Add Product
                </Button>
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
                    <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #f0f0f0' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
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
                                        <TableCell sx={{ fontWeight: 500 }}>{product.name}</TableCell>
                                        <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{product.sku}</Typography></TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600, color: '#2e7d32' }}>₹{product.price}</TableCell>
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
                                            <IconButton size="small" color="primary" onClick={() => handleEdit(product)} title="Edit"><EditIcon fontSize="small" /></IconButton>
                                            <IconButton size="small" color="error" onClick={() => setDeleteConfirm(product.id)} title="Delete"><DeleteIcon fontSize="small" /></IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredProducts.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                            <Typography color="text.secondary">No products found</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
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
                    <Button onClick={() => { setIsModalOpen(false); setEditingId(null); }}>Cancel</Button>
                    <Button type="submit" form="product-form" variant="contained">{editingId ? 'Update' : 'Save'} Product</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)}>
                <DialogTitle>Delete Product?</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to delete this product? This action cannot be undone.</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                    <Button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} color="error" variant="contained">Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
