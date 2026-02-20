import { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
    Box,
    Button,
    Grid,
    IconButton,
    MenuItem,
    Select,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
    Snackbar,
    Paper,
    CircularProgress,
    Divider,
    Chip,
    Tooltip
} from '@mui/material';
import { createTransaction, type TransactionCreate, type TransactionItem } from '../services/transactionService';
import { getProducts, type Product } from '../services/productService';
import { getCategories, type Category } from '../services/categoryService';
import { getPartners, type Partner } from '../services/partnerService';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CloseIcon from '@mui/icons-material/Close';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';


// Type-only import must be at the top for verbatimModuleSyntax
import type { Transaction } from '../services/transactionService';

interface CreateTransactionProps {
    type: 'purchase' | 'sale';
    onClose: () => void;
    onSuccess: () => void;
    editData?: Transaction;
    onEdit?: (data: TransactionCreate) => void;
}

export default function CreateTransaction({ type, onClose, onSuccess, editData, onEdit }: CreateTransactionProps) {
    const { role } = useUser();
    const [partners, setPartners] = useState<Partner[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
    const [productSearch, setProductSearch] = useState('');
    const [selectedPartnerId, setSelectedPartnerId] = useState<number | ''>(editData ? editData.partner_id : '');
    const [items, setItems] = useState<TransactionItem[]>(editData ? editData.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount || 0
    })) : []);
    const [vatPercent, setVatPercent] = useState<number>(editData ? editData.vat_percent || 0 : 0);
    // When editData or products change, update form state for editing
    useEffect(() => {
        if (editData && products.length > 0) {
            setSelectedPartnerId(editData.partner_id);
            setItems(editData.items.map(item => {
                // Find the product to ensure dropdowns and details match
                const prod = products.find(p => p.id === item.product_id);
                return {
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price: prod ? prod.price : item.price,
                    discount: item.discount || 0
                };
            }));
            setVatPercent(editData.vat_percent || 0);
        } else if (!editData) {
            setSelectedPartnerId('');
            setItems([]);
            setVatPercent(0);
        }
    }, [editData, products]);

    // Snackbar State
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'info' | 'warning';
    }>({ open: false, message: '', severity: 'success' });

    // Loading State
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [pData, prodData, catData] = await Promise.all([
            getPartners(),
            getProducts(),
            getCategories()
        ]);
        setPartners(pData.filter(p => p.type === (type === 'sale' ? 'customer' : 'vendor')));
        setProducts(prodData);
        setCategories(catData);
    };

    const addItem = () => {
        if (role === 'viewonly') return;
        if (products.length === 0) return;

        // Find the first product with available stock if it's a sale
        let defaultProduct = products[0];
        if (type === 'sale') {
            const firstAvailable = products.find(p => {
                const alreadyAllocated = items.reduce((sum, item) => {
                    return item.product_id === p.id ? sum + item.quantity : sum;
                }, 0);
                return p.stock_quantity > alreadyAllocated;
            });

            if (!firstAvailable) {
                setSnackbar({ open: true, message: 'All products are out of stock or already fully allocated.', severity: 'warning' });
                return;
            }
            defaultProduct = firstAvailable;
        }

        setItems([...items, { product_id: defaultProduct.id, quantity: 1, price: defaultProduct.price, discount: 0 }]);
    };

    const updateItem = (index: number, field: keyof TransactionItem, value: number) => {
        if (role === 'viewonly') return;
        const newItems = [...items];

        if (field === 'quantity' && type === 'sale') {
            const currentItem = newItems[index];
            const product = products.find(p => p.id === currentItem.product_id);

            if (product) {
                const otherRowsUsage = items.reduce((sum, item, i) => {
                    return (i !== index && item.product_id === currentItem.product_id) ? sum + item.quantity : sum;
                }, 0);

                const availableStock = product.stock_quantity - otherRowsUsage;

                if (value > availableStock) {
                    setSnackbar({ open: true, message: `Cannot add ${value}. Only ${availableStock} remaining for this product.`, severity: 'warning' });
                    return;
                }
            }
        }
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const removeItem = (index: number) => {
        if (role === 'viewonly') return;
        setItems(items.filter((_, i) => i !== index));
    };

    // Per-item computed values
    const getItemGross = (item: TransactionItem) => item.price * item.quantity;
    const getItemAmtAfterDisc = (item: TransactionItem) => getItemGross(item) - (item.discount || 0);
    const getItemVat = (item: TransactionItem) => getItemAmtAfterDisc(item) * (vatPercent / 100);
    const getItemNet = (item: TransactionItem) => getItemAmtAfterDisc(item) + getItemVat(item);

    // Summary computed values
    const totalGross = items.reduce((sum, item) => sum + getItemGross(item), 0);
    const totalDiscount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
    const totalAmtAfterDisc = totalGross - totalDiscount;
    const totalVat = totalAmtAfterDisc * (vatPercent / 100);
    const grandTotal = totalAmtAfterDisc + totalVat;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (role === 'viewonly') {
            setSnackbar({ open: true, message: 'View Only users cannot create transactions.', severity: 'error' });
            return;
        }
        if (!selectedPartnerId) {
            setSnackbar({ open: true, message: 'Please select a partner', severity: 'warning' });
            return;
        }
        if (items.length === 0) {
            setSnackbar({ open: true, message: 'Please add at least one item', severity: 'warning' });
            return;
        }

        setSubmitting(true);
        const transaction: TransactionCreate = {
            partner_id: Number(selectedPartnerId),
            type: type,
            items: items,
            vat_percent: vatPercent
        };

        try {
            if (editData && onEdit) {
                await onEdit(transaction);
                setSnackbar({ open: true, message: 'Transaction updated successfully', severity: 'success' });
            } else {
                await createTransaction(transaction);
                setSnackbar({ open: true, message: 'Transaction created successfully', severity: 'success' });
                setTimeout(() => {
                    if (window.__refreshProducts) window.__refreshProducts();
                    onSuccess();
                }, 1000);
            }
        } catch (error) {
            console.error('Failed to save transaction', error);
            setSnackbar({ open: true, message: 'Failed to save transaction', severity: 'error' });
        } finally {
            setSubmitting(false);
            if (window.__refreshProducts) window.__refreshProducts();
        }
    };

    // ...existing code...
    // Filter products by selected category and search for dropdowns
    const filteredProducts = products
        .filter(p => categoryFilter === '' || p.category_id === categoryFilter)
        .filter(p => productSearch.trim() === '' || p.name.toLowerCase().includes(productSearch.trim().toLowerCase()));

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Header Section */}
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={5}>
                    <Typography variant="body2" gutterBottom sx={{ fontWeight: 600 }}>
                        {type === 'sale' ? '👤 Customer' : '🏭 Vendor'}
                    </Typography>
                    <Select fullWidth value={selectedPartnerId} onChange={e => setSelectedPartnerId(Number(e.target.value))} displayEmpty required size="small" disabled={role === 'viewonly'}>
                        <MenuItem value="">Select Partner...</MenuItem>
                        {partners.map(p => (
                            <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                        ))}
                    </Select>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Typography variant="body2" gutterBottom sx={{ fontWeight: 600 }}>📊 VAT %</Typography>
                    <TextField
                        type="number"
                        inputProps={{ min: 0, max: 100, step: '0.01' }}
                        value={vatPercent}
                        onChange={e => setVatPercent(Number(e.target.value))}
                        fullWidth
                        size="small"
                        required
                        disabled={role === 'viewonly'}
                    />
                </Grid>
                <Grid item xs={6} md={4}>
                    <Paper elevation={2} sx={{
                        p: 1.5,
                        background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
                        color: 'white',
                        borderRadius: 2,
                        textAlign: 'center'
                    }}>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>Grand Total</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            {grandTotal.toFixed(3)} <Typography component="span" variant="caption">BHD</Typography>
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Category Filter & Product Search */}
            <Grid container spacing={2} sx={{ mb: 1 }}>
                <Grid item xs={12} md={6}>
                    <TextField
                        select
                        fullWidth
                        label="Filter by Category"
                        value={categoryFilter}
                        onChange={e => setCategoryFilter(e.target.value === '' ? '' : Number(e.target.value))}
                        disabled={role === 'viewonly'}
                    >
                        <MenuItem value="">All Categories</MenuItem>
                        {categories.map(cat => (
                            <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                        ))}
                    </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Search Product"
                        placeholder="Type product name..."
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        disabled={role === 'viewonly'}
                    />
                </Grid>
            </Grid>

            {/* Items Table */}
            <Paper variant="outlined" sx={{ overflow: 'auto' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 700, minWidth: 200 }}>Product</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, width: 90 }}>Qty</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, width: 110 }}>Price</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, width: 100 }}>
                                <Tooltip title="Per-item discount amount (BHD)"><span>Discount</span></Tooltip>
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, width: 100, color: '#1565c0' }}>
                                <Tooltip title="Price × Qty − Discount"><span>Amount</span></Tooltip>
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, width: 80, color: '#e65100' }}>
                                <Tooltip title={`VAT at ${vatPercent}%`}><span>VAT</span></Tooltip>
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, width: 110, color: '#2e7d32' }}>
                                <Tooltip title="Amount + VAT"><span>Net Amt</span></Tooltip>
                            </TableCell>
                            <TableCell sx={{ width: 50 }}></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items.map((item, index) => {
                            const selectedProduct = products.find(p => p.id === item.product_id);
                            const itemAmtAfterDisc = getItemAmtAfterDisc(item);
                            const itemVat = getItemVat(item);
                            const itemNet = getItemNet(item);

                            return (
                                <TableRow key={index} sx={{
                                    '&:hover': { bgcolor: '#f3f6fd' },
                                    transition: 'background-color 0.2s'
                                }}>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Select fullWidth required value={item.product_id} onChange={e => {
                                                if (role === 'viewonly') return;
                                                const pid = Number(e.target.value);
                                                const prod = products.find(p => p.id === pid);
                                                const newItems = [...items];
                                                newItems[index] = {
                                                    ...newItems[index],
                                                    product_id: pid,
                                                    price: type === 'sale' ? (prod?.price || 0) : newItems[index].price,
                                                    quantity: 1,
                                                    discount: 0
                                                };
                                                setItems(newItems);
                                            }} size="small" sx={{ flexGrow: 1 }} disabled={role === 'viewonly'}>
                                                {filteredProducts.filter(p => {
                                                    if (type !== 'sale') return true;
                                                    const metadataAllocated = items.reduce((sum, i, idx) => {
                                                        return (idx !== index && i.product_id === p.id) ? sum + i.quantity : sum;
                                                    }, 0);
                                                    const remaining = p.stock_quantity - metadataAllocated;
                                                    return remaining > 0 || p.id === item.product_id;
                                                }).map(p => {
                                                    const metadataAllocated = items.reduce((sum, i, idx) => {
                                                        return (idx !== index && i.product_id === p.id) ? sum + i.quantity : sum;
                                                    }, 0);
                                                    const remaining = p.stock_quantity - metadataAllocated;
                                                    const isOutOfStock = type === 'sale' && remaining <= 0 && p.id !== item.product_id;

                                                    return (
                                                        <MenuItem key={p.id} value={p.id} disabled={isOutOfStock}>
                                                            {p.name} {isOutOfStock ? '(Out of Stock)' : ''}
                                                        </MenuItem>
                                                    )
                                                })}
                                            </Select>
                                            {selectedProduct && type === 'sale' && (() => {
                                                const otherRowsUsage = items.reduce((sum, i, idx) => {
                                                    return (idx !== index && i.product_id === selectedProduct.id) ? sum + i.quantity : sum;
                                                }, 0);
                                                const remaining = selectedProduct.stock_quantity - otherRowsUsage;
                                                return (
                                                    <Chip
                                                        size="small"
                                                        label={`${remaining} left`}
                                                        color={remaining > 5 ? 'success' : remaining > 0 ? 'warning' : 'error'}
                                                        variant="outlined"
                                                        sx={{ minWidth: 65, fontSize: '0.7rem' }}
                                                    />
                                                );
                                            })()}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <TextField
                                            type="number"
                                            inputProps={{ min: 1, style: { textAlign: 'right' } }}
                                            value={item.quantity}
                                            onChange={e => updateItem(index, 'quantity', Number(e.target.value))}
                                            size="small"
                                            fullWidth
                                            required
                                            disabled={role === 'viewonly'}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <TextField
                                            type="number"
                                            inputProps={{ min: 0, step: '0.001', style: { textAlign: 'right' } }}
                                            value={item.price}
                                            onChange={e => updateItem(index, 'price', Number(e.target.value))}
                                            size="small"
                                            fullWidth
                                            required
                                            disabled={role === 'viewonly'}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <TextField
                                            type="number"
                                            inputProps={{ min: 0, step: '0.001', style: { textAlign: 'right' } }}
                                            value={item.discount}
                                            onChange={e => updateItem(index, 'discount', Number(e.target.value))}
                                            size="small"
                                            fullWidth
                                            required
                                            disabled={role === 'viewonly'}
                                            sx={{
                                                '& input': {
                                                    color: item.discount > 0 ? '#e65100' : 'inherit'
                                                }
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#1565c0' }}>
                                            {itemAmtAfterDisc.toFixed(3)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2" sx={{ color: '#e65100' }}>
                                            {vatPercent > 0 ? itemVat.toFixed(3) : '-'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                                            {itemNet.toFixed(3)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => removeItem(index)} color="error" size="small" disabled={role === 'viewonly'}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {items.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                    <ReceiptLongIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                                    <Typography variant="body2">No items added yet. Click "Add Item" to start.</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                {/* Add Item Button */}
                <Button startIcon={<AddIcon />} onClick={addItem} variant="outlined" size="small" disabled={role === 'viewonly'}>
                    Add Item
                </Button>

                {/* Summary Section */}
                {items.length > 0 && (
                    <Paper variant="outlined" sx={{ p: 1.5, minWidth: 260, borderRadius: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, borderBottom: '1px solid #e0e0e0', pb: 0.5 }}>
                            Invoice Summary
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">Gross Amount:</Typography>
                            <Typography variant="body2">{totalGross.toFixed(3)}</Typography>
                        </Box>
                        {totalDiscount > 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" color="error">Discount:</Typography>
                                <Typography variant="body2" color="error">-{totalDiscount.toFixed(3)}</Typography>
                            </Box>
                        )}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">After Discount:</Typography>
                            <Typography variant="body2">{totalAmtAfterDisc.toFixed(3)}</Typography>
                        </Box>
                        {vatPercent > 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" sx={{ color: '#e65100' }}>VAT ({vatPercent}%):</Typography>
                                <Typography variant="body2" sx={{ color: '#e65100' }}>+{totalVat.toFixed(3)}</Typography>
                            </Box>
                        )}
                        <Divider sx={{ my: 0.5 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Net Total (BHD):</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2e7d32' }}>{grandTotal.toFixed(3)}</Typography>
                        </Box>
                    </Paper>
                )}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                <Button onClick={onClose} disabled={submitting}>Cancel</Button>
                <Button
                    type="submit"
                    variant="contained"
                    disabled={submitting || items.length === 0 || role === 'viewonly'}
                    startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
                    sx={{
                        background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
                        '&:hover': { background: 'linear-gradient(135deg, #0d1257 0%, #1a237e 100%)' }
                    }}
                >
                    {submitting
                        ? 'Processing...'
                        : editData
                            ? `Update ${type === 'sale' ? 'Sale' : 'Purchase'}`
                            : `Complete ${type === 'sale' ? 'Sale' : 'Purchase'}`}
                </Button>
            </Box>

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