import React, { useEffect, useState } from 'react';
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
    Typography
} from '@mui/material';
import { getPartners, type Partner, createPartner, updatePartner, deletePartner } from '../services/partnerService';

interface PartnersProps {
    type: 'customer' | 'vendor';
}

export default function Partners({ type }: PartnersProps) {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

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
        try {
            if (editingId) {
                await updatePartner(editingId, { ...formData, type });
                alert('Partner updated successfully');
            } else {
                await createPartner({ ...formData, type });
                alert('Partner created successfully');
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
            alert('Failed to create partner');
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
        try {
            await deletePartner(id);
            setPartners(partners.filter(p => p.id !== id));
            setDeleteConfirm(null);
            alert('Partner deleted successfully');
        } catch (error) {
            console.error('Failed to delete partner', error);
            alert('Failed to delete partner');
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
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a' }}>{title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Manage your {title.toLowerCase()}</Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openAddModal} size="large">
                    Add {type === 'customer' ? 'Customer' : 'Vendor'}
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

            {/* Partners Table */}
            <Card elevation={2}>
                <CardContent>
                    <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #f0f0f0' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
                                    <TableCell sx={{ fontWeight: 700, color: '#1a1a1a' }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#1a1a1a' }}>Email</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#1a1a1a' }}>Phone</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#1a1a1a' }}>Address</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700, color: '#1a1a1a' }}>Actions</TableCell>
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
                                            <IconButton size="small" color="primary" onClick={() => handleEdit(partner)}><EditIcon fontSize="small" /></IconButton>
                                            <IconButton size="small" color="error" onClick={() => setDeleteConfirm(partner.id)}><DeleteIcon fontSize="small" /></IconButton>
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
                <DialogTitle sx={{ fontWeight: 700, py: 2 }}>{editingId ? `Edit ${type === 'customer' ? 'Customer' : 'Vendor'}` : `Add New ${type === 'customer' ? 'Customer' : 'Vendor'}`}</DialogTitle>
                <DialogContent>
                    <Box component="form" id="partner-form" onSubmit={handleCreate} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
                        <TextField required fullWidth label="Name" placeholder="Full name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        <TextField fullWidth label="Email" type="email" placeholder="Email address" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        <TextField fullWidth label="Phone" placeholder="Contact number" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        <TextField fullWidth label="Address" multiline rows={3} placeholder="Full address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button type="submit" form="partner-form" variant="contained">{editingId ? 'Update' : 'Save'}</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)}>
                <DialogTitle sx={{ fontWeight: 700 }}>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to delete this {type === 'customer' ? 'customer' : 'vendor'}?</Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                    <Button onClick={() => handleDelete(deleteConfirm!)} variant="contained" color="error">Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

