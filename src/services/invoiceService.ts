import api from './api';
import type { Transaction } from './transactionService';

export const getInvoices = async () => {
  // For now, reuse transactions as invoices
  const response = await api.get<Transaction[]>('/transactions/');
  return response.data;
};
