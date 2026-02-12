import { useEffect, useState } from 'react';
import {
  Button,
  Box,
  Typography,
  Autocomplete,
  TextField,
  Snackbar,
  Paper,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { getInvoices, downloadInvoicePDF } from '../services/invoiceService';

const PAYMENT_TERMS_OPTIONS = [
  'CASH',
  'CREDIT',
  'NET 15',
  'NET 30',
  'NET 45',
  'NET 60',
  'COD',
  'PREPAID'
];

// Generate invoice number in format JOT/YYYY/XXX
function generateInvoiceNumber(invoiceId: number): string {
  const year = new Date().getFullYear();
  const paddedId = String(invoiceId).padStart(3, '0');
  return `JOT/${year}/${paddedId}`;
}

interface InvoiceEditData {
  invoiceNumber: string;
  paymentTerms: string;
  dueDate: string;
  salesPerson: string;
  notes: string;
}

// PDF generation is handled by backend using Python ReportLab
// See: backend/app/invoice_pdf.py and POST /transactions/{id}/invoice endpoint

export default function Invoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Edit form state
  const [editData, setEditData] = useState<InvoiceEditData>({
    invoiceNumber: '',
    paymentTerms: 'CREDIT',
    dueDate: '',
    salesPerson: 'Mamun Hussain',
    notes: ''
  });

  // Snackbar State
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const data = await getInvoices();
      // Filter to sales only
      setInvoices(data.filter((inv: any) => inv.type === 'sale'));
    } catch (error) {
      console.error('Failed to load invoices:', error);
      setSnackbar({ open: true, message: 'Failed to load invoices', severity: 'error' });
    }
  };

  const handleOpenEditDialog = () => {
    if (!selected) return;

    // Calculate default due date (30 days from invoice date)
    const invoiceDate = new Date(selected.date);
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 30);

    setEditData({
      invoiceNumber: generateInvoiceNumber(selected.id),
      paymentTerms: 'CREDIT',
      dueDate: dueDate.toISOString().split('T')[0],
      salesPerson: 'Mamun Hussain',
      notes: ''
    });
    setEditDialogOpen(true);
  };

  const handleDownloadPDF = async () => {
    if (!selected) return;

    setDownloading(true);
    try {
      // Call backend API to generate PDF
      await downloadInvoicePDF(selected.id, {
        invoice_number: editData.invoiceNumber,
        payment_terms: editData.paymentTerms,
        due_date: editData.dueDate,
        sales_person: editData.salesPerson,
      });
      setSnackbar({ open: true, message: 'Invoice PDF downloaded successfully', severity: 'success' });
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      setSnackbar({ open: true, message: 'Failed to generate invoice PDF', severity: 'error' });
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (d: any) => {
    if (!d) return '-';
    const date = new Date(d);
    return date.toLocaleDateString('en-GB');
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
      <Typography variant="h6" sx={{ fontWeight: 400, color: '#1a1a1a', mb: 2 }}>
        Generate Invoice
      </Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Select a sale transaction to generate an invoice
          </Typography>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={invoices}
                getOptionLabel={inv =>
                  `${inv.partner?.name || inv.customer_name || 'Unknown'} - ${formatDate(inv.date)} - BHD ${Number(inv.total_amount || 0).toFixed(3)}`
                }
                value={selected}
                onChange={(_, value) => setSelected(value)}
                size="small"
                renderInput={params => (
                  <TextField {...params} label="Select Sale Transaction" placeholder="Search by customer name..." />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="body2" fontWeight={500}>
                        {option.partner?.name || option.customer_name || 'Unknown Customer'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Date: {formatDate(option.date)} | Amount: BHD {Number(option.total_amount || 0).toFixed(3)} | Items: {option.items?.length || 0}
                      </Typography>
                    </Box>
                  </li>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                disabled={!selected}
                onClick={handleOpenEditDialog}
                size="small"
              >
                Configure & Generate Invoice
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Selected Invoice Preview */}
      {selected && (
        <Card>
          <CardContent>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 500 }}>
              Selected Transaction Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">Customer</Typography>
                <Typography variant="body2">{selected.partner?.name || selected.customer_name || '-'}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">Date</Typography>
                <Typography variant="body2">{formatDate(selected.date)}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">Total Amount</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#2e7d32' }}>
                  BHD {Number(selected.total_amount || 0).toFixed(3)}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">Items</Typography>
                <Typography variant="body2">{selected.items?.length || 0} items</Typography>
              </Grid>
            </Grid>

            {selected.items && selected.items.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Line Items
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 200 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 500, fontSize: 11 }}>Product</TableCell>
                        <TableCell sx={{ fontWeight: 500, fontSize: 11 }} align="right">Qty</TableCell>
                        <TableCell sx={{ fontWeight: 500, fontSize: 11 }} align="right">Price</TableCell>
                        <TableCell sx={{ fontWeight: 500, fontSize: 11 }} align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selected.items.map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ fontSize: 11 }}>{item.product?.name || item.name || '-'}</TableCell>
                          <TableCell sx={{ fontSize: 11 }} align="right">{item.quantity}</TableCell>
                          <TableCell sx={{ fontSize: 11 }} align="right">{Number(item.unit_price || item.price || 0).toFixed(3)}</TableCell>
                          <TableCell sx={{ fontSize: 11 }} align="right">
                            {(Number(item.quantity || 0) * Number(item.unit_price || item.price || 0)).toFixed(3)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Invoice Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VisibilityIcon color="primary" />
            <Typography variant="subtitle1">Configure Invoice Before Download</Typography>
          </Box>
          <IconButton onClick={() => setEditDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            Edit the following fields to customize your invoice. These changes will be reflected in the PDF.
          </Typography>

          <Grid container spacing={2}>
            {/* Invoice Number */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Invoice Number"
                value={editData.invoiceNumber}
                onChange={(e) => setEditData({ ...editData, invoiceNumber: e.target.value })}
                size="small"
                helperText="Format: JOT/YYYY/XXX"
              />
            </Grid>

            {/* Payment Terms */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment Terms</InputLabel>
                <Select
                  value={editData.paymentTerms}
                  label="Payment Terms"
                  onChange={(e) => setEditData({ ...editData, paymentTerms: e.target.value })}
                >
                  {PAYMENT_TERMS_OPTIONS.map(term => (
                    <MenuItem key={term} value={term}>{term}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Due Date */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Due Date"
                type="date"
                value={editData.dueDate}
                onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Sales Person */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Sales Person"
                value={editData.salesPerson}
                onChange={(e) => setEditData({ ...editData, salesPerson: e.target.value })}
                size="small"
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Preview Summary */}
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Invoice Preview Summary</Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">Invoice No</Typography>
                <Typography variant="body2" fontWeight={500}>{editData.invoiceNumber}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">Payment Terms</Typography>
                <Typography variant="body2" fontWeight={500}>{editData.paymentTerms}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">Due Date</Typography>
                <Typography variant="body2" fontWeight={500}>
                  {editData.dueDate ? new Date(editData.dueDate).toLocaleDateString('en-GB') : '-'}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">Sales Person</Typography>
                <Typography variant="body2" fontWeight={500}>{editData.salesPerson}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">Customer</Typography>
                <Typography variant="body2">{selected?.partner?.name || selected?.customer_name || '-'}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">Invoice Date</Typography>
                <Typography variant="body2">{formatDate(selected?.date)}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">Total Amount</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#2e7d32' }}>
                  BHD {Number(selected?.total_amount || 0).toFixed(3)}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">Items Count</Typography>
                <Typography variant="body2">{selected?.items?.length || 0} items</Typography>
              </Grid>
            </Grid>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)} color="inherit" size="small">
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={downloading ? <CircularProgress size={14} color="inherit" /> : <PictureAsPdfIcon />}
            onClick={handleDownloadPDF}
            disabled={downloading}
            size="small"
          >
            {downloading ? 'Generating...' : 'Download PDF'}
          </Button>
        </DialogActions>
      </Dialog>

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
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            backgroundColor: snackbar.severity === 'success' ? '#4caf50' :
              snackbar.severity === 'error' ? '#f44336' :
                snackbar.severity === 'warning' ? '#ff9800' : '#2196f3',
            color: 'white'
          }}
        >
          {snackbar.severity === 'success' && <CheckCircleIcon fontSize="small" />}
          {snackbar.severity === 'error' && <ErrorIcon fontSize="small" />}
          <Typography variant="caption">{snackbar.message}</Typography>
          <IconButton size="small" onClick={() => setSnackbar({ ...snackbar, open: false })} sx={{ color: 'white' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Paper>
      </Snackbar>
    </Box>
  );
}
