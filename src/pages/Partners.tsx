import React, { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
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
    Snackbar,
    CircularProgress
} from '@mui/material';
import { getPartners, type Partner, createPartner, updatePartner, deletePartner } from '../services/partnerService';
import ConfirmDialog from '../components/ConfirmDialog';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CloseIcon from '@mui/icons-material/Close';

interface PartnersProps {
    type: 'customer' | 'vendor';
}

export default function Partners({ type }: PartnersProps) {
    const { role } = useUser();
    const [partners, setPartners] = useState<Partner[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    // Snackbar State
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'info' | 'warning';
    }>({ open: false, message: '', severity: 'success' });

    // Loading States
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });

    useEffect(() => {
        const loadPartners = async () => {
            try {
                const data = await getPartners();
                // Filter by type
                setPartners(data.filter(p => p.type === type));
            } catch (error) {
                console.error('Failed to load partners', error);
            } finally {
                setLoading(false);
            }
        };
        loadPartners();
    }, [type]);

    const load = async () => {
        try {
            const data = await getPartners();
            setPartners(data.filter(p => p.type === type));
        } catch (error) {
            console.error('Failed to load partners', error);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingId) {
                await updatePartner(editingId, { ...formData, type });
                setSnackbar({ open: true, message: 'Partner updated successfully', severity: 'success' });
            } else {
                await createPartner({ ...formData, type });
                setSnackbar({ open: true, message: 'Partner created successfully', severity: 'success' });
            }
            setIsModalOpen(false);
            setEditingId(null);
            await load();
            setFormData({
                name: '',
                email: '',
                phone: '',
                address: ''
            });
        } catch (error) {
            console.error('Failed to create partner', error);
            setSnackbar({ open: true, message: 'Failed to create/update partner', severity: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (partner: Partner) => {
        setEditingId(partner.id);
        setFormData({
            name: partner.name,
            email: partner.email || '',
            phone: partner.phone || '',
            address: partner.address || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        setDeleting(true);
        try {
            await deletePartner(id);
            setPartners(partners.filter(p => p.id !== id));
            setDeleteConfirm(null);
            setSnackbar({ open: true, message: 'Partner deleted successfully', severity: 'success' });
        } catch (error) {
            console.error('Failed to delete partner', error);
            setSnackbar({ open: true, message: 'Failed to delete partner', severity: 'error' });
        } finally {
            setDeleting(false);
        }
    };

    const openAddModal = () => {
        setEditingId(null);
        setFormData({
            name: '',
            email: '',
            phone: '',
            address: ''
        });
        setIsModalOpen(true);
    };

    const title = type === 'customer' ? 'Customers' : 'Vendors';

    const filteredPartners = partners.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 400, color: '#1a1a1a' }}>{title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Manage your {title.toLowerCase()}</Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openAddModal} size="large" disabled={role === 'viewonly'}>
                    Add {type === 'customer' ? 'Customer' : 'Vendor'}
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

            {/* Partners Table */}
            <Card elevation={2}>
                <CardContent>
                    <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #f0f0f0' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
                                    <TableCell sx={{ fontWeight: 400, color: '#1a1a1a' }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 400, color: '#1a1a1a' }}>Email</TableCell>
                                    <TableCell sx={{ fontWeight: 400, color: '#1a1a1a' }}>Phone</TableCell>
                                    <TableCell sx={{ fontWeight: 400, color: '#1a1a1a' }}>Address</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 400, color: '#1a1a1a' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredPartners.map(partner => (
                                    <TableRow key={partner.id} hover sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }}>
                                        <TableCell sx={{ fontWeight: 500 }}>{partner.name}</TableCell>
                                        <TableCell><Typography variant="body2">{partner.email || '-'}</Typography></TableCell>
                                        <TableCell>{partner.phone || '-'}</TableCell>
                                        <TableCell>{partner.address || '-'}</TableCell>
                                        <TableCell align="center">
                                            <IconButton size="small" color="primary" onClick={() => handleEdit(partner)} disabled={role === 'viewonly'}><EditIcon fontSize="small" /></IconButton>
                                            <IconButton size="small" color="error" onClick={() => setDeleteConfirm(partner.id)} disabled={role === 'viewonly'}><DeleteIcon fontSize="small" /></IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredPartners.length === 0 && !loading && (
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

            {/* Create Partner Dialog */}
            <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 400, py: 2 }}>{editingId ? `Edit ${type === 'customer' ? 'Customer' : 'Vendor'}` : `Add New ${type === 'customer' ? 'Customer' : 'Vendor'}`}</DialogTitle>
                <DialogContent>
                    <Box component="form" id="partner-form" onSubmit={handleCreate} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
                        <TextField required fullWidth label="Name" placeholder="Full name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} disabled={role === 'viewonly'} />
                        <TextField fullWidth label="Email" type="email" placeholder="Email address" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} disabled={role === 'viewonly'} />
                        <TextField fullWidth label="Phone" placeholder="Contact number" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} disabled={role === 'viewonly'} />
                        <TextField fullWidth label="Address" multiline rows={3} placeholder="Full address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} disabled={role === 'viewonly'} />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setIsModalOpen(false)} disabled={saving}>Cancel</Button>
                    <Button 
                        type="submit" 
                        form="partner-form" 
                        variant="contained"
                        disabled={saving || role === 'viewonly'}
                        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
                    >
                        {saving ? 'Saving...' : (editingId ? 'Update' : 'Save')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={deleteConfirm !== null}
                title={`Delete ${type === 'customer' ? 'Customer' : 'Vendor'}?`}
                message={`Are you sure you want to delete this ${type === 'customer' ? 'customer' : 'vendor'}? This action cannot be undone.`}
                onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
                onCancel={() => setDeleteConfirm(null)}
                confirmText="Delete"
                confirmColor="error"
                severity="error"
                loading={deleting}
            />

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

