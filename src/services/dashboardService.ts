import api from './api';
import { type Transaction } from './transactionService';

export interface ChartData {
    name: string;
    value: number;
}

export interface TopStockProduct {
    name: string;
    stock_quantity: number;
    min_stock_level: number;
}

export interface DashboardStats {
    total_customers: number;
    total_products: number;
    total_sales: number;
    low_stock_items: number;
    total_stock_value: number;
    total_retail_value: number;
    top_stock_products: TopStockProduct[];
    recent_sales: Transaction[];
    top_products: ChartData[];
    top_customers: ChartData[];
}

export const getDashboardStats = async () => {
    const response = await api.get<DashboardStats>('/dashboard');
    return response.data;
};
