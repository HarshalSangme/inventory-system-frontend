import api from './api';
import { type Transaction } from './transactionService';

export interface ChartData {
    name: string;
    value: number;
}

export interface DashboardStats {
    total_customers: number;
    total_products: number;
    total_sales: number;
    low_stock_items: number;
    recent_sales: Transaction[];
    top_products: ChartData[];
    top_customers: ChartData[];
}

export const getDashboardStats = async () => {
    const response = await api.get<DashboardStats>('/dashboard');
    return response.data;
};
