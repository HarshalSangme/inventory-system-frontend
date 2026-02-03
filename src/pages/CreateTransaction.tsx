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
    Typography
} from '@mui/material';
import { createTransaction, type TransactionCreate, type TransactionItem } from '../services/transactionService';
import { getProducts, type Product } from '../services/productService';
import { getPartners, type Partner } from '../services/partnerService';

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
        setItems([...items, { product_id: products[0].id, quantity: 1, price: products[0].price }]);
    };

    const updateItem = (index: number, field: keyof TransactionItem, value: number) => {
        const newItems = [...items];
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
            alert('Please select a partner');
            return;
        }
        if (items.length === 0) {
            alert('Please add at least one item');
            return;
        }


        const transaction: TransactionCreate = {
            partner_id: Number(selectedPartnerId),
            type: type,
            items: items,
            vat_percent: vatPercent
        };

        try {
            await createTransaction(transaction);
            onSuccess();
        } catch (error) {
            console.error('Failed to create transaction', error);
            alert('Failed to create transaction');
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
                    <Typography variant="h5" color="primary">₹ {calculateTotal().toFixed(2)}</Typography>
                </Grid>
            </Grid>

            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell sx={{ width: 120 }}>Qty</TableCell>
                        <TableCell sx={{ width: 160 }}>Price</TableCell>
                        <TableCell sx={{ width: 160 }}>Total</TableCell>
                        <TableCell sx={{ width: 64 }}></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {items.map((item, index) => (
                        <TableRow key={index}>
                            <TableCell>
                                <Select fullWidth value={item.product_id} onChange={e => {
                                    const pid = Number(e.target.value);
                                    const prod = products.find(p => p.id === pid);
                                    const newItems = [...items];
                                    newItems[index] = {
                                        ...newItems[index],
                                        product_id: pid,
                                        price: type === 'sale' ? (prod?.price || 0) : newItems[index].price
                                    };
                                    setItems(newItems);
                                }}>
                                    {products.map(p => (
                                        <MenuItem key={p.id} value={p.id}>{p.name} (Stock: {p.stock_quantity})</MenuItem>
                                    ))}
                                </Select>
                            </TableCell>
                            <TableCell>
                                <TextField type="number" inputProps={{ min: 1 }} value={item.quantity} onChange={e => updateItem(index, 'quantity', Number(e.target.value))} size="small" fullWidth />
                            </TableCell>
                            <TableCell>
                                <TextField type="number" inputProps={{ min: 0, step: '0.01' }} value={item.price} onChange={e => updateItem(index, 'price', Number(e.target.value))} size="small" fullWidth />
                            </TableCell>
                            <TableCell align="right">₹ {(item.quantity * item.price).toFixed(2)}</TableCell>
                            <TableCell>
                                <IconButton onClick={() => removeItem(index)} color="error">
                                    <DeleteIcon />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Box sx={{ p: 1, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
                <Button startIcon={<AddIcon />} onClick={addItem}>Add Item</Button>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button type="submit" variant="contained">Complete {type === 'sale' ? 'Sale' : 'Purchase'}</Button>
            </Box>
        </Box>
    );
}

