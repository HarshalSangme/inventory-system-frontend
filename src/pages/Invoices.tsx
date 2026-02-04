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

  const logoUrl = window.location.origin + '/jot.png';
  const letterUrl = window.location.origin + '/Jot_Letter_Head.jpg';
  // const stampUrl = window.location.origin + '/jot_stamp.png';

  // Load logo and letterhead only (skip stamp for now)
  let logoImg, letterImg;
  try {
    [logoImg, letterImg] = await Promise.all([
      loadImageAsync(logoUrl),
      loadImageAsync(letterUrl),
      // stamp image intentionally skipped
    ]);
  } catch (e) {
    alert('Failed to load images for PDF.');
    return;
  }

  // Reduce margins to utilize more of the page
  const MARGIN_X = 20;
  const CONTENT_WIDTH = doc.internal.pageSize.getWidth() - 2 * MARGIN_X;

  const formatDate = (d: any) => {
    if (!d) return '';
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2, '0')}-${String(
      date.getMonth() + 1
    ).padStart(2, '0')}-${date.getFullYear()}`;
  };

  /* ================= HEADER (PIXEL PERFECT) ================= */
  const HEADER_Y = 28;
  const BASELINE_Y = HEADER_Y + 6; // common visual baseline

  // ---- LOGO (keep original ratio) ----
  const LOGO_W = 78; // slightly smaller
  const logoRatio = logoImg.naturalHeight / logoImg.naturalWidth;
  const LOGO_H = LOGO_W * logoRatio;

  doc.addImage(
    logoImg,
    'PNG',
    MARGIN_X,
    BASELINE_Y,
    LOGO_W,
    LOGO_H
  );

  // ---- LETTERHEAD (Arabic + English) ----
  const LETTER_W = 220;
  const letterRatio = letterImg.naturalHeight / letterImg.naturalWidth;
  const LETTER_H = LETTER_W * letterRatio;

  // keep same baseline as logo
  const LETTER_X = MARGIN_X + LOGO_W + 12;

  doc.addImage(
    letterImg,
    'JPEG',
    LETTER_X,
    BASELINE_Y + 2,
    LETTER_W,
    LETTER_H
  );

  // ---- META BOX (top-right, aligned) ----
  const metaBoxW = 175;
  const metaBoxH = 68;
  const metaX = pageWidth - metaBoxW - MARGIN_X;

  doc.setFontSize(9);
  doc.rect(metaX, HEADER_Y, metaBoxW, metaBoxH);

  doc.text('Invoice Date:', metaX + 6, HEADER_Y + 16);
  doc.text(formatDate(invoice.date), metaX + 95, HEADER_Y + 16);

  doc.text('Invoice No:', metaX + 6, HEADER_Y + 32);
  doc.text(
    String(invoice.invoice_no || invoice.id || ''),
    metaX + 95,
    HEADER_Y + 32
  );

  doc.text('Payment Terms:', metaX + 6, HEADER_Y + 48);
  doc.text('CREDIT', metaX + 95, HEADER_Y + 48);

  doc.text('Due Date:', metaX + 6, HEADER_Y + 64);
  doc.text(String(invoice.due_date || ''), metaX + 95, HEADER_Y + 64);

  // ---- INVOICE BAR (MOVED DOWN – NO OVERLAP) ----
  const BAR_W = 160;
  const BAR_H = 28;
  const BAR_X = (pageWidth - BAR_W) / 2;

  // 🔑 push bar BELOW logo + letterhead
  const BAR_Y = HEADER_Y + Math.max(LOGO_H, LETTER_H) + 22;

  doc.setFillColor(95, 95, 95);
  doc.rect(BAR_X, BAR_Y, BAR_W, BAR_H, 'F');
  doc.setTextColor(255);
  doc.setFontSize(14);
  doc.text('INVOICE', pageWidth / 2, BAR_Y + 19, {
    align: 'center',
  });
  doc.setTextColor(0);

  /* ================= CUSTOMER BOX ================= */
  let y = BAR_Y + 35;
  doc.setFontSize(8.2); // smaller font for customer box

  // Compact customer box (smaller width, more compact)
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

  /* ================= TABLE ================= */
  y += 70;

  const headers = [
    'SR.NO',
    'ITEM NAME',
    'QTY',
    'PRICE',
    'DISCOUNT',
    'VAT',
    'NET AMT',
  ];
  // Proportional column widths to fill CONTENT_WIDTH
  // [40, 0.32, 0.08, 0.13, 0.13, 0.13, 0.21] as fractions of CONTENT_WIDTH
  const colWidthsAbs = [40, ...[0.32, 0.08, 0.13, 0.13, 0.13, 0.21].map(f => CONTENT_WIDTH * f)];

  doc.setFillColor(0, 0, 0);
  doc.rect(MARGIN_X, y, CONTENT_WIDTH, 22, 'F');
  doc.setTextColor(255);
  doc.setFontSize(9);

  let x = MARGIN_X;
  headers.forEach((h, i) => {
    doc.text(h, x + 4, y + 15);
    x += colWidthsAbs[i];
  });

  doc.setTextColor(0);
  y += 22;

  (invoice.items || []).forEach((item: any, idx: number) => {
    // Draw row background
    doc.rect(MARGIN_X, y, CONTENT_WIDTH, 20);

    // Draw vertical lines for each column
    let cx = MARGIN_X;
    for (let i = 0; i < colWidthsAbs.length; i++) {
      if (i > 0) {
        doc.line(cx, y, cx, y + 20);
      }
      cx += colWidthsAbs[i];
    }

    const net =
      Number(item.quantity || 0) * Number(item.price || 0);

    const row = [
      String(idx + 1),
      String(item.name || ''),
      String(item.quantity || ''),
      Number(item.price || 0).toFixed(3),
      String(item.discount || '-'),
      String(item.vat || '-'),
      net.toFixed(3),
    ];

    cx = MARGIN_X;
    row.forEach((cell, i) => {
      const align = i === 1 ? 'left' : 'right';
      doc.text(cell, cx + colWidthsAbs[i] - 4, y + 14, {
        align,
      });
      cx += colWidthsAbs[i];
    });

    y += 20;
  });

  /* ================= TOTALS ================= */
  y += 10;
  doc.setFontSize(9);
  doc.text(
    '* Items sold will not be taken back or returned.',
    MARGIN_X,
    y + 12
  );

  let totalsX = MARGIN_X + CONTENT_WIDTH - 200;
  let totalsY = y + 18;

  const totals = [
    ['GROSS AMT', invoice.gross_amount],
    ['DISCOUNT', invoice.discount || '-'],
    ['VAT AMT', invoice.vat_amount || '-'],
    ['Balance C/F', invoice.balance_cf || '-'],
  ];

  totals.forEach(([label, value]) => {
    doc.rect(totalsX, totalsY, 200, 18);
    doc.text(String(label), totalsX + 6, totalsY + 13);
    doc.text(String(value || ''), totalsX + 190, totalsY + 13, {
      align: 'right',
    });
    totalsY += 18;
  });

  doc.setFillColor(95, 95, 95);
  doc.setTextColor(255);
  doc.rect(totalsX, totalsY, 200, 20, 'F');
  doc.text('NET AMT BHD', totalsX + 6, totalsY + 14);
  doc.text(
    String(invoice.net_amount || ''),
    totalsX + 190,
    totalsY + 14,
    { align: 'right' }
  );
  doc.setTextColor(0);

  /* ================= BANK ================= */
  totalsY += 34;
  const BANK_BOX_W = 380;
  const BANK_BOX_H = 70;
  doc.roundedRect(MARGIN_X, totalsY, BANK_BOX_W, BANK_BOX_H, 8, 8);
  doc.setFontSize(8.2); // smaller font for bank box
  let bankY = totalsY + 16;
  doc.setFont('helvetica', 'bold');
  doc.text('BANK TRANSFER DETAILS', MARGIN_X + 8, bankY);
  bankY += 13;
  doc.text(BANK_DETAILS.name, MARGIN_X + 8, bankY);
  bankY += 13;
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${BANK_DETAILS.bank}`, MARGIN_X + 8, bankY);
  bankY += 13;
  doc.text(`IBAN ${BANK_DETAILS.iban}`, MARGIN_X + 8, bankY);

  /* ================= FOOTER ================= */
  totalsY += BANK_BOX_H + 30; // add vertical space after bank box
  doc.setFontSize(9.2); // smaller font for thank you
  doc.setFont('helvetica', 'bold');
  doc.text('Thank You for Your Business!', MARGIN_X, totalsY);
  doc.setFont('helvetica', 'normal');
  // (Signature/date row will be drawn only once below, above shop footer image)

  // ======= Move signature row and shop footer image lower, then draw contact bar at very bottom =======
  // Calculate available space for signature row and shop footer
  const pageHeight = doc.internal.pageSize.getHeight();
  const barHeight = 32;
  const orangeHeight = 6;
  const contactBarTotal = barHeight + orangeHeight + 10; // 10pt margin
  const shopFooterImgUrl = window.location.origin + '/shop_footer_board.jpg';
  let shopFooterH = 0;
  let shopFooterW = pageWidth - 2 * MARGIN_X;
  let shopFooterY = 0;
  try {
    const shopFooterImg = await loadImageAsync(shopFooterImgUrl);
    shopFooterH = (shopFooterImg.naturalHeight / shopFooterImg.naturalWidth) * shopFooterW;
    // Place shop footer image just above contact bar
    shopFooterY = pageHeight - contactBarTotal - shopFooterH;
    doc.addImage(shopFooterImg, 'JPEG', MARGIN_X, shopFooterY, shopFooterW, shopFooterH);
  } catch (e) {
    shopFooterY = pageHeight - contactBarTotal - 60; // fallback height
    shopFooterH = 60;
    console.warn('Shop footer image not loaded:', e);
  }

  // Move signature row above shop footer image (draw only once)
  let sigRowY = shopFooterY - 80;
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

  // ======= CONTACT FOOTER BAR (drawn, not image) at very bottom =======
  const barY = pageHeight - barHeight - orangeHeight - 10;
  // Black bar
  doc.setFillColor(30, 30, 30);
  doc.rect(0, barY, pageWidth, barHeight, 'F');
  // Orange line
  doc.setFillColor(217, 108, 0);
  doc.rect(0, barY + barHeight, pageWidth, orangeHeight, 'F');

  // Phone (left) and Email (right) with emoji, space in between
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  // Phone left
  const phoneText = '36341106';
  doc.text(phoneText, 24, barY + 18, { align: 'left' });
  // Email right
  const emailText = 'harjinders717@gmail.com';
  doc.text(emailText, pageWidth - 24, barY + 18, { align: 'right' });

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
