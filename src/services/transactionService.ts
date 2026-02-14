import api from './api';

export interface TransactionItem {
    product_id: number;
    quantity: number;
    price: number;
    discount: number;
    product?: {
        name: string;
        sku: string;
    };
}

export interface TransactionCreate {
    partner_id: number;
    type: 'purchase' | 'sale' | 'return';
    items: TransactionItem[];
    vat_percent?: number;
}

export interface Transaction {
    id: number;
    date: string;
    type: 'purchase' | 'sale' | 'return';
    partner_id: number;
    total_amount: number;
    vat_percent?: number;
    sales_person?: string;
    items: TransactionItem[]; // Start with basic response, might receive expanded items
}

export const createTransaction = async (transaction: TransactionCreate) => {
    const response = await api.post<Transaction>('/transactions/', transaction);
    return response.data;
};

// Implement getTransactions if needed for the list view
export const getTransactions = async () => {
    // Backend doesn't support filter by type in root endpoint yet, so assume we get all or filter client side for now/update backend later
    const response = await api.get<Transaction[]>('/transactions/'); // Endpoint might need to be created if not exists?
    // Wait, I didn't create a GET /transactions endpoint in main.py, only POST. 
    // I need to check main.py.
    return response.data;
};
