// ...existing code...
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { useSnackbar } from '../context/SnackbarContext';
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
    Paper,
    CircularProgress,
    Divider,
    Chip,
    Tooltip,
    Autocomplete
} from '@mui/material';
import { createTransaction, type TransactionCreate, type TransactionItem } from '../services/transactionService';
import { getProducts, type Product } from '../services/productService';
import { getCategories, type Category } from '../services/categoryService';
import { getPartners, type Partner } from '../services/partnerService';


// Type-only import must be at the top for verbatimModuleSyntax
import type { Transaction } from '../services/transactionService';

type CreateTransactionProps = {
    type: 'purchase' | 'sale';
    onClose: () => void;
    onSuccess: () => void;
    editData?: Transaction;
    onEdit?: (data: TransactionCreate) => void;
};

const CreateTransaction: React.FC<CreateTransactionProps> = ({ type, onClose, onSuccess, editData, onEdit }) => {
        const updateVat = (index: number, value: number) => {
            if (role === 'viewonly') return;
            const newItems = [...items];
            newItems[index].vat_percent = value;
            setItems(newItems);
        };
    const { role } = useUser();
    const { showSnackbar } = useSnackbar();
    const [partners, setPartners] = useState<Partner[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
    const [productSearch, setProductSearch] = useState('');
    const [selectedPartnerId, setSelectedPartnerId] = useState<number | ''>(editData ? editData.partner_id : '');
    const [items, setItems] = useState<TransactionItem[]>(editData ? editData.items.map((item: TransactionItem) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount || 0,
        vat_percent: item.vat_percent ?? 0
    })) : []);
    // Remove global vatPercent
    const [submitting, setSubmitting] = useState(false);
        const [paymentMethod, setPaymentMethod] = useState<string>('Cash');

    useEffect(() => {
        if (editData && products.length > 0) {
            setSelectedPartnerId(editData.partner_id);
            setItems(editData.items.map((item: TransactionItem) => {
                // Use the price from the transaction item (editData.items), not the product default
                return {
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price: item.price, // <-- use transaction price
                    discount: item.discount || 0
                };
            }));
            setPaymentMethod(editData.payment_method || 'Cash');
        } else if (!editData) {
            setSelectedPartnerId('');
            setItems([]);
            setPaymentMethod('Cash');
        }
    }, [editData, products]);

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
        let defaultProduct = products[0];
        if (type === 'sale') {
            const firstAvailable = products.find(p => {
                const alreadyAllocated = items.reduce((sum, item) => {
                    return item.product_id === p.id ? sum + item.quantity : sum;
                }, 0);
                return p.stock_quantity > alreadyAllocated;
            });
            if (!firstAvailable) {
                showSnackbar('All products are out of stock or already fully allocated.', 'warning');
                return;
            }
            defaultProduct = firstAvailable;
        }
        setItems([...items, { product_id: defaultProduct.id, quantity: 1, price: defaultProduct.price, discount: 0, vat_percent: 0 }]);
        // updateVat is now top-level
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
                    showSnackbar(`Cannot add ${value}. Only ${availableStock} remaining for this product.`, 'warning');
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

    const getItemGross = (item: TransactionItem) => item.price * item.quantity;
    const getItemAmtAfterDisc = (item: TransactionItem) => getItemGross(item) - (item.discount || 0);
    const getItemVat = (item: TransactionItem) => getItemAmtAfterDisc(item) * ((item.vat_percent ?? 0) / 100);
    const getItemNet = (item: TransactionItem) => getItemAmtAfterDisc(item) + getItemVat(item);

    const totalGross = items.reduce((sum, item) => sum + getItemGross(item), 0);
    const totalDiscount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
    const totalAmtAfterDisc = totalGross - totalDiscount;
    const totalVat = items.reduce((sum, item) => sum + getItemVat(item), 0);
    const grandTotal = totalAmtAfterDisc + totalVat;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (role === 'viewonly') {
            showSnackbar('View Only users cannot create transactions.', 'error');
            return;
        }
        if (!selectedPartnerId) {
            showSnackbar('Please select a partner', 'warning');
            return;
        }
        if (items.length === 0) {
            showSnackbar('Please add at least one item', 'warning');
            return;
        }
        // Frontend price validation for sales
        if (type === 'sale') {
            for (const item of items) {
                const product = products.find(p => p.id === item.product_id);
                if (product && item.price < product.cost_price) {
                    showSnackbar(`Selling price (${item.price}) cannot be less than cost price (${product.cost_price}) for product '${product.name}'.`, 'error');
                    return;
                }
            }
        }
        setSubmitting(true);
        const transaction: TransactionCreate = {
            partner_id: Number(selectedPartnerId),
            type: type,
            items: items,
            payment_method: paymentMethod
        };
        try {
            if (editData && onEdit) {
                await onEdit(transaction);
                showSnackbar('Transaction updated successfully', 'success');
            } else {
                await createTransaction(transaction);
                showSnackbar('Transaction created successfully', 'success');
                setTimeout(() => {
                    if (window.__refreshProducts) window.__refreshProducts();
                    onSuccess();
                }, 1000);
            }
        } catch (error: any) {
            console.error('Failed to save transaction', error);
            const msg = error?.response?.data?.detail || 'Failed to save transaction';
            showSnackbar(msg, 'error');
        } finally {
            setSubmitting(false);
            if (window.__refreshProducts) window.__refreshProducts();
        }
    };

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
                        {/* Payment Method Dropdown */}
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" gutterBottom sx={{ fontWeight: 600 }}>💳 Payment Method</Typography>
                            <Select
                                fullWidth
                                value={paymentMethod}
                                onChange={e => setPaymentMethod(e.target.value)}
                                size="small"
                                disabled={role === 'viewonly'}
                            >
                                <MenuItem value="Cash">Cash</MenuItem>
                                <MenuItem value="Bank">Bank</MenuItem>
                                <MenuItem value="Credit">Credit</MenuItem>
                            </Select>
                        </Box>
                </Grid>
                {/* VAT input removed, now per-item */}
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
                                <Tooltip title="VAT %"><span>VAT %</span></Tooltip>
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, width: 80, color: '#e65100' }}>
                                <Tooltip title="VAT Amount"><span>VAT</span></Tooltip>
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
                            // itemVat is used below inline
                            const itemNet = getItemNet(item);

                            return (
                                <TableRow key={index} sx={{
                                    '&:hover': { bgcolor: '#f3f6fd' },
                                    transition: 'background-color 0.2s'
                                }}>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Autocomplete
                                                fullWidth
                                                size="small"
                                                options={filteredProducts.filter(p => {
                                                    if (type !== 'sale') return true;
                                                    const metadataAllocated = items.reduce((sum, i, idx) => {
                                                        return (idx !== index && i.product_id === p.id) ? sum + i.quantity : sum;
                                                    }, 0);
                                                    const remaining = p.stock_quantity - metadataAllocated;
                                                    return remaining > 0 || p.id === item.product_id;
                                                })}
                                                getOptionLabel={option => option.name}
                                                value={products.find(p => p.id === item.product_id) || null}
                                                onChange={(_, newValue) => {
                                                    if (role === 'viewonly' || !newValue) return;
                                                    const prod = newValue;
                                                    const newItems = [...items];
                                                    newItems[index] = {
                                                        ...newItems[index],
                                                        product_id: prod.id,
                                                        price: type === 'sale' ? (prod.price || 0) : newItems[index].price,
                                                        quantity: 1,
                                                        discount: 0
                                                    };
                                                    setItems(newItems);
                                                }}
                                                renderInput={params => (
                                                    <TextField {...params} required label="Select Product" placeholder="Type to search..." />
                                                )}
                                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                                disabled={role === 'viewonly'}
                                            />
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
                                            sx={{
                                                '& input': {
                                                    color: item.discount > 0 ? '#e65100' : 'inherit'
                                                }
                                            }}
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
                                        <TextField
                                            type="number"
                                            inputProps={{ min: 0, max: 100, step: '0.01', style: { textAlign: 'right' } }}
                                            value={item.vat_percent ?? 0}
                                            onChange={e => updateVat(index, Number(e.target.value))}
                                            size="small"
                                            fullWidth
                                            required
                                            disabled={role === 'viewonly'}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2" sx={{ color: '#e65100' }}>
                                            {(item.vat_percent ?? 0) > 0 ? getItemVat(item).toFixed(3) : '-'}
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
                        {totalVat > 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" sx={{ color: '#e65100' }}>VAT:</Typography>
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

        </Box>
    );
};

export default CreateTransaction;