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
  CircularProgress
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CloseIcon from '@mui/icons-material/Close';
import jsPDF from 'jspdf';
import { getInvoices } from '../services/invoiceService';

const BANK_DETAILS = {
  name: 'JOT AUTO PARTS W.L.L',
  bank: 'Bahrain Islamic Bank (BisB)',
  iban: 'BH49BISB00010002015324',
};

// Helper to load an image as HTMLImageElement (async)
function loadImageAsync(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.error('Failed to load image:', src);
      reject(new Error('Failed to load image: ' + src));
    };
    img.src = src;
  });
}

async function generateInvoicePDF(invoice: any) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const logoUrl = window.location.origin + '/jot.png';
  const letterUrl = window.location.origin + '/Jot_Letter_Head.jpg';
  const phoneUrl = window.location.origin + '/phone.png';
  const whatsappUrl = window.location.origin + '/whatsapp.png';
  const mailUrl = window.location.origin + '/mail.png';

  // Load logo and letterhead
  let logoImg, letterImg, phoneImg, whatsappImg, mailImg;
  try {
    [logoImg, letterImg, phoneImg, whatsappImg, mailImg] = await Promise.all([
      loadImageAsync(logoUrl),
      loadImageAsync(letterUrl),
      loadImageAsync(phoneUrl),
      loadImageAsync(whatsappUrl),
      loadImageAsync(mailUrl),
    ]);
  } catch (e) {
    console.error('Failed to load images for PDF:', e);
    throw new Error('Failed to load images for PDF');
  }

  const MARGIN_X = 20;
  const MARGIN_TOP = 20;
  const CONTENT_WIDTH = pageWidth - 2 * MARGIN_X;

  // Footer space reservation
  const FOOTER_RESERVED_HEIGHT = 180;

  const formatDate = (d: any) => {
    if (!d) return '';
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2, '0')}-${String(
      date.getMonth() + 1
    ).padStart(2, '0')}-${date.getFullYear()}`;
  };

  /* ================= HEADER (Page 1 Only) ================= */
  let y = MARGIN_TOP;
  const HEADER_Y = 28;
  const BASELINE_Y = HEADER_Y + 6;

  // ---- LOGO ----
  const LOGO_W = 78;
  const logoRatio = logoImg.naturalHeight / logoImg.naturalWidth;
  const LOGO_H = LOGO_W * logoRatio;

  doc.addImage(logoImg, 'PNG', MARGIN_X, BASELINE_Y, LOGO_W, LOGO_H);

  // ---- LETTERHEAD ----
  const LETTER_W = 220;
  const letterRatio = letterImg.naturalHeight / letterImg.naturalWidth;
  const LETTER_H = LETTER_W * letterRatio;
  const LETTER_X = MARGIN_X + LOGO_W + 12;

  doc.addImage(letterImg, 'JPEG', LETTER_X, BASELINE_Y + 2, LETTER_W, LETTER_H);

  // ---- COMPANY ADDRESS (Changed to Times New Roman, smaller size) ----
  doc.setFontSize(6.5);
  doc.setFont('times', 'normal');
  const addressY = BASELINE_Y + LETTER_H + 4;
  doc.text('Shop 128, Road 6, Block 604, Cr number 174260-1', pageWidth / 2, addressY, { align: 'right' });
  doc.setFont('helvetica', 'normal'); // Reset to helvetica for rest of document

  // ---- META BOX (Updated layout to match draft) ----
  const metaBoxW = 240;
  const metaBoxH = 68;
  const metaX = pageWidth - metaBoxW - MARGIN_X;

  doc.setFontSize(9);

  // Draw table structure
  const rowHeight = 17;
  const labelColW = 100;

  // Outer border
  doc.setLineWidth(1);
  doc.rect(metaX, HEADER_Y, metaBoxW, metaBoxH);

  // Draw vertical line between columns
  doc.line(metaX + labelColW, HEADER_Y, metaX + labelColW, HEADER_Y + metaBoxH);

  // All rows have dark background for label column only
  doc.setFillColor(95, 95, 95);
  doc.rect(metaX, HEADER_Y, labelColW, metaBoxH, 'F');

  // Row 1: Invoice Date
  doc.setTextColor(255);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Date:', metaX + 6, HEADER_Y + 12);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(invoice.date), metaX + labelColW + 6, HEADER_Y + 12);
  doc.line(metaX, HEADER_Y + rowHeight, metaX + metaBoxW, HEADER_Y + rowHeight);

  // Row 2: Invoice No
  doc.setTextColor(255);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice No:', metaX + 6, HEADER_Y + rowHeight + 12);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'normal');
  doc.text(String(invoice.invoice_no || invoice.id || ''), metaX + labelColW + 6, HEADER_Y + rowHeight + 12);
  doc.line(metaX, HEADER_Y + 2 * rowHeight, metaX + metaBoxW, HEADER_Y + 2 * rowHeight);

  // Row 3: Payment Terms
  doc.setTextColor(255);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Terms:', metaX + 6, HEADER_Y + 2 * rowHeight + 12);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'normal');
  doc.text('CREDIT', metaX + labelColW + 6, HEADER_Y + 2 * rowHeight + 12);
  doc.line(metaX, HEADER_Y + 3 * rowHeight, metaX + metaBoxW, HEADER_Y + 3 * rowHeight);

  // Row 4: Due Date
  doc.setTextColor(255);
  doc.setFont('helvetica', 'bold');
  doc.text('Due Date:', metaX + 6, HEADER_Y + 3 * rowHeight + 12);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'normal');
  const dueDate = invoice.due_date ? formatDate(invoice.due_date) : '';
  doc.text(dueDate, metaX + labelColW + 6, HEADER_Y + 3 * rowHeight + 12);

  // ---- INVOICE TITLE BAR ----
  const BAR_W = 160;
  const BAR_H = 28;
  const BAR_X = (pageWidth - BAR_W) / 2;
  const BAR_Y = HEADER_Y + Math.max(LOGO_H, LETTER_H) + 22;

  doc.setFillColor(95, 95, 95);
  doc.rect(BAR_X, BAR_Y, BAR_W, BAR_H, 'F');
  doc.setTextColor(255);
  doc.setFontSize(14);
  doc.text('INVOICE', pageWidth / 2, BAR_Y + 19, { align: 'center' });
  doc.setTextColor(0);

  // ---- CUSTOMER BOX ----
  y = BAR_Y + 35;
  doc.setFontSize(8.2);

  const CUSTOMER_BOX_W = 270;
  const CUSTOMER_BOX_H = 60;
  doc.roundedRect(MARGIN_X, y, CUSTOMER_BOX_W, CUSTOMER_BOX_H, 10, 10);
  doc.setFont('helvetica', 'bold');
  doc.text(`CUSTOMER NAME #`, MARGIN_X + 12, y + 20);
  doc.text(`ADDRESS #`, MARGIN_X + 12, y + 34);
  doc.text(`MOBILE NO #`, MARGIN_X + 12, y + 48);
  doc.setFont('helvetica', 'normal');
  // Use partner data for customer information
  const customerName = invoice.partner?.name || invoice.customer_name || '';
  const customerAddress = invoice.partner?.address || invoice.address || '';
  const customerMobile = invoice.partner?.phone || invoice.mobile || '';
  doc.text(String(customerName), MARGIN_X + 120, y + 20);
  doc.text(String(customerAddress), MARGIN_X + 120, y + 34);
  doc.text(String(customerMobile), MARGIN_X + 120, y + 48);

  y += 70; // Move past customer box

  /* ================= TABLE ================= */
  // Headers: SR.NO, ITEM CODE, ITEM NAME, QTY, PRICE, DISCOUNT, AMT, %, VAT, NET AMT
  const headers = ['SR.NO', 'ITEM CODE', 'ITEM NAME', 'QTY', 'PRICE', 'DISCOUNT', 'AMT', '%', 'VAT', 'NET AMT'];

  // Adjusted column widths to accommodate new columns
  const colWidthsAbs = [
    30,   // SR.NO
    55,   // ITEM CODE
    135,  // ITEM NAME
    30,   // QTY
    45,   // PRICE
    50,   // DISCOUNT
    45,   // AMT
    25,   // %
    45,   // VAT
    80,   // NET AMT
  ];

  // Helper to draw table header
  const drawTableHeader = (currentY: number) => {
    doc.setFillColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.rect(MARGIN_X, currentY, CONTENT_WIDTH, 22, 'FD'); // Fill and Draw
    doc.setTextColor(255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');

    let x = MARGIN_X;
    headers.forEach((h, i) => {
      // Center-align headers
      const colCenter = x + colWidthsAbs[i] / 2;
      doc.text(h, colCenter, currentY + 14, { align: 'center' });
      x += colWidthsAbs[i];
    });

    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');
    return currentY + 22;
  };

  doc.setLineWidth(1);
  y = drawTableHeader(y);

  const TABLE_ROW_HEIGHT = 20;

  // Calculate totals on the fly
  let totalGross = 0;
  let totalVat = 0;

  (invoice.items || []).forEach((item: any, idx: number) => {
    // Check for page break
    if (y + TABLE_ROW_HEIGHT > pageHeight - FOOTER_RESERVED_HEIGHT) {
      doc.addPage();
      y = MARGIN_TOP + 20;
      y = drawTableHeader(y);
    }

    const price = Number(item.price || 0);
    const qty = Number(item.quantity || 0);
    const net = price * qty;
    totalGross += net;

    const row = [
      String(idx + 1),
      String(item.product?.sku || item.sku || '-'),
      String(item.product?.name || item.name || ''),
      String(item.quantity || ''),
      price.toFixed(3),
      String(item.discount || ''),
      '', // AMT column (empty for now)
      '', // % column (empty for now)
      String(item.vat || ''),
      net.toFixed(3),
    ];

    // Draw ONLY vertical lines for this row (no horizontal lines)
    let cx = MARGIN_X;

    doc.setLineWidth(0.5);

    // Left border
    doc.line(MARGIN_X, y, MARGIN_X, y + TABLE_ROW_HEIGHT);

    // Column separators
    for (let i = 0; i < colWidthsAbs.length; i++) {
      cx += colWidthsAbs[i];
      doc.line(cx, y, cx, y + TABLE_ROW_HEIGHT);
    }

    // Add text content with proper wrapping for ITEM NAME
    cx = MARGIN_X;
    doc.setFontSize(8);

    row.forEach((cell, i) => {
      if (i === 2) {
        // ITEM NAME - wrap text if too long
        const maxWidth = colWidthsAbs[i] - 8; // padding
        const lines = doc.splitTextToSize(cell, maxWidth);
        doc.text(lines[0] || '', cx + 4, y + 13, { align: 'left' });
      } else if (i === 1) {
        // ITEM CODE - left aligned
        doc.text(cell, cx + 4, y + 13, { align: 'left' });
      } else if (i === 0) {
        // SR.NO - center aligned
        const colCenter = cx + colWidthsAbs[i] / 2;
        doc.text(cell, colCenter, y + 13, { align: 'center' });
      } else {
        // Other columns - right aligned
        doc.text(cell, cx + colWidthsAbs[i] - 4, y + 13, { align: 'right' });
      }
      cx += colWidthsAbs[i];
    });

    y += TABLE_ROW_HEIGHT;
  });

  // Draw bottom border of the table
  doc.line(MARGIN_X, y, MARGIN_X + CONTENT_WIDTH, y);

  // Calculate Final Totals
  const vatPercent = invoice.vat_percent || 0;
  totalVat = totalGross * (vatPercent / 100);
  const finalNet = totalGross + totalVat;

  /* ================= TOTALS & BANK ================= */
  const TOTALS_HEIGHT = 140;
  const BANK_HEIGHT = 100;

  if (y + TOTALS_HEIGHT + BANK_HEIGHT > pageHeight - FOOTER_RESERVED_HEIGHT) {
    doc.addPage();
    y = MARGIN_TOP + 20;
  }

  y += 8;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('*Items sold will not be taken back or returned.', MARGIN_X, y + 10);
  doc.setFont('helvetica', 'normal');

  let totalsX = MARGIN_X + CONTENT_WIDTH - 200;
  let totalsY = y + 20;

  const totals = [
    ['GROSS AMT', totalGross.toFixed(3)],
    ['DISCOUNT', invoice.discount || '-'],
    ['VAT AMT', totalVat > 0 ? totalVat.toFixed(3) : '-'],
    ['Balance C/F', invoice.balance_cf || '-'],
  ];

  doc.setFontSize(9);
  doc.setLineWidth(1);

  totals.forEach(([label, value]) => {
    doc.rect(totalsX, totalsY, 200, 18);
    doc.setFont('helvetica', 'normal');
    doc.text(String(label), totalsX + 6, totalsY + 12);
    doc.text(String(value || ''), totalsX + 190, totalsY + 12, { align: 'right' });
    totalsY += 18;
  });

  // NET AMT row with dark background
  doc.setFillColor(95, 95, 95);
  doc.setTextColor(255);
  doc.rect(totalsX, totalsY, 200, 20, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.text('NET AMT BHD', totalsX + 6, totalsY + 14);

  const displayTotal = (invoice.total_amount !== undefined && invoice.total_amount !== null)
    ? Number(invoice.total_amount).toFixed(3)
    : finalNet.toFixed(3);

  doc.text(displayTotal, totalsX + 190, totalsY + 14, { align: 'right' });
  doc.setTextColor(0);
  doc.setFont('helvetica', 'normal');

  y = totalsY + 22;

  /* ================= BANK DETAILS ================= */
  y += 10;
  const BANK_BOX_W = 380;
  const BANK_BOX_H = 70;
  doc.setLineWidth(1);
  doc.roundedRect(MARGIN_X, y, BANK_BOX_W, BANK_BOX_H, 8, 8);

  doc.setFontSize(8.5);
  let bankY = y + 16;
  doc.setFont('helvetica', 'bold');
  doc.text('BANK TRASNFER DETAILS', MARGIN_X + 8, bankY);
  bankY += 13;
  doc.text(BANK_DETAILS.name, MARGIN_X + 8, bankY);
  bankY += 13;
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${BANK_DETAILS.bank}`, MARGIN_X + 8, bankY);
  bankY += 13;
  doc.text(`IBAN ${BANK_DETAILS.iban}`, MARGIN_X + 8, bankY);

  y += BANK_BOX_H + 18;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Thank You for Your Business!', MARGIN_X, y);
  doc.setFont('helvetica', 'normal');

  /* ================= FOOTER (ALWAYS AT BOTTOM OF LAST PAGE) ================= */
  const barHeight = 28;
  const orangeHeight = 6;
  const contactBarTotal = barHeight + orangeHeight + 10;

  const shopFooterImgUrl = window.location.origin + '/shop_footer_board.jpg';
  let shopFooterH = 0;
  let shopFooterW = pageWidth - 2 * MARGIN_X;
  let shopFooterY = 0;

  try {
    const shopFooterImg = await loadImageAsync(shopFooterImgUrl);
    shopFooterH = (shopFooterImg.naturalHeight / shopFooterImg.naturalWidth) * shopFooterW;
    shopFooterY = pageHeight - contactBarTotal - shopFooterH - 10;

    if (y > shopFooterY - 60) {
      doc.addPage();
      shopFooterY = pageHeight - contactBarTotal - shopFooterH - 10;
    }

    doc.addImage(shopFooterImg, 'JPEG', MARGIN_X, shopFooterY, shopFooterW, shopFooterH);
  } catch (e) {
    console.warn('Shop footer image not loaded:', e);
    shopFooterY = pageHeight - contactBarTotal - 60;
    if (y > shopFooterY - 60) {
      doc.addPage();
      shopFooterY = pageHeight - contactBarTotal - 60;
    }
  }

  // Signature Row (Above Shop Footer Image)
  let sigRowY = shopFooterY - 35;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Authorized Signatory/STAMP', MARGIN_X, sigRowY);

  doc.setFont('helvetica', 'bold');
  const salesPerson = invoice.sales_person || 'Mamun Hussain';
  doc.text(`Sales Person # ${salesPerson}`, pageWidth / 2 - 40, sigRowY, { align: 'left' });
  doc.text('Date', pageWidth / 2 + 50, sigRowY);
  doc.text('Time', pageWidth / 2 + 90, sigRowY);

  doc.setFont('helvetica', 'normal');
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-GB');
  doc.text(dateStr, pageWidth / 2 + 50, sigRowY + 14);

  doc.setFont('helvetica', 'bold');
  doc.text('Receiver Signature', pageWidth - MARGIN_X, sigRowY, { align: 'right' });
  doc.setFont('helvetica', 'normal');

  // Contact Footer Bar (Very Bottom) - WITH VISIBLE ICONS matching image 3
  const barY = pageHeight - barHeight - orangeHeight - 8;

  // Black bar
  doc.setFillColor(30, 30, 30);
  doc.rect(0, barY, pageWidth, barHeight, 'F');

  // Orange stripe
  doc.setFillColor(217, 108, 0);
  doc.rect(0, barY + barHeight, pageWidth, orangeHeight, 'F');

  // Draw phone icons on the left
  const iconSize = 28;
  const iconY = barY + (barHeight - iconSize) / 2;

  // First phone icon
  doc.addImage(phoneImg, 'PNG', 18, iconY, iconSize, iconSize);

  // Second WhatsApp icon
  doc.addImage(whatsappImg, 'PNG', 48, iconY, iconSize, iconSize);

  // Phone number text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('+973 36341106', 78, barY + 19);

  // Email section on the right
  const emailIconX = pageWidth - 190;
  doc.addImage(mailImg, 'PNG', emailIconX, iconY, iconSize, iconSize);

  doc.text('harjinders717@gmail.com', pageWidth - 24, barY + 19, { align: 'right' });

  doc.save(`invoice_${invoice.id}.pdf`);
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);

  // Snackbar State
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    getInvoices().then(data => {
      setInvoices(data.filter((inv: any) => inv.type === 'sale'));
    });
  }, []);

  const handleDownloadPDF = async () => {
    if (!selected) return;
    
    setDownloading(true);
    try {
      await generateInvoicePDF(selected);
      setSnackbar({ open: true, message: 'Invoice PDF downloaded successfully', severity: 'success' });
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      setSnackbar({ open: true, message: 'Failed to generate invoice PDF', severity: 'error' });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Download Invoice PDF
      </Typography>

      <Autocomplete
        options={invoices}
        getOptionLabel={inv =>
          inv.customer_name || `Invoice #${inv.id}`
        }
        value={selected}
        onChange={(_, value) => setSelected(value)}
        sx={{ minWidth: 320, mb: 2 }}
        renderInput={params => (
          <TextField {...params} label="Select Invoice" />
        )}
      />

      <Button
        variant="contained"
        startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <PictureAsPdfIcon />}
        disabled={!selected || downloading}
        onClick={handleDownloadPDF}
      >
        {downloading ? 'Generating PDF...' : 'Download Invoice'}
      </Button>

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