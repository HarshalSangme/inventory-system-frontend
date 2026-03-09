import api from './api';
import type { Transaction } from './transactionService';

export interface InvoiceEditData {
  invoice_number: string;
  payment_terms: string;
  due_date: string;
  sales_person: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export interface InvoiceCounts {
  total: number;
  unpaid: number;
  partial: number;
  paid: number;
}

export const getInvoices = async (
  skip: number = 0,
  limit: number = 25,
  search?: string,
  paymentStatus?: string  // 'unpaid' | 'partial' | 'paid' | undefined = all
) => {
  const response = await api.get<PaginatedResponse<Transaction>>('/transactions/', {
    params: {
      skip,
      limit,
      type: 'sale',
      ...(search ? { search } : {}),
      ...(paymentStatus ? { payment_status: paymentStatus } : {}),
    }
  });
  return response.data;
};

export const getInvoiceCounts = async (): Promise<InvoiceCounts> => {
  const response = await api.get<InvoiceCounts>('/transactions/counts', {
    params: { type: 'sale' }
  });
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
  const url = window.URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `invoice_${editData.invoice_number.replace(/\//g, '_')}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const resetInvoicePayments = async (transactionId: number): Promise<void> => {
  await api.delete(`/transactions/${transactionId}/payments`);
};