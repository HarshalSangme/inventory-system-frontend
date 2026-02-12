import { useEffect, useState } from 'react';
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
    CircularProgress
} from '@mui/material';
import { createTransaction, type TransactionCreate, type TransactionItem } from '../services/transactionService';
import { getProducts, type Product } from '../services/productService';
import { getPartners, type Partner } from '../services/partnerService';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CloseIcon from '@mui/icons-material/Close';

interface CreateTransactionProps {
    type: 'purchase' | 'sale';
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateTransaction({ type, onClose, onSuccess }: CreateTransactionProps) {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedPartnerId, setSelectedPartnerId] = useState<number | ''>('');
    const [items, setItems] = useState<TransactionItem[]>([]);
    const [vatPercent, setVatPercent] = useState<number>(0);

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
        const [pData, prodData] = await Promise.all([getPartners(), getProducts()]);
        setPartners(pData.filter(p => p.type === (type === 'sale' ? 'customer' : 'vendor')));
        setProducts(prodData);
    };

    const addItem = () => {
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

        setItems([...items, { product_id: defaultProduct.id, quantity: 1, price: defaultProduct.price }]);
    };

    const updateItem = (index: number, field: keyof TransactionItem, value: number) => {
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
        setItems(items.filter((_, i) => i !== index));
    };

    const calculateSubtotal = () => {
        return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        return subtotal + (subtotal * vatPercent / 100);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
            await createTransaction(transaction);
            setSnackbar({ open: true, message: 'Transaction created successfully', severity: 'success' });
            setTimeout(() => onSuccess(), 1000);
        } catch (error) {
            console.error('Failed to create transaction', error);
            setSnackbar({ open: true, message: 'Failed to create transaction', severity: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                    <Typography variant="body2" gutterBottom>{type === 'sale' ? 'Customer' : 'Vendor'}</Typography>
                    <Select fullWidth value={selectedPartnerId} onChange={e => setSelectedPartnerId(Number(e.target.value))} displayEmpty required>
                        <MenuItem value="">Select Partner...</MenuItem>
                        {partners.map(p => (
                            <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                        ))}
                    </Select>
                </Grid>
                <Grid item xs={6} md={3}>
                    <TextField
                        label="VAT %"
                        type="number"
                        inputProps={{ min: 0, max: 100, step: '0.01' }}
                        value={vatPercent}
                        onChange={e => setVatPercent(Number(e.target.value))}
                        fullWidth
                    />
                </Grid>
                <Grid item xs={6} md={3} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                    <Typography variant="caption">Total Amount (incl. VAT)</Typography>
                    <Typography variant="subtitle1" color="primary">{calculateTotal().toFixed(2)}</Typography>
                </Grid>
            </Grid>

            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right" sx={{ width: 120 }}>Selling Qty</TableCell>
                        <TableCell align="right" sx={{ width: 160 }}>Price</TableCell>
                        <TableCell align="right" sx={{ width: 160 }}>Total</TableCell>
                        <TableCell sx={{ width: 64 }}></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {items.map((item, index) => {
                        const selectedProduct = products.find(p => p.id === item.product_id);
                        return (
                            <TableRow key={index}>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Select fullWidth value={item.product_id} onChange={e => {
                                            const pid = Number(e.target.value);
                                            const prod = products.find(p => p.id === pid);
                                            const newItems = [...items];
                                            newItems[index] = {
                                                ...newItems[index],
                                                product_id: pid,
                                                price: type === 'sale' ? (prod?.price || 0) : newItems[index].price,
                                                quantity: 1
                                            };
                                            setItems(newItems);
                                        }} sx={{ flexGrow: 1 }}>
                                            {products.filter(p => {
                                                if (type !== 'sale') return true;
                                                const metadataAllocated = items.reduce((sum, i, idx) => {
                                                    return (idx !== index && i.product_id === p.id) ? sum + i.quantity : sum;
                                                }, 0);
                                                const remaining = p.stock_quantity - metadataAllocated;
                                                // Keep if it has stock OR it is the current selection for this row
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
                                                <Typography variant="body2" color={remaining > 0 ? "success.main" : "error.main"} sx={{ whiteSpace: 'nowrap', minWidth: '150px' }}>
                                                    Available Stock: {remaining}
                                                </Typography>
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
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <TextField
                                        type="number"
                                        inputProps={{ min: 0, step: '0.01', style: { textAlign: 'right' } }}
                                        value={item.price}
                                        onChange={e => updateItem(index, 'price', Number(e.target.value))}
                                        size="small"
                                        fullWidth
                                    />
                                </TableCell>
                                <TableCell align="right">{(item.quantity * item.price).toFixed(2)}</TableCell>
                                <TableCell>
                                    <IconButton onClick={() => removeItem(index)} color="error">
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

            <Box sx={{ p: 1, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
                <Button startIcon={<AddIcon />} onClick={addItem}>Add Item</Button>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                <Button onClick={onClose} disabled={submitting}>Cancel</Button>
                <Button
                    type="submit"
                    variant="contained"
                    disabled={submitting}
                    startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
                >
                    {submitting ? 'Processing...' : `Complete ${type === 'sale' ? 'Sale' : 'Purchase'}`}
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