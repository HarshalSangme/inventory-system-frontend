import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import Card from '@mui/material/Card';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { getExpenses, createExpense, deleteExpense, getExpenseCategories, createExpenseCategory } from '../services/expenseService';
import type { Expense, ExpenseCategory } from '../services/expenseService';
import PrintIcon from '@mui/icons-material/Print';
import jsPDF from 'jspdf';
import { useSnackbar } from '../context/SnackbarContext';

export default function Expenses() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [categories, setCategories] = useState<ExpenseCategory[]>([]);
    const [loading, setLoading] = useState(false);
    
    const [openDialog, setOpenDialog] = useState(false);
    const [openCatDialog, setOpenCatDialog] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().slice(0, 10),
        category_id: '',
        description: '',
        payment_mode: 'Cash',
        amount: '',
        approved_by: '',
        remarks: ''
    });
    const [catName, setCatName] = useState('');
    const { showSnackbar } = useSnackbar();

    useEffect(() => {
        fetchExpenses();
        fetchCategories();
    }, []);

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const res = await getExpenses();
            setExpenses(res.data || res);
        } catch (error) {
            console.error("Failed to load expenses", error);
        }
        setLoading(false);
    };

    const fetchCategories = async () => {
        try {
            const res = await getExpenseCategories();
            setCategories(res);
        } catch (e) {
            console.error("Failed to load categories", e);
        }
    };

    const handleSubmit = async () => {
        try {
            await createExpense({
                ...formData,
                category_id: parseInt(formData.category_id),
                amount: parseFloat(formData.amount)
            });
            showSnackbar('Expense recorded successfully.', 'success');
            setOpenDialog(false);
            fetchExpenses();
        } catch (e) {
            showSnackbar('Failed to create expense.', 'error');
            console.error(e);
        }
    };

    const handleCreateCategory = async () => {
        try {
            await createExpenseCategory({ name: catName });
            showSnackbar('Category created successfully.', 'success');
            setOpenCatDialog(false);
            setCatName('');
            fetchCategories();
        } catch (e) {
            showSnackbar('Failed to create category.', 'error');
            console.error(e);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this expense?")) return;
        try {
            await deleteExpense(id);
            fetchExpenses();
        } catch (e) {
            console.error(e);
        }
    };

    const handlePrintVoucher = (row: Expense) => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text("JOT AUTO PARTS W.L.L", 105, 20, { align: 'center' });
        doc.setFontSize(14);
        doc.text("Expense Voucher", 105, 30, { align: 'center' });
        doc.setFontSize(12);
        
        doc.text(`Voucher No: ${row.voucher_no}`, 20, 50);
        doc.text(`Date: ${new Date(row.date).toLocaleDateString()}`, 140, 50);
        
        doc.text(`Expense Head: ${row.category?.name || 'Uncategorized'}`, 20, 70);
        doc.text(`Description: ${row.description}`, 20, 80);
        doc.text(`Payment Mode: ${row.payment_mode}`, 20, 90);
        doc.text(`Amount: Bhd ${row.amount.toFixed(3)}`, 20, 100);
        doc.text(`Approved By: ${row.approved_by || ''}`, 20, 110);
        doc.text(`Remarks: ${row.remarks || ''}`, 20, 120);

        doc.setFontSize(10);
        doc.text("Receiver Signature: __________________", 20, 160);
        doc.text("Authorized Signature: __________________", 120, 160);

        doc.save(`Expense_Voucher_${row.voucher_no}.pdf`);
    };

    const columns: GridColDef[] = [
        { 
            field: 'date', 
            headerName: 'Date', 
            width: 120,
            valueGetter: (params) => new Date(params.row.date).toLocaleDateString()
        },
        { field: 'voucher_no', headerName: 'Voucher No.', width: 140 },
        { 
            field: 'category', 
            headerName: 'Expense Head', 
            width: 150,
            valueGetter: (params) => params.row.category?.name || ''
        },
        { field: 'description', headerName: 'Description', flex: 1 },
        { field: 'payment_mode', headerName: 'Payment Mode', width: 130 },
        { field: 'amount', headerName: 'Amount', width: 120, valueFormatter: (params) => `Bhd ${Number(params.value).toFixed(3)}` },
        { field: 'approved_by', headerName: 'Approved By', width: 130 },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            renderCell: (params) => (
                <Box>
                    <IconButton size="small" onClick={() => handlePrintVoucher(params.row as Expense)}>
                        <PrintIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}>
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Box>
            )
        }
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'var(--jot-charcoal)' }}>
                    Operating Expenses
                </Typography>
                <Box>
                    <Button 
                        variant="outlined" 
                        sx={{ mr: 1, borderColor: '#ccc', color: '#555' }}
                        onClick={() => setOpenCatDialog(true)}
                    >
                        + Category
                    </Button>
                    <Button 
                        variant="contained" 
                        startIcon={<AddIcon />}
                        sx={{ bgcolor: 'var(--jot-orange)', '&:hover': { bgcolor: 'var(--jot-orange-dark)' } }}
                        onClick={() => setOpenDialog(true)}
                    >
                        Add Expense
                    </Button>
                </Box>
            </Box>

            <Card sx={{ height: 'calc(100vh - 180px)', p: 0 }}>
                <DataGrid
                    rows={expenses}
                    columns={columns}
                    loading={loading}
                    rowHeight={50}
                    disableRowSelectionOnClick
                    sx={{
                        border: 'none',
                        '& .MuiDataGrid-columnHeaders': { bgcolor: '#fbfbfb' }
                    }}
                />
            </Card>

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Expense Entry</DialogTitle>
                <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                    <TextField
                        label="Expense Date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                        fullWidth
                    />
                    
                    <TextField 
                        select 
                        label="Expense Head (Category)" 
                        value={formData.category_id}
                        onChange={e => setFormData({...formData, category_id: e.target.value})}
                        size="small"
                        fullWidth
                    >
                        {categories.map(c => (
                            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                        ))}
                    </TextField>

                    <TextField label="Description" size="small" fullWidth value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField 
                            select 
                            label="Payment Mode" 
                            size="small" 
                            fullWidth 
                            value={formData.payment_mode}
                            onChange={e => setFormData({...formData, payment_mode: e.target.value})}
                        >
                            {['Cash', 'Bank Transfer', 'Card', 'Cheque'].map(m => (
                                <MenuItem key={m} value={m}>{m}</MenuItem>
                            ))}
                        </TextField>
                        <TextField label="Amount" size="small" type="number" fullWidth value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField label="Approved By" size="small" fullWidth value={formData.approved_by} onChange={e => setFormData({...formData, approved_by: e.target.value})} />
                        <TextField label="Remarks" size="small" fullWidth value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} />
                    </Box>

                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit}>Save Expense</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openCatDialog} onClose={() => setOpenCatDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle>New Expense Category</DialogTitle>
                <DialogContent sx={{ pt: 1 }}>
                    <TextField 
                        label="Category Name" 
                        size="small" 
                        fullWidth 
                        autoFocus
                        value={catName} 
                        onChange={e => setCatName(e.target.value)} 
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCatDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreateCategory}>Create</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
