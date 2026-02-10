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
    Grid
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
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a' }}>{title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Manage {title.toLowerCase()} transactions</Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setIsModalOpen(true)} size="large">
                    New {type === 'purchase' ? 'Purchase' : 'Sale'}
                </Button>
            </Box>

            {/* Search */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
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
                    <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #f0f0f0' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
                                    <TableCell sx={{ fontWeight: 700, color: '#1a1a1a' }}>Trans. ID</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#1a1a1a' }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#1a1a1a' }}>Partner</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, color: '#1a1a1a' }}>Amount</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700, color: '#1a1a1a' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredTransactions.map(transaction => (
                                    <TableRow key={transaction.id} hover sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }}>
                                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 500 }}>#{transaction.id}</TableCell>
                                        <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                                        <TableCell>{transaction.partner_id}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, color: type === 'sale' ? '#2e7d32' : '#f44336' }}>{transaction.total_amount.toFixed(2)}</TableCell>
                                        <TableCell align="center">
                                            <IconButton size="small" color="primary"><VisibilityIcon fontSize="small" /></IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredTransactions.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                            <Typography color="text.secondary">No {title.toLowerCase()} found</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* Create Transaction Dialog */}
            <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} fullWidth maxWidth="lg">
                <DialogTitle sx={{ fontWeight: 700, py: 2 }}>New {type === 'sale' ? 'Sale' : 'Purchase'}</DialogTitle>
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

