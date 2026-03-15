import api from './api';
import type { Product } from './productService';

export interface TransactionItem {
    product_id: number;
    quantity: number;
    price: number;
    discount: number;
    vat_percent?: number;
    sku?: string; // Allow user-typed SKU to be sent to backend
    product?: Product;
}

export interface TransactionCreate {
    partner_id: number;
    type: 'purchase' | 'sale' | 'return';
    items: TransactionItem[];
    vat_percent?: number;
    sales_person?: string;
    payment_method?: string;
    amount_paid?: number;
    payment_channel?: string;
    payment_reference?: string;
}

export interface Transaction {
    id: number;
    date: string;
    type: 'purchase' | 'sale' | 'return';
    partner_id: number;
    total_amount: number;
    vat_percent?: number;
    sales_person?: string;
    payment_method?: string;
    amount_paid: number;
    payment_status: 'paid' | 'partial' | 'unpaid';
    items: TransactionItem[];
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
}

export const createTransaction = async (transaction: TransactionCreate) => {
    const response = await api.post<Transaction>('/transactions/', transaction);
    return response.data;
};

export const updateTransaction = async (id: number, data: Partial<TransactionCreate>) => {
    const response = await api.put<Transaction>(`/transactions/${id}`, data);
    return response.data;
};

export const deleteTransaction = async (id: number) => {
    const response = await api.delete(`/transactions/${id}`);
    return response.data;
};

// Implement getTransactions if needed for the list view
export const getTransactions = async (skip: number = 0, limit: number = 100, type?: string, fromDate?: string, toDate?: string, search?: string) => {
    // Send Date filters and pagination over query params
    let url = '/transactions/';
    const params: string[] = [];
    params.push(`skip=${skip}`);
    params.push(`limit=${limit}`);
    if (type) params.push(`type=${encodeURIComponent(type)}`);
    if (fromDate) params.push(`from_date=${encodeURIComponent(fromDate)}`);
    if (toDate) params.push(`to_date=${encodeURIComponent(toDate)}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (params.length) url += '?' + params.join('&');
    const response = await api.get<PaginatedResponse<Transaction>>(url);
    return response.data;
};

export const getInvoicePdf = async (transactionId: number) => {
    const response = await api.get(`/transactions/${transactionId}/invoice/pdf`, {
        responseType: 'blob'
    });
    return response.data;
};

export const getPurchasePdf = async (transactionId: number) => {
    const response = await api.get(`/transactions/${transactionId}/purchase/pdf`, {
        responseType: 'blob'
    });
    return response.data;
};
