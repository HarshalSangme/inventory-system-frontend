import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface Payment {
    id: number;
    transaction_id: number;
    partner_id: number;
    amount: number;
    date: string;
    payment_method: string;
    channel: string;
    reference_id?: string;
    notes?: string;
}

export interface PaymentCreate {
    transaction_id: number;
    partner_id: number;
    amount: number;
    payment_method?: string;
    channel?: string;
    reference_id?: string;
    notes?: string;
}

export interface LedgerEntry {
    id: number;
    date: string;
    type: 'debit' | 'credit';
    amount: number;
    balance: number;
    description: string;
    transaction_id?: number;
    payment_id?: number;
}

export interface AccountsSummary {
    total_receivables: number;
    total_payables: number;
}

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

export const recordPayment = async (payment: PaymentCreate): Promise<Payment> => {
    const response = await axios.post(`${API_URL}/payments/`, payment, { headers: getAuthHeader() });
    return response.data;
};

export const getAccountsSummary = async (): Promise<AccountsSummary> => {
    const response = await axios.get(`${API_URL}/accounts/summary`, { headers: getAuthHeader() });
    return response.data;
};

export const getPartnerStatement = async (partnerId: number): Promise<LedgerEntry[]> => {
    const response = await axios.get(`${API_URL}/partners/${partnerId}/statement`, { headers: getAuthHeader() });
    return response.data;
};
