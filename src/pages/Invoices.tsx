import { useEffect, useState } from 'react';
import {
  Button,
  Box,
  Typography,
  Autocomplete,
  TextField,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
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
      alert('Failed to load image: ' + src);
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
  // const stampUrl = window.location.origin + '/jot_stamp.png';

  // Load logo and letterhead
  let logoImg, letterImg;
  try {
    [logoImg, letterImg] = await Promise.all([
      loadImageAsync(logoUrl),
      loadImageAsync(letterUrl),
    ]);
  } catch (e) {
    alert('Failed to load images for PDF.');
    return;
  }

  const MARGIN_X = 20;
  const MARGIN_TOP = 20;
  const CONTENT_WIDTH = pageWidth - 2 * MARGIN_X;

  // Footer space reservation (Brand Image ~60pt + Contact Bar ~40pt + Signatures ~80pt + Margins)
  // We need to ensure we don't print rows into this area relative to the bottom
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

  // ---- META BOX ----
  const metaBoxW = 175;
  const metaBoxH = 68;
  const metaX = pageWidth - metaBoxW - MARGIN_X;

  doc.setFontSize(9);
  doc.rect(metaX, HEADER_Y, metaBoxW, metaBoxH);

  doc.text('Invoice Date:', metaX + 6, HEADER_Y + 16);
  doc.text(formatDate(invoice.date), metaX + 95, HEADER_Y + 16);

  doc.text('Invoice No:', metaX + 6, HEADER_Y + 32);
  doc.text(String(invoice.invoice_no || invoice.id || ''), metaX + 95, HEADER_Y + 32);

  doc.text('Payment Terms:', metaX + 6, HEADER_Y + 48);
  doc.text('CREDIT', metaX + 95, HEADER_Y + 48);

  doc.text('Due Date:', metaX + 6, HEADER_Y + 64);
  doc.text(String(invoice.due_date || ''), metaX + 95, HEADER_Y + 64);

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
  doc.text(String(invoice.customer_name || ''), MARGIN_X + 120, y + 20);
  doc.text(String(invoice.address || ''), MARGIN_X + 120, y + 34);
  doc.text(String(invoice.mobile || ''), MARGIN_X + 120, y + 48);

  y += 70; // Move past customer box

  /* ================= TABLE ================= */
  const headers = ['SR.NO', 'ITEM NAME', 'QTY', 'PRICE', 'DISCOUNT', 'VAT', 'NET AMT'];

  // Adjusted column widths to fit properly
  const SR_NO_WIDTH = 40;
  const AVAILABLE_WIDTH = CONTENT_WIDTH - SR_NO_WIDTH;

  // Proportional widths for remaining columns
  // [0.32, 0.08, 0.13, 0.13, 0.13, 0.21] -> Sum = 1.0
  const colWidthsAbs = [SR_NO_WIDTH, ...[0.32, 0.08, 0.13, 0.13, 0.13, 0.21].map(f => AVAILABLE_WIDTH * f)];

  // Helper to draw table header
  const drawTableHeader = (currentY: number) => {
    doc.setFillColor(0, 0, 0);
    doc.rect(MARGIN_X, currentY, CONTENT_WIDTH, 22, 'F');
    doc.setTextColor(255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');

    let x = MARGIN_X;
    headers.forEach((h, i) => {
      doc.text(h, x + 4, currentY + 15);
      x += colWidthsAbs[i];
    });

    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');
    return currentY + 22;
  };

  y = drawTableHeader(y);

  const TABLE_ROW_HEIGHT = 20;

  // Calculate totals on the fly
  let totalGross = 0;
  let totalVat = 0;

  (invoice.items || []).forEach((item: any, idx: number) => {
    // Check for page break
    if (y + TABLE_ROW_HEIGHT > pageHeight - 50) {
      doc.addPage();
      y = MARGIN_TOP + 20;
      y = drawTableHeader(y);
    }

    // Draw row background
    // doc.rect(MARGIN_X, y, CONTENT_WIDTH, TABLE_ROW_HEIGHT); 

    // Draw vertical lines
    let cx = MARGIN_X;
    for (let i = 0; i < colWidthsAbs.length; i++) {
      cx += colWidthsAbs[i];
    }
    // Outer border for the row
    doc.rect(MARGIN_X, y, CONTENT_WIDTH, TABLE_ROW_HEIGHT);

    // Draw vertical lines explicitly
    cx = MARGIN_X;
    for (let i = 1; i < colWidthsAbs.length; i++) {
      cx += colWidthsAbs[i - 1];
      doc.line(cx, y, cx, y + TABLE_ROW_HEIGHT);
    }


    const price = Number(item.price || 0);
    const qty = Number(item.quantity || 0);
    const net = price * qty;
    totalGross += net;

    const row = [
      String(idx + 1),
      String(item.product?.name || item.name || ''),
      String(item.quantity || ''),
      price.toFixed(3),
      String(item.discount || '-'),
      String(item.vat || '-'), // Per item VAT not currently in schema
      net.toFixed(3),
    ];

    cx = MARGIN_X;
    row.forEach((cell, i) => {
      const align = i === 1 ? 'left' : 'right';
      // Adjust text position
      let textX;
      if (align === 'left') {
        textX = cx + 4; // Left edge + padding
      } else {
        textX = cx + colWidthsAbs[i] - 4; // Right edge - padding
      }

      doc.text(cell, textX, y + 14, { align });
      cx += colWidthsAbs[i];
    });

    y += TABLE_ROW_HEIGHT;
  });

  // Calculate Final Totals
  const vatPercent = invoice.vat_percent || 0;
  totalVat = totalGross * (vatPercent / 100);
  const finalNet = totalGross + totalVat; // Or invoice.total_amount from backend

  /* ================= TOTALS & BANK ================= */
  const TOTALS_HEIGHT = 120;
  const BANK_HEIGHT = 80;

  if (y + TOTALS_HEIGHT + BANK_HEIGHT > pageHeight - FOOTER_RESERVED_HEIGHT) {
    doc.addPage();
    y = MARGIN_TOP + 20;
  }

  y += 10;
  doc.setFontSize(9);
  doc.text('* Items sold will not be taken back or returned.', MARGIN_X, y + 12);

  let totalsX = MARGIN_X + CONTENT_WIDTH - 200;
  let totalsY = y + 18;

  const totals = [
    ['GROSS AMT', totalGross.toFixed(3)],
    ['DISCOUNT', invoice.discount || '-'],
    ['VAT AMT', totalVat > 0 ? totalVat.toFixed(3) : '-'],
    ['Balance C/F', invoice.balance_cf || '-'],
  ];

  totals.forEach(([label, value]) => {
    doc.rect(totalsX, totalsY, 200, 18);
    doc.text(String(label), totalsX + 6, totalsY + 13);
    doc.text(String(value || ''), totalsX + 190, totalsY + 13, { align: 'right' });
    totalsY += 18;
  });

  doc.setFillColor(95, 95, 95);
  doc.setTextColor(255);
  doc.rect(totalsX, totalsY, 200, 20, 'F');
  doc.text('NET AMT BHD', totalsX + 6, totalsY + 14);

  // Use calculated finalNet or fallback to invoice.total_amount
  const displayTotal = (invoice.total_amount !== undefined && invoice.total_amount !== null)
    ? Number(invoice.total_amount).toFixed(3)
    : finalNet.toFixed(3);

  doc.text(displayTotal, totalsX + 190, totalsY + 14, { align: 'right' });
  doc.setTextColor(0);

  // Update Y to be below totals
  y = totalsY + 20;

  /* ================= BANK ================= */
  y += 14;
  const BANK_BOX_W = 380;
  const BANK_BOX_H = 70;
  doc.roundedRect(MARGIN_X, y, BANK_BOX_W, BANK_BOX_H, 8, 8);

  doc.setFontSize(8.2);
  let bankY = y + 16;
  doc.setFont('helvetica', 'bold');
  doc.text('BANK TRANSFER DETAILS', MARGIN_X + 8, bankY);
  bankY += 13;
  doc.text(BANK_DETAILS.name, MARGIN_X + 8, bankY);
  bankY += 13;
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${BANK_DETAILS.bank}`, MARGIN_X + 8, bankY);
  bankY += 13;
  doc.text(`IBAN ${BANK_DETAILS.iban}`, MARGIN_X + 8, bankY);

  y += BANK_BOX_H + 20;

  doc.setFontSize(9.2);
  doc.setFont('helvetica', 'bold');
  doc.text('Thank You for Your Business!', MARGIN_X, y);
  doc.setFont('helvetica', 'normal');

  /* ================= FOOTER (ALWAYS AT BOTTOM OF LAST PAGE) ================= */
  // Image, Signature, Contact Bar

  const barHeight = 32;
  const orangeHeight = 6;
  const contactBarTotal = barHeight + orangeHeight + 10;

  const shopFooterImgUrl = window.location.origin + '/shop_footer_board.jpg';
  let shopFooterH = 0;
  let shopFooterW = pageWidth - 2 * MARGIN_X;

  // Determine Y position for footer elements
  // They are anchored to bottom
  let shopFooterY = 0;
  try {
    const shopFooterImg = await loadImageAsync(shopFooterImgUrl);
    shopFooterH = (shopFooterImg.naturalHeight / shopFooterImg.naturalWidth) * shopFooterW;
    shopFooterY = pageHeight - contactBarTotal - shopFooterH;

    // Check if we need ANOTHER page for the footer image if current Y content overlaps
    // current 'y' is below "Thank you"
    if (y > shopFooterY - 60) { // Buffer for signature
      doc.addPage();
      // new page, reset positions
      shopFooterY = pageHeight - contactBarTotal - shopFooterH;
    }

    doc.addImage(shopFooterImg, 'JPEG', MARGIN_X, shopFooterY, shopFooterW, shopFooterH);
  } catch (e) {
    console.warn('Shop footer image not loaded:', e);
    // Fallback if image fails
    shopFooterY = pageHeight - contactBarTotal - 60;
    if (y > shopFooterY - 60) {
      doc.addPage();
      shopFooterY = pageHeight - contactBarTotal - 60;
    }
  }

  // Signature Row (Above Shop Footer Image)
  let sigRowY = shopFooterY - 40;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Authorized Signatory/STAMP', MARGIN_X, sigRowY);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `Sales Person # ${invoice.sales_person || 'N/A'}   Date   Time`,
    pageWidth / 2,
    sigRowY,
    { align: 'center' }
  );
  doc.setFont('helvetica', 'normal');
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-GB');
  doc.text(dateStr, pageWidth / 2, sigRowY + 15, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.text('Receiver Signature', pageWidth - MARGIN_X, sigRowY, { align: 'right' });
  doc.setFont('helvetica', 'normal');

  // Contact Footer Bar (Very Bottom)
  const barY = pageHeight - barHeight - orangeHeight - 10;
  // Black bar
  doc.setFillColor(30, 30, 30);
  doc.rect(0, barY, pageWidth, barHeight, 'F');
  // Orange line
  doc.setFillColor(217, 108, 0);
  doc.rect(0, barY + barHeight, pageWidth, orangeHeight, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('36341106', 24, barY + 18, { align: 'left' });
  doc.text('harjinders717@gmail.com', pageWidth - 24, barY + 18, { align: 'right' });

  doc.save(`invoice_${invoice.id}.pdf`);
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    getInvoices().then(data => {
      setInvoices(data.filter((inv: any) => inv.type === 'sale'));
    });
  }, []);

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
        startIcon={<PictureAsPdfIcon />}
        disabled={!selected}
        onClick={() => selected && generateInvoicePDF(selected)}
      >
        Download Invoice
      </Button>
    </Box>
  );
}
