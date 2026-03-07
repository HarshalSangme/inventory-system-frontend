import React, { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { useSnackbar } from '../context/SnackbarContext';
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
    TextField,
    Typography,
    CircularProgress
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { getPartners, type Partner, createPartner, updatePartner, deletePartner } from '../services/partnerService';
import ConfirmDialog from '../components/ConfirmDialog';

type PartnersProps = {
    type: 'customer' | 'vendor';
};

const Partners: React.FC<PartnersProps> = ({ type }) => {
    const { role } = useUser();
    const { showSnackbar } = useSnackbar();
    const [partners, setPartners] = useState<Partner[]>([]);
    const [totalPartners, setTotalPartners] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Pagination State
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    // Column Filter State
    const [filterName, setFilterName] = useState('');
    const [filterEmail, setFilterEmail] = useState('');
    const [filterPhone, setFilterPhone] = useState('');
    const [filterAddress, setFilterAddress] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });

    const loadPartners = async (showLoader = true) => {
        if (showLoader) setLoading(true);
        try {
            const res = await getPartners(
                page * rowsPerPage,
                rowsPerPage,
                type,
                debouncedSearch || undefined,
                filterName || undefined,
                filterEmail || undefined,
                filterPhone || undefined,
                filterAddress || undefined
            );
            setPartners(res.data);
            setTotalPartners(res.total);
        } catch (error: any) {
            console.error('Failed to load partners', error);
            const msg = error?.response?.data?.detail || 'Failed to load partners';
            showSnackbar(msg, 'error');
        } finally {
            if (showLoader) setLoading(false);
        }
    };

    useEffect(() => {
        loadPartners();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type, page, rowsPerPage, debouncedSearch, filterName, filterEmail, filterPhone, filterAddress]);

    const load = () => {
        loadPartners(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingId) {
                await updatePartner(editingId, { ...formData, type });
                showSnackbar('Partner updated successfully', 'success');
            } else {
                await createPartner({ ...formData, type });
                showSnackbar('Partner created successfully', 'success');
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
        } catch (error: any) {
            console.error('Failed to create partner', error);
            const msg = error?.response?.data?.detail || 'Failed to create/update partner';
            showSnackbar(msg, 'error');
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
            showSnackbar('Partner deleted successfully', 'success');
        } catch (error: any) {
            console.error('Failed to delete partner', error);
            const msg = error?.response?.data?.detail || 'Failed to delete partner';
            showSnackbar(msg, 'error');
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

    // Reset page when filters change
    useEffect(() => {
        setPage(0);
    }, [searchTerm, filterName, filterEmail, filterPhone, filterAddress]);

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
                    <Box sx={{ width: '100%', mb: 2 }}>
                        <DataGrid
                            rows={partners}
                            columns={[
                                { field: 'name', headerName: 'Name', flex: 1, minWidth: 150 },
                                { field: 'email', headerName: 'Email', flex: 1, minWidth: 150, valueGetter: (params: any) => params.row.email || '-' },
                                { field: 'phone', headerName: 'Phone', width: 130, valueGetter: (params: any) => params.row.phone || '-' },
                                { field: 'address', headerName: 'Address', flex: 1, minWidth: 200, valueGetter: (params: any) => params.row.address || '-' },
                                { field: 'actions', headerName: 'Actions', width: 100, sortable: false, filterable: false, renderCell: (params: any) => (
                                    <>
                                        <IconButton size="small" color="primary" onClick={() => handleEdit(params.row)} disabled={role === 'viewonly'}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => setDeleteConfirm(params.row.id)} disabled={role === 'viewonly'}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </>
                                )}
                            ]}
                            rowCount={totalPartners}
                            loading={loading}
                            pageSizeOptions={[10, 25, 50, 100]}
                            paginationModel={{ page, pageSize: rowsPerPage }}
                            paginationMode="server"
                            onPaginationModelChange={(model: any) => {
                                setPage(model.page);
                                setRowsPerPage(model.pageSize);
                            }}
                            filterMode="server"
                            onFilterModelChange={(model: any) => {
                                // Reset all column filters first
                                setFilterName('');
                                setFilterEmail('');
                                setFilterPhone('');
                                setFilterAddress('');

                                // Apply all active filters
                                model.items.forEach((item: any) => {
                                    if (item.field === 'name') setFilterName(item.value || '');
                                    if (item.field === 'email') setFilterEmail(item.value || '');
                                    if (item.field === 'phone') setFilterPhone(item.value || '');
                                    if (item.field === 'address') setFilterAddress(item.value || '');
                                });
                            }}
                            disableRowSelectionOnClick
                            autoHeight
                            sx={{ border: 'none' }}
                        />
                    </Box>
                </CardContent>
            </Card>

            {/* Create Partner Dialog */}
            <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 400, py: 2 }}>{editingId ? `Edit ${type === 'customer' ? 'Customer' : 'Vendor'}` : `Add New ${type === 'customer' ? 'Customer' : 'Vendor'}`}</DialogTitle>
                <DialogContent>
                    <Box component="form" id="partner-form" onSubmit={handleCreate} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
                        <TextField required fullWidth label="Name" placeholder="Full name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} disabled={role === 'viewonly'} />
                        <TextField required fullWidth label="Email" type="email" placeholder="Email address" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} disabled={role === 'viewonly'} />
                        <TextField required fullWidth label="Phone" placeholder="Contact number" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} disabled={role === 'viewonly'} />
                        <TextField required fullWidth label="Address" multiline rows={3} placeholder="Full address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} disabled={role === 'viewonly'} />
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


        </Box>
    );
};

export default Partners;
{/* Snackbar for notifications */ }

