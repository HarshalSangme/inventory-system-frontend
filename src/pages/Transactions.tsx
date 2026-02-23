import { useEffect, useState } from 'react';
import { TextField as MuiTextField } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useUser } from '../context/UserContext';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
    Box,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogTitle,
    DialogContent,
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
    Grid,
    CircularProgress
} from '@mui/material';

import { getTransactions, type Transaction, getInvoicePdf } from '../services/transactionService';
import { getPartners, type Partner } from '../services/partnerService';

import CreateTransaction from './CreateTransaction';

interface TransactionsProps {
    type: 'purchase' | 'sale';
}

export default function Transactions({ type }: TransactionsProps) {
    const { role } = useUser();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    const handleView = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setDetailModalOpen(true);
    };

    const handlePrint = async () => {
        if (selectedTransaction) {
            try {
                const blob = await getInvoicePdf(selectedTransaction.id);
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');
                // Clean up the URL object after a delay to ensure it loads
                setTimeout(() => window.URL.revokeObjectURL(url), 100);
            } catch (error) {
                console.error('Failed to print invoice', error);
                alert('Failed to load invoice. Please try again.');
            }
        }
    };

    useEffect(() => {
        const loadTransactionsAndPartners = async () => {
            setLoading(true);
            try {
                const [txData, partnerData] = await Promise.all([
                    getTransactions(),
                    getPartners()
                ]);
                setTransactions(txData.filter(t => t.type === type));
                setPartners(partnerData);
            } catch (error) {
                console.error('Failed to load transactions or partners', error);
            } finally {
                setLoading(false);
            }
        };
        loadTransactionsAndPartners();
    }, [type]);

    const refreshTransactions = async () => {
        try {
            const [txData, partnerData] = await Promise.all([
                getTransactions(),
                getPartners()
            ]);
            setTransactions(txData.filter(t => t.type === type));
            setPartners(partnerData);
        } catch (error) {
            console.error('Failed to load transactions or partners', error);
        }
    };

    const title = type === 'purchase' ? 'Purchases' : 'Sales';

    let filteredTransactions = transactions.filter(t =>
        t.id.toString().includes(searchTerm) ||
        new Date(t.date).toLocaleDateString().includes(searchTerm)
    );
    // Date range filter
    if (dateFrom) {
        filteredTransactions = filteredTransactions.filter(t => new Date(t.date) >= new Date(dateFrom));
    }
    if (dateTo) {
        filteredTransactions = filteredTransactions.filter(t => new Date(t.date) <= new Date(dateTo));
    }
    // Sort by date descending
    filteredTransactions = filteredTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Total amount for filtered
    const totalAmount = filteredTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);

    // Stub API calls for update/delete (replace with real API calls)
    const updateTransaction = async (id: number, data: any) => {
        // Real API call
        await import('../services/transactionService').then(({ updateTransaction }) => updateTransaction(id, data));
        // Force full refresh
        await refreshTransactions();
    };
    const deleteTransaction = async (id: number) => {
        // Real API call
        await import('../services/transactionService').then(({ deleteTransaction }) => deleteTransaction(id));
        // Force full refresh
        await refreshTransactions();
    };

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 400, color: '#1a1a1a' }}>{title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Manage {title.toLowerCase()} transactions</Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => role !== 'viewonly' && setIsModalOpen(true)} size="large" disabled={role === 'viewonly'}>
                    New {type === 'purchase' ? 'Purchase' : 'Sale'}
                </Button>
            </Box>

            {/* Search */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        placeholder={`Search ${title.toLowerCase()}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            )
                        }}
                    />
                </Grid>
                <Grid item xs={6} md={2}>
                    <MuiTextField
                        label="From"
                        type="date"
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                    />
                </Grid>
                <Grid item xs={6} md={2}>
                    <MuiTextField
                        label="To"
                        type="date"
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                    />
                </Grid>
                <Grid item xs={12} md={4} display="flex" alignItems="center" justifyContent="flex-end">
                    <Typography variant="subtitle1" fontWeight="bold" color="primary">
                        Total: {totalAmount.toFixed(2)}
                    </Typography>
                </Grid>
            </Grid>

            {/* Transactions Table */}
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
                                        <TableCell sx={{ fontWeight: 400, color: '#1a1a1a' }}>Entry No.</TableCell>
                                        <TableCell sx={{ fontWeight: 400, color: '#1a1a1a' }}>Date</TableCell>
                                        <TableCell sx={{ fontWeight: 400, color: '#1a1a1a' }}>{type === 'purchase' ? 'Vendor Name' : 'Customer Name'}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 400, color: '#1a1a1a' }}>Amount</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 400, color: '#1a1a1a' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredTransactions.map((transaction, idx) => {
                                        const partnerName = partners.find(p => p.id === transaction.partner_id)?.name || transaction.partner_id;
                                        return (
                                            <TableRow key={transaction.id} hover sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }}>
                                                <TableCell>{idx + 1}</TableCell>
                                                <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                                                <TableCell sx={{ minWidth: 160 }}>{partnerName}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 400, color: type === 'sale' ? '#2e7d32' : '#f44336' }}>{transaction.total_amount.toFixed(2)}</TableCell>
                                                <TableCell align="center">
                                                    <IconButton size="small" color="primary" onClick={() => handleView(transaction)}><VisibilityIcon fontSize="small" /></IconButton>
                                                    {role !== 'viewonly' && (
                                                        <>
                                                            <IconButton size="small" color="secondary" onClick={() => { setIsEditMode(true); setEditTransaction(transaction); setIsModalOpen(true); }}>
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                            <IconButton size="small" color="error" onClick={() => { setDeleteTarget(transaction); setDeleteDialogOpen(true); }}>
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {filteredTransactions.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                                <Typography color="text.secondary">No {title.toLowerCase()} found</Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>

            {/* View Transaction Dialog */}
            <Dialog open={detailModalOpen} onClose={() => setDetailModalOpen(false)} fullWidth maxWidth="md">
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">{selectedTransaction?.type === 'purchase' ? 'Purchase' : 'Sale'} Details #{selectedTransaction?.id}</Typography>
                    {selectedTransaction?.type === 'sale' && (
                        <Button variant="outlined" startIcon={<VisibilityIcon />} onClick={handlePrint} disabled={role === 'viewonly'}>
                            Print Invoice
                        </Button>
                    )}
                </DialogTitle>
                <DialogContent dividers>
                    {selectedTransaction && (
                        <Box>
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={6} sm={3}>
                                    <Typography variant="subtitle2" color="text.secondary">Date</Typography>
                                    <Typography variant="body1">{new Date(selectedTransaction.date).toLocaleDateString()}</Typography>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <Typography variant="subtitle2" color="text.secondary">Time</Typography>
                                    <Typography variant="body1">{new Date(selectedTransaction.date).toLocaleTimeString()}</Typography>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <Typography variant="subtitle2" color="text.secondary">Partner ID</Typography>
                                    <Typography variant="body1">{selectedTransaction.partner_id}</Typography>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <Typography variant="subtitle2" color="text.secondary">Sales Person</Typography>
                                    <Typography variant="body1">{selectedTransaction.sales_person || '-'}</Typography>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <Typography variant="subtitle2" color="text.secondary">Payment Method</Typography>
                                    <Typography variant="body1">{selectedTransaction.payment_method || '-'}</Typography>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <Typography variant="subtitle2" color="text.secondary">VAT %</Typography>
                                    <Typography variant="body1">{selectedTransaction.vat_percent || 0}</Typography>
                                </Grid>
                            </Grid>

                            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Items</Typography>
                            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                            <TableCell>Product</TableCell>
                                            <TableCell align="right">Qty</TableCell>
                                            <TableCell align="right">Cost Price</TableCell>
                                            <TableCell align="right">Price</TableCell>
                                            <TableCell align="right">Discount</TableCell>
                                            <TableCell align="right">Amount</TableCell>
                                            <TableCell align="right">VAT %</TableCell>
                                            <TableCell align="right">VAT</TableCell>
                                            <TableCell align="right">Net Amt</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {selectedTransaction.items?.map((item, index) => {
                                            const costPrice = typeof item.product?.cost_price === 'number' ? item.product.cost_price : undefined;
                                            const itemGross = item.price * item.quantity;
                                            const itemAmtAfterDisc = itemGross - (item.discount || 0);
                                            const vatPercent = typeof item.vat_percent === 'number' ? item.vat_percent : 0;
                                            const itemVat = itemAmtAfterDisc * (vatPercent / 100);
                                            const itemNet = itemAmtAfterDisc + itemVat;
                                            return (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight="medium">{item.product?.name || `Product #${item.product_id}`}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{item.product?.sku}</Typography>
                                                    </TableCell>
                                                    <TableCell align="right">{item.quantity}</TableCell>
                                                    <TableCell align="right">{typeof costPrice === 'number' ? costPrice.toFixed(3) : '-'}</TableCell>
                                                    <TableCell align="right">{item.price.toFixed(3)}</TableCell>
                                                    <TableCell align="right">{item.discount ? item.discount.toFixed(3) : '-'}</TableCell>
                                                    <TableCell align="right">{itemAmtAfterDisc.toFixed(3)}</TableCell>
                                                    <TableCell align="right">{vatPercent}</TableCell>
                                                    <TableCell align="right">{vatPercent > 0 ? itemVat.toFixed(3) : '-'}</TableCell>
                                                    <TableCell align="right">{itemNet.toFixed(3)}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                <Box sx={{ width: '300px' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2">Gross Amount:</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            {selectedTransaction.items?.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(3)} BHD
                                        </Typography>
                                    </Box>
                                    {selectedTransaction.items?.some(item => item.discount > 0) && (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" color="error">Discount:</Typography>
                                            <Typography variant="body2" color="error">
                                                -{selectedTransaction.items?.reduce((sum, item) => sum + (item.discount || 0), 0).toFixed(3)} BHD
                                            </Typography>
                                        </Box>
                                    )}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2">After Discount:</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            {(selectedTransaction.items?.reduce((sum, item) => sum + (item.price * item.quantity - (item.discount || 0)), 0)).toFixed(3)} BHD
                                        </Typography>
                                    </Box>
                                    {selectedTransaction.items?.some(item => typeof item.vat_percent === 'number' && item.vat_percent > 0) && (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" sx={{ color: '#e65100' }}>VAT:</Typography>
                                            <Typography variant="body2" sx={{ color: '#e65100' }}>
                                                +{selectedTransaction.items?.reduce((sum, item) => {
                                                    const vatPercent = typeof item.vat_percent === 'number' ? item.vat_percent : 0;
                                                    return sum + ((item.price * item.quantity - (item.discount || 0)) * (vatPercent / 100));
                                                }, 0).toFixed(3)} BHD
                                            </Typography>
                                        </Box>
                                    )}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '1px solid #eee' }}>
                                        <Typography variant="subtitle1" fontWeight="bold">Net Total:</Typography>
                                        <Typography variant="subtitle1" fontWeight="bold" color="primary">
                                            {selectedTransaction.total_amount.toFixed(3)} BHD
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>

            {/* Create Transaction Dialog */}
            <Dialog open={isModalOpen} onClose={() => { setIsModalOpen(false); setIsEditMode(false); setEditTransaction(null); }} fullWidth maxWidth="lg">
                <DialogTitle sx={{ fontWeight: 400, py: 2 }}>{isEditMode ? `Edit ${type === 'sale' ? 'Sale' : 'Purchase'}` : `New ${type === 'sale' ? 'Sale' : 'Purchase'}`}</DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    {role !== 'viewonly' ? (
                        <CreateTransaction
                            type={type}
                            onClose={() => { setIsModalOpen(false); setIsEditMode(false); setEditTransaction(null); }}
                            onSuccess={() => {
                                setIsModalOpen(false);
                                setIsEditMode(false);
                                setEditTransaction(null);
                                refreshTransactions();
                            }}
                            editData={isEditMode && editTransaction ? editTransaction : undefined}
                            onEdit={async (data) => {
                                if (isEditMode && editTransaction) {
                                    await updateTransaction(editTransaction.id, data);
                                    setIsModalOpen(false);
                                    setIsEditMode(false);
                                    setEditTransaction(null);
                                    // Always refresh after edit
                                    await refreshTransactions();
                                }
                            }}
                        />
                    ) : (
                        <Box p={2} color="text.secondary">View only users cannot create transactions.</Box>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => { setDeleteDialogOpen(false); setDeleteTarget(null); }}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    Are you sure you want to delete this {type === 'sale' ? 'sale' : 'purchase'} entry?
                </DialogContent>
                <Box display="flex" justifyContent="flex-end" p={2} gap={2}>
                    <Button onClick={() => { setDeleteDialogOpen(false); setDeleteTarget(null); }}>Cancel</Button>
                    <Button color="error" variant="contained" onClick={async () => {
                        if (deleteTarget) {
                            await deleteTransaction(deleteTarget.id);
                            setDeleteDialogOpen(false);
                            setDeleteTarget(null);
                        }
                    }}>Delete</Button>
                </Box>
            </Dialog>
        </Box>
    );
}

