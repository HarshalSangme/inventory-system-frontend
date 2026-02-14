import { useEffect, useState } from 'react';
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
import { getTransactions, type Transaction } from '../services/transactionService';
import CreateTransaction from './CreateTransaction';

interface TransactionsProps {
    type: 'purchase' | 'sale';
}

export default function Transactions({ type }: TransactionsProps) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    const handleView = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setDetailModalOpen(true);
    };

    const handlePrint = () => {
        if (selectedTransaction) {
            window.open(`http://localhost:8000/invoices/${selectedTransaction.id}`, '_blank');
        }
    };

    useEffect(() => {
        const loadTransactions = async () => {
            setLoading(true);
            try {
                const data = await getTransactions();
                // Client side filter for now
                setTransactions(data.filter(t => t.type === type));
            } catch (error) {
                console.error('Failed to load transactions', error);
            } finally {
                setLoading(false);
            }
        };
        loadTransactions();
    }, [type]); // Reload when type changes

    const refreshTransactions = async () => {
        try {
            const data = await getTransactions();
            setTransactions(data.filter(t => t.type === type));
        } catch (error) {
            console.error('Failed to load transactions', error);
        }
    };

    const title = type === 'purchase' ? 'Purchases' : 'Sales';

    const filteredTransactions = transactions.filter(t =>
        t.id.toString().includes(searchTerm) ||
        new Date(t.date).toLocaleDateString().includes(searchTerm)
    );

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 400, color: '#1a1a1a' }}>{title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Manage {title.toLowerCase()} transactions</Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setIsModalOpen(true)} size="large">
                    New {type === 'purchase' ? 'Purchase' : 'Sale'}
                </Button>
            </Box>

            {/* Search */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={8}>
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
                                        <TableCell sx={{ fontWeight: 400, color: '#1a1a1a' }}>Trans. ID</TableCell>
                                        <TableCell sx={{ fontWeight: 400, color: '#1a1a1a' }}>Date</TableCell>
                                        <TableCell sx={{ fontWeight: 400, color: '#1a1a1a' }}>Partner</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 400, color: '#1a1a1a' }}>Amount</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 400, color: '#1a1a1a' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredTransactions.map(transaction => (
                                        <TableRow key={transaction.id} hover sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }}>
                                            <TableCell sx={{ fontFamily: 'monospace', fontWeight: 500 }}>#{transaction.id}</TableCell>
                                            <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                                            <TableCell>{transaction.partner_id}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 400, color: type === 'sale' ? '#2e7d32' : '#f44336' }}>{transaction.total_amount.toFixed(2)}</TableCell>
                                            <TableCell align="center">
                                                <IconButton size="small" color="primary" onClick={() => handleView(transaction)}><VisibilityIcon fontSize="small" /></IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
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
                        <Button variant="outlined" startIcon={<VisibilityIcon />} onClick={handlePrint}>
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
                            </Grid>

                            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Items</Typography>
                            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                            <TableCell>Product</TableCell>
                                            <TableCell align="right">Qty</TableCell>
                                            <TableCell align="right">Price</TableCell>
                                            <TableCell align="right">Total</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {selectedTransaction.items?.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="medium">{item.product?.name || `Product #${item.product_id}`}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{item.product?.sku}</Typography>
                                                </TableCell>
                                                <TableCell align="right">{item.quantity}</TableCell>
                                                <TableCell align="right">{item.price.toFixed(3)}</TableCell>
                                                <TableCell align="right">{((item.quantity * item.price) - (item.discount || 0)).toFixed(3)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                <Box sx={{ width: '250px' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2">Subtotal:</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            {(selectedTransaction.total_amount / (1 + (selectedTransaction.vat_percent || 0) / 100)).toFixed(3)} BHD
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2">VAT ({selectedTransaction.vat_percent}%):</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            {(selectedTransaction.total_amount - (selectedTransaction.total_amount / (1 + (selectedTransaction.vat_percent || 0) / 100))).toFixed(3)} BHD
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '1px solid #eee' }}>
                                        <Typography variant="subtitle1" fontWeight="bold">Total:</Typography>
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
            <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} fullWidth maxWidth="lg">
                <DialogTitle sx={{ fontWeight: 400, py: 2 }}>New {type === 'sale' ? 'Sale' : 'Purchase'}</DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <CreateTransaction
                        type={type}
                        onClose={() => setIsModalOpen(false)}
                        onSuccess={() => {
                            setIsModalOpen(false);
                            refreshTransactions();
                        }}
                    />
                </DialogContent>
            </Dialog>
        </Box>
    );
}

