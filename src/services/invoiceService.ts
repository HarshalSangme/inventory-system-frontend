import api from './api';
import type { Transaction } from './transactionService';

export interface InvoiceEditData {
  invoice_number: string;
  payment_terms: string;
  due_date: string;
  sales_person: string;
}

export const getInvoices = async () => {
  // For now, reuse transactions as invoices
  const response = await api.get<Transaction[]>('/transactions/');
  return response.data;
};

export const generateInvoicePDF = async (transactionId: number, editData: InvoiceEditData): Promise<Blob> => {
  const response = await api.post(`/transactions/${transactionId}/invoice`, editData, {
    responseType: 'blob',
  });
  return response.data;
};

export const downloadInvoicePDF = async (transactionId: number, editData: InvoiceEditData): Promise<void> => {
  const pdfBlob = await generateInvoicePDF(transactionId, editData);
  
  // Create download link
  const url = window.URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `invoice_${editData.invoice_number.replace(/\//g, '_')}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};