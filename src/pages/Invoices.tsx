import { useEffect, useState, useCallback, useRef } from 'react';
import { useUser } from '../context/UserContext';
import {
  Button, Box, Typography, TextField, Snackbar, Paper, IconButton,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, Divider, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Card, CardContent, MenuItem, Select,
  FormControl, InputLabel, Chip, InputAdornment, Avatar, Tooltip,
  Tab, Tabs, Badge, LinearProgress, Autocomplete
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import FilterListIcon from '@mui/icons-material/FilterList';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PaymentIcon from '@mui/icons-material/Payment';
import HistoryIcon from '@mui/icons-material/History';
import { getInvoices, getInvoiceCounts, downloadInvoicePDF } from '../services/invoiceService';
import { getAccountsSummary, recordPayment, getPartnerStatement, type LedgerEntry } from '../services/accountService';
import { getPartners, type Partner } from '../services/partnerService';

const PAYMENT_TERMS_OPTIONS = ['CASH', 'BANK', 'CREDIT', 'NET 15', 'NET 30', 'NET 45', 'NET 60', 'COD', 'PREPAID'];

function generateInvoiceNumber(invoiceId: number): string {
  const year = new Date().getFullYear();
  return `JOT/${year}/${String(invoiceId).padStart(3, '0')}`;
}

interface InvoiceEditData {
  invoiceNumber: string;
  paymentTerms: string;
  dueDate: string;
  salesPerson: string;
}

const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
  const s = (status || 'unpaid').toLowerCase();
  if (s === 'paid') return 'success';
  if (s === 'partial') return 'warning';
  return 'error';
};

const KpiCard = ({ title, value, sub, icon: Icon, color }: any) => (
  <Card elevation={0} sx={{ border: '1px solid #e8e8e8', borderLeft: `4px solid ${color}`, height: '100%' }}>
    <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, px: 2 }}>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11, fontWeight: 500 }}>{title}</Typography>
        <Typography sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '1.05rem', mt: 0.25 }}>{value}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>{sub}</Typography>
      </Box>
      <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${color}18`, color, display: 'flex' }}>
        <Icon sx={{ fontSize: 22 }} />
      </Box>
    </CardContent>
  </Card>
);

const PAGE_SIZE = 25;
const TAB_STATUS = [undefined, 'unpaid', 'partial', 'paid'] as const;

export default function Accounts() {
  const { role } = useUser();

  // Invoice / Transaction state — server-side paginated
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoiceTotal, setInvoiceTotal] = useState(0);
  const [page, setPage] = useState(0); // 0-indexed
  const [counts, setCounts] = useState({ total: 0, unpaid: 0, partial: 0, paid: 0 });
  const [downloading, setDownloading] = useState(false);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedInv, setSelectedInv] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [invoiceTabValue, setInvoiceTabValue] = useState(0);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [editData, setEditData] = useState<InvoiceEditData>({ invoiceNumber: '', paymentTerms: 'CREDIT', dueDate: '', salesPerson: '' });

  // Accounts / Ledger state
  const [accountSummary, setAccountSummary] = useState({ total_receivables: 0, total_payables: 0 });
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [statement, setStatement] = useState<LedgerEntry[]>([]);
  const [loadingStatement, setLoadingStatement] = useState(false);

  // Payment recording state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentTx, setPaymentTx] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Main page tab (Invoices vs Ledger Statement)
  const [mainTab, setMainTab] = useState(0);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  // Debounce search
  const searchTimer = useRef<any>(null);
  const handleSearchChange = (val: string) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setDebouncedSearch(val); setPage(0); }, 400);
  };

  const getLoggedInUsername = (): string => {
    const token = localStorage.getItem('token');
    if (!token) return '';
    try { return JSON.parse(atob(token.split('.')[1])).sub || ''; } catch { return ''; }
  };

  // Load KPI counts + financial summary (lightweight — no row data)
  const loadCounts = useCallback(async () => {
    try {
      const [summaryRes, partnerRes, countsRes] = await Promise.all([
        getAccountsSummary(),
        getPartners(0, 1000),
        getInvoiceCounts(),
      ]);
      setAccountSummary(summaryRes);
      setPartners(partnerRes.data || []);
      setCounts(countsRes);
    } catch { /* silent */ }
  }, []);

  // Load current page of invoices (server-side filtered)
  const loadInvoices = useCallback(async (pg: number, tab: number, srch: string) => {
    setLoadingInvoices(true);
    try {
      const status = TAB_STATUS[tab];
      const res = await getInvoices(pg * PAGE_SIZE, PAGE_SIZE, srch || undefined, status);
      setInvoices(res.data || []);
      setInvoiceTotal(res.total || 0);
    } catch { setSnackbar({ open: true, message: 'Failed to load invoices', severity: 'error' }); }
    finally { setLoadingInvoices(false); }
  }, []);

  // Initial load
  useEffect(() => { loadCounts(); }, [loadCounts]);

  // Reload when tab / page / debounced search changes
  useEffect(() => { loadInvoices(page, invoiceTabValue, debouncedSearch); }, [page, invoiceTabValue, debouncedSearch, loadInvoices]);

  const handleTabChange = (_: any, v: number) => { setInvoiceTabValue(v); setPage(0); };

  const totalPages = Math.ceil(invoiceTotal / PAGE_SIZE);
  const kpi = counts;

  const getAmounts = (inv: any) => {
    const total = parseFloat(inv?.total_amount) || 0;
    const paid = parseFloat(inv?.amount_paid) || 0;
    const due = Math.max(0, total - paid);
    const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
    return { total, paid, due, pct };
  };

  const handleOpenDetail = (inv: any) => { setSelectedInv(inv); setDetailDialogOpen(true); };

  const handleOpenPdfDialog = (inv: any) => {
    const invoiceDate = new Date(inv.date);
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 30);
    setSelectedInv(inv);
    setEditData({ invoiceNumber: generateInvoiceNumber(inv.id), paymentTerms: inv.payment_status === 'paid' ? 'CASH' : 'CREDIT', dueDate: dueDate.toISOString().split('T')[0], salesPerson: inv.sales_person || getLoggedInUsername() });
    setPdfDialogOpen(true);
  };

  const handleDownloadPDF = async () => {
    if (!selectedInv) return;
    setDownloading(true);
    try {
      await downloadInvoicePDF(selectedInv.id, { invoice_number: editData.invoiceNumber, payment_terms: editData.paymentTerms, due_date: editData.dueDate, sales_person: editData.salesPerson });
      setSnackbar({ open: true, message: 'Invoice PDF downloaded successfully', severity: 'success' });
      setPdfDialogOpen(false);
    } catch { setSnackbar({ open: true, message: 'Failed to generate invoice PDF', severity: 'error' }); }
    finally { setDownloading(false); }
  };

  const handleOpenPayment = (inv: any) => {
    const { due } = getAmounts(inv);
    setPaymentTx(inv);
    setPaymentAmount(due.toFixed(3));
    setPaymentMethod('Cash');
    setPaymentNotes('');
    setPaymentDialogOpen(true);
  };

  const handleRecordPayment = async () => {
    if (!paymentTx || !paymentAmount || parseFloat(paymentAmount) <= 0) return;
    setSubmitting(true);
    try {
      await recordPayment({ transaction_id: paymentTx.id, partner_id: paymentTx.partner_id, amount: parseFloat(paymentAmount), payment_method: paymentMethod, notes: paymentNotes });
      setPaymentDialogOpen(false);
      setSnackbar({ open: true, message: 'Payment recorded successfully!', severity: 'success' });
      // Refresh current page + counts
      await Promise.all([
        loadInvoices(page, invoiceTabValue, debouncedSearch),
        loadCounts(),
      ]);
      if (selectedPartner && selectedPartner.id === paymentTx.partner_id) fetchStatement(selectedPartner.id);
    } catch { setSnackbar({ open: true, message: 'Failed to record payment', severity: 'error' }); }
    finally { setSubmitting(false); }
  };

  const fetchStatement = async (partnerId: number) => {
    setLoadingStatement(true);
    try {
      const data = await getPartnerStatement(partnerId);
      setStatement(data);
    } catch { console.error('Failed to fetch statement'); }
    finally { setLoadingStatement(false); }
  };

  useEffect(() => {
    if (selectedPartner) fetchStatement(selectedPartner.id);
    else setStatement([]);
  }, [selectedPartner]);

  const formatDate = (d: any) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
  const fBHD = (n: number) => `BHD ${n.toFixed(3)}`;
  const getInitials = (name: string = '') => name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
      {/* Header */}
      <Box sx={{ mb: 2.5 }}>
        <Typography sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '1.2rem' }}>Accounts</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
          Manage receivables, record payments, generate invoices and view partner ledger statements.
        </Typography>
      </Box>

      {/* KPI Row — combining invoice + financial data */}
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid item xs={6} sm={2.4}><KpiCard title="Total Receivables" value={fBHD(accountSummary.total_receivables)} sub="Owed by customers" icon={TrendingUpIcon} color="#d32f2f" /></Grid>
        <Grid item xs={6} sm={2.4}><KpiCard title="Total Payables" value={fBHD(accountSummary.total_payables)} sub="Owed to vendors" icon={TrendingDownIcon} color="#ed6c02" /></Grid>
        <Grid item xs={6} sm={2.4}><KpiCard title="Unpaid Invoices" value={kpi.unpaid} sub="Action required" icon={MoneyOffIcon} color="#c62828" /></Grid>
        <Grid item xs={6} sm={2.4}><KpiCard title="Partial Invoices" value={kpi.partial} sub="Partially settled" icon={ReceiptLongIcon} color="#f9a825" /></Grid>
        <Grid item xs={12} sm={2.4}><KpiCard title="Outstanding Total" value={fBHD(accountSummary.total_receivables + accountSummary.total_payables)} sub="Net amount owed" icon={AccountBalanceWalletIcon} color="#7b1fa2" /></Grid>
      </Grid>

      {/* Main Page Tabs */}
      <Paper elevation={0} sx={{ border: '1px solid #e8e8e8', mb: 0 }}>
        <Box sx={{ borderBottom: '1px solid #e8e8e8' }}>
          <Tabs value={mainTab} onChange={(_, v) => setMainTab(v)}
            sx={{ px: 2, '& .MuiTab-root': { fontSize: 13, fontWeight: 500, textTransform: 'none', minHeight: 44 } }}>
            <Tab icon={<ReceiptLongIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Invoice Center" />
            <Tab icon={<HistoryIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Partner Statements" />
          </Tabs>
        </Box>

        {/* ============ TAB 0: INVOICE CENTER ============ */}
        {mainTab === 0 && (
          <Box>
            {/* Toolbar */}
            <Box sx={{ px: 2, pt: 1.5, pb: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Tabs value={invoiceTabValue} onChange={handleTabChange}
                sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0, fontSize: 12, fontWeight: 500, textTransform: 'none' } }}>
                <Tab label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>All <Badge badgeContent={kpi.total} color="default" max={999} sx={{ ml: 1 }} /></Box>} />
                <Tab label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>Unpaid <Badge badgeContent={kpi.unpaid} color="error" max={99} sx={{ ml: 1 }} /></Box>} />
                <Tab label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>Partial <Badge badgeContent={kpi.partial} color="warning" max={99} sx={{ ml: 1 }} /></Box>} />
                <Tab label="Paid" />
              </Tabs>
              <TextField size="small" placeholder="Search by customer, ID, salesperson..."
                value={search} onChange={e => handleSearchChange(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: 'text.secondary' }} /></InputAdornment> }}
                sx={{ width: 280, '& .MuiInputBase-input': { fontSize: 12 } }}
              />
            </Box>
            <Divider sx={{ mt: 1 }} />
            {loadingInvoices && <LinearProgress />}

            <TableContainer>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ '& .MuiTableCell-head': { bgcolor: '#f8f9fa', fontWeight: 600, fontSize: 11, color: '#555', py: 1 } }}>
                    <TableCell>Invoice / Customer</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">Paid</TableCell>
                    <TableCell align="right">Net Due</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center" sx={{ width: 110 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                      <FilterListIcon sx={{ fontSize: 36, mb: 1, opacity: 0.3, display: 'block', mx: 'auto' }} />
                      <Typography variant="body2" color="text.secondary">No transactions found</Typography>
                    </TableCell></TableRow>
                  ) : invoices.map((inv: any) => {
                    const { total, paid, due, pct } = getAmounts(inv);
                    return (
                      <TableRow key={inv.id} hover sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 28, height: 28, fontSize: 10, fontWeight: 700, bgcolor: '#1976d210', color: '#1976d2' }}>
                              {getInitials(inv.partner?.name)}
                            </Avatar>
                            <Box>
                              <Typography fontWeight={500} sx={{ fontSize: 12 }}>{inv.partner?.name || 'Unknown'}</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>#{generateInvoiceNumber(inv.id)}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell><Typography sx={{ fontSize: 12 }}>{formatDate(inv.date)}</Typography></TableCell>
                        <TableCell align="right"><Typography fontWeight={500} sx={{ fontSize: 12 }}>{fBHD(total)}</Typography></TableCell>
                        <TableCell align="right">
                          <Typography sx={{ fontSize: 12, color: '#2e7d32' }}>{fBHD(paid)}</Typography>
                          <LinearProgress variant="determinate" value={pct} sx={{ height: 3, borderRadius: 1, mt: 0.5, bgcolor: '#e0e0e0', '& .MuiLinearProgress-bar': { bgcolor: pct >= 100 ? '#4caf50' : pct > 0 ? '#ff9800' : '#ef5350' } }} />
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={due > 0 ? 600 : 400} sx={{ fontSize: 12, color: due > 0 ? '#d32f2f' : '#2e7d32' }}>
                            {due > 0 ? `− ${fBHD(due)}` : '✓ Settled'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={(inv.payment_status || 'unpaid').toUpperCase()} size="small" color={getStatusColor(inv.payment_status)} sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700 }} />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.25, justifyContent: 'center' }}>
                            <Tooltip title="View Details"><IconButton size="small" onClick={() => handleOpenDetail(inv)}><InfoOutlinedIcon sx={{ fontSize: 15 }} /></IconButton></Tooltip>
                            <Tooltip title="Generate PDF"><IconButton size="small" color="primary" onClick={() => handleOpenPdfDialog(inv)} disabled={role === 'viewonly'}><PictureAsPdfIcon sx={{ fontSize: 15 }} /></IconButton></Tooltip>
                            {(inv.payment_status === 'unpaid' || inv.payment_status === 'partial') && (
                              <Tooltip title="Record Payment"><IconButton size="small" color="success" onClick={() => handleOpenPayment(inv)} disabled={role === 'viewonly'}><PaymentIcon sx={{ fontSize: 15 }} /></IconButton></Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ px: 2, py: 1, borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, invoiceTotal)} of {invoiceTotal} invoices
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton size="small" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
                  <NavigateBeforeIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <Typography variant="caption" sx={{ fontSize: 11 }}>Page {page + 1} of {totalPages || 1}</Typography>
                <IconButton size="small" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
                  <NavigateNextIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <Button size="small" sx={{ fontSize: 10 }} onClick={() => { loadInvoices(page, invoiceTabValue, debouncedSearch); loadCounts(); }}>Refresh</Button>
              </Box>
            </Box>
          </Box>
        )}

        {/* ============ TAB 1: PARTNER STATEMENTS ============ */}
        {mainTab === 1 && (
          <Box sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={partners}
                  getOptionLabel={(option) => `${option.name} (${option.type.toUpperCase()})`}
                  value={selectedPartner}
                  onChange={(_, val) => setSelectedPartner(val)}
                  size="small"
                  renderInput={(params) => (
                    <TextField {...params} label="Select Customer / Vendor" placeholder="Start typing name..."
                      InputProps={{ ...params.InputProps, startAdornment: <><SearchIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />{params.InputProps.startAdornment}</> }} />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                {selectedPartner && statement.length > 0 && (
                  <Paper variant="outlined" sx={{ px: 2, py: 1.5, display: 'inline-flex', gap: 3, borderRadius: 1.5 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, fontWeight: 600 }}>CURRENT BALANCE</Typography>
                      <Typography fontWeight={700} sx={{ fontSize: 14, color: statement[0]?.balance > 0 ? '#d32f2f' : '#2e7d32' }}>
                        {Math.abs(statement[0]?.balance || 0).toFixed(3)} BHD
                        <Typography component="span" sx={{ fontSize: 10, ml: 0.5, fontWeight: 400 }}>
                          {statement[0]?.balance > 0 ? 'DUE' : 'CREDIT'}
                        </Typography>
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, fontWeight: 600 }}>TRANSACTIONS</Typography>
                      <Typography fontWeight={700} sx={{ fontSize: 14 }}>{statement.length}</Typography>
                    </Box>
                  </Paper>
                )}
              </Grid>
            </Grid>

            {loadingStatement ? (
              <Box sx={{ textAlign: 'center', py: 5 }}><CircularProgress size={28} /></Box>
            ) : !selectedPartner ? (
              <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                <AccountBalanceWalletIcon sx={{ fontSize: 48, mb: 1, opacity: 0.2 }} />
                <Typography>Select a customer or vendor to view their ledger history.</Typography>
              </Box>
            ) : statement.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                <HistoryIcon sx={{ fontSize: 48, mb: 1, opacity: 0.2 }} />
                <Typography>No ledger entries found for this partner.</Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow sx={{ '& .MuiTableCell-head': { bgcolor: '#f8f9fa', fontWeight: 600, fontSize: 11, color: '#555', py: 1 } }}>
                      <TableCell>Date</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="center">Type</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">Running Balance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {statement.map((entry: any) => (
                      <TableRow key={entry.id} hover>
                        <TableCell sx={{ fontSize: 11 }}>{formatDate(entry.date)}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{entry.description || '-'}</TableCell>
                        <TableCell align="center">
                          <Chip label={entry.type.toUpperCase()} size="small" variant="outlined"
                            color={entry.type === 'debit' ? 'error' : 'success'}
                            sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }} />
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: 11, fontWeight: 500 }}>{Number(entry.amount).toFixed(3)}</TableCell>
                        <TableCell align="right" sx={{ fontSize: 12, fontWeight: 700, color: entry.balance > 0 ? '#d32f2f' : '#2e7d32' }}>
                          {Number(entry.balance).toFixed(3)} {entry.balance > 0 ? '↑ DUE' : '✓'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </Paper>

      {/* ======= TRANSACTION DETAIL DIALOG ======= */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptLongIcon sx={{ fontSize: 18, color: '#1976d2' }} />
            <Typography fontWeight={600} sx={{ fontSize: 14 }}>Transaction Details — {selectedInv ? `#${generateInvoiceNumber(selectedInv.id)}` : ''}</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {selectedInv && <Chip label={(selectedInv.payment_status || 'unpaid').toUpperCase()} size="small" color={getStatusColor(selectedInv.payment_status)} sx={{ fontWeight: 700 }} />}
            <IconButton onClick={() => setDetailDialogOpen(false)} size="small"><CloseIcon /></IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        {selectedInv && (() => {
          const { total, paid, due, pct } = getAmounts(selectedInv);
          return (
            <DialogContent sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <Grid container spacing={1.5} sx={{ mb: 2 }}>
                    {[
                      { label: 'Customer', value: selectedInv.partner?.name || '-' },
                      { label: 'Invoice Date', value: formatDate(selectedInv.date) },
                      { label: 'Sales Person', value: selectedInv.sales_person || '-' },
                      { label: 'Line Items', value: `${selectedInv.items?.length || 0} items` },
                      { label: 'Payment Method', value: selectedInv.payment_method || '-' },
                    ].map(r => (
                      <Grid item xs={6} sm={4} key={r.label}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>{r.label}</Typography>
                        <Typography fontWeight={500} sx={{ fontSize: 12 }}>{r.value}</Typography>
                      </Grid>
                    ))}
                  </Grid>
                  {selectedInv.items?.length > 0 && (
                    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 220, borderRadius: 1 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow sx={{ '& .MuiTableCell-head': { bgcolor: '#f5f5f5', fontSize: 10, fontWeight: 700, py: 0.8 } }}>
                            <TableCell>Product</TableCell><TableCell align="right">Qty</TableCell><TableCell align="right">Price</TableCell><TableCell align="right">Total</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedInv.items.map((item: any, idx: number) => {
                            const qty = parseFloat(item.quantity) || 0;
                            const price = parseFloat(item.price) || 0;
                            return (
                              <TableRow key={idx} hover>
                                <TableCell sx={{ fontSize: 11 }}>{item.product?.name || '-'}</TableCell>
                                <TableCell align="right" sx={{ fontSize: 11 }}>{qty}</TableCell>
                                <TableCell align="right" sx={{ fontSize: 11 }}>{price.toFixed(3)}</TableCell>
                                <TableCell align="right" sx={{ fontSize: 11, fontWeight: 500 }}>{(qty * price).toFixed(3)}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
                    <Typography variant="caption" fontWeight={700} color="primary" sx={{ display: 'block', mb: 1.5, fontSize: 10 }}>FINANCIAL SUMMARY</Typography>
                    {[
                      { label: 'Invoice Total', value: fBHD(total), color: '#1a1a1a' },
                      { label: 'Amount Paid', value: `+ ${fBHD(paid)}`, color: '#2e7d32' },
                      { label: 'Balance Due', value: due > 0 ? `− ${fBHD(due)}` : '✓ Fully Settled', color: due > 0 ? '#d32f2f' : '#2e7d32' },
                    ].map(r => (
                      <Box key={r.label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{r.label}</Typography>
                        <Typography sx={{ fontSize: 12, fontWeight: 600, color: r.color }}>{r.value}</Typography>
                      </Box>
                    ))}
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ mb: 1.5 }}>
                      <LinearProgress variant="determinate" value={pct} sx={{ height: 6, borderRadius: 3, bgcolor: '#e0e0e0', '& .MuiLinearProgress-bar': { bgcolor: pct >= 100 ? '#4caf50' : pct > 0 ? '#ff9800' : '#ef5350' } }} />
                      <Typography sx={{ fontSize: 9, textAlign: 'right', mt: 0.5, color: 'text.secondary' }}>{pct.toFixed(0)}% paid</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button variant="outlined" size="small" fullWidth startIcon={<PictureAsPdfIcon />}
                        onClick={() => { setDetailDialogOpen(false); handleOpenPdfDialog(selectedInv); }} disabled={role === 'viewonly'} sx={{ fontSize: 11 }}>
                        PDF
                      </Button>
                      {due > 0 && (
                        <Button variant="contained" size="small" fullWidth startIcon={<PaymentIcon />} color="success"
                          onClick={() => { setDetailDialogOpen(false); handleOpenPayment(selectedInv); }} disabled={role === 'viewonly'} sx={{ fontSize: 11 }}>
                          Pay
                        </Button>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
          );
        })()}
        <DialogActions sx={{ px: 3, py: 1 }}><Button onClick={() => setDetailDialogOpen(false)} size="small">Close</Button></DialogActions>
      </Dialog>

      {/* ======= PDF CONFIG DIALOG ======= */}
      <Dialog open={pdfDialogOpen} onClose={() => setPdfDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PictureAsPdfIcon color="primary" sx={{ fontSize: 18 }} />
            <Typography fontWeight={600} sx={{ fontSize: 14 }}>Configure Invoice PDF</Typography>
          </Box>
          <IconButton onClick={() => setPdfDialogOpen(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          {selectedInv && (() => {
            const { total, paid, due } = getAmounts(selectedInv);
            return (
              <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: '#f8f9fa', borderRadius: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>Generating invoice for</Typography>
                    <Typography fontWeight={600} sx={{ fontSize: 13 }}>{selectedInv.partner?.name || 'Unknown'}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                      {formatDate(selectedInv.date)} · Total: {fBHD(total)} · Paid: {fBHD(paid)} · Due: {fBHD(due)}
                    </Typography>
                  </Box>
                  <Chip label={(selectedInv.payment_status || 'unpaid').toUpperCase()} size="small" color={getStatusColor(selectedInv.payment_status)} sx={{ fontWeight: 700 }} />
                </Box>
              </Paper>
            );
          })()}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Invoice Number" value={editData.invoiceNumber} onChange={e => setEditData({ ...editData, invoiceNumber: e.target.value })} size="small" helperText="Format: JOT/YYYY/XXX" disabled={role === 'viewonly'} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment Terms</InputLabel>
                <Select value={editData.paymentTerms} label="Payment Terms" onChange={e => setEditData({ ...editData, paymentTerms: e.target.value })} disabled={role === 'viewonly'}>
                  {PAYMENT_TERMS_OPTIONS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Due Date" type="date" value={editData.dueDate} onChange={e => setEditData({ ...editData, dueDate: e.target.value })} size="small" InputLabelProps={{ shrink: true }} disabled={role === 'viewonly'} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Sales Person" value={editData.salesPerson} onChange={e => setEditData({ ...editData, salesPerson: e.target.value })} size="small" disabled={role === 'viewonly'} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => setPdfDialogOpen(false)} color="inherit" size="small">Cancel</Button>
          <Button variant="contained" startIcon={downloading ? <CircularProgress size={14} color="inherit" /> : <PictureAsPdfIcon />} onClick={handleDownloadPDF} disabled={downloading || role === 'viewonly'} size="small">
            {downloading ? 'Generating...' : 'Download PDF'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ======= RECORD PAYMENT DIALOG ======= */}
      <Dialog open={paymentDialogOpen} onClose={() => !submitting && setPaymentDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><PaymentIcon color="success" sx={{ fontSize: 18 }} /><Typography fontWeight={600} sx={{ fontSize: 14 }}>Record Payment</Typography></Box>
          <IconButton size="small" onClick={() => setPaymentDialogOpen(false)} disabled={submitting}><CloseIcon /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          {paymentTx && (() => {
            const { total, paid, due } = getAmounts(paymentTx);
            return (
              <>
                <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: '#f8f9fa', borderRadius: 1.5 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}><Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>Customer</Typography><Typography fontWeight={600} sx={{ fontSize: 12 }}>{paymentTx.partner?.name || '-'}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>Invoice Total</Typography><Typography fontWeight={600} sx={{ fontSize: 12 }}>{fBHD(total)}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>Already Paid</Typography><Typography fontWeight={600} sx={{ fontSize: 12, color: '#2e7d32' }}>{fBHD(paid)}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="caption" color="error" sx={{ fontSize: 10 }}>Remaining Due</Typography><Typography fontWeight={700} sx={{ fontSize: 12, color: '#d32f2f' }}>{fBHD(due)}</Typography></Grid>
                  </Grid>
                </Paper>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField label="Payment Amount (BHD)" type="number" fullWidth value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} size="small" autoFocus inputProps={{ min: 0.001, max: due, step: 0.001 }} helperText={`Max due: ${fBHD(due)}`} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField select label="Payment Method" fullWidth value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} size="small">
                      <MenuItem value="Cash">Cash</MenuItem>
                      <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                      <MenuItem value="Cheque">Cheque</MenuItem>
                      <MenuItem value="Card">Credit/Debit Card</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField label="Notes (optional)" multiline rows={2} fullWidth value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} size="small" placeholder="E.g. Received via cheque #1234..." />
                  </Grid>
                </Grid>
              </>
            );
          })()}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => setPaymentDialogOpen(false)} disabled={submitting} size="small">Cancel</Button>
          <Button variant="contained" color="success" onClick={handleRecordPayment} disabled={submitting || !paymentAmount || parseFloat(paymentAmount) <= 0} size="small"
            startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : <CheckCircleIcon />}>
            {submitting ? 'Recording...' : 'Confirm Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Paper elevation={6} sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1, bgcolor: snackbar.severity === 'success' ? '#4caf50' : '#f44336', color: 'white' }}>
          {snackbar.severity === 'success' ? <CheckCircleIcon fontSize="small" /> : <ErrorIcon fontSize="small" />}
          <Typography variant="caption">{snackbar.message}</Typography>
          <IconButton size="small" onClick={() => setSnackbar({ ...snackbar, open: false })} sx={{ color: 'white' }}><CloseIcon fontSize="small" /></IconButton>
        </Paper>
      </Snackbar>
    </Box>
  );
}
