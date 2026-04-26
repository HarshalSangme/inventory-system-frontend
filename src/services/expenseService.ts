import api from './api';

export interface ExpenseCategory {
    id: number;
    name: string;
    description?: string;
}

export interface Expense {
    id: number;
    date: string;
    voucher_no: string;
    category_id: number;
    description: string;
    payment_mode: string;
    amount: number;
    approved_by?: string;
    remarks?: string;
    category?: ExpenseCategory;
}

export const getExpenseCategories = async () => {
    const response = await api.get('/expense-categories');
    return response.data;
};

export const createExpenseCategory = async (category: any) => {
    const response = await api.post('/expense-categories', category);
    return response.data;
};

export const updateExpenseCategory = async (id: number, category: any) => {
    const response = await api.put(`/expense-categories/${id}`, category);
    return response.data;
};

export const deleteExpenseCategory = async (id: number) => {
    const response = await api.delete(`/expense-categories/${id}`);
    return response.data;
};

export const getExpenses = async (skip = 0, limit = 100, search?: string) => {
    const params: any = { skip, limit };
    if (search) params.search = search;
    const response = await api.get('/expenses', { params });
    return response.data;
};

export const createExpense = async (expense: any) => {
    const response = await api.post('/expenses', expense);
    return response.data;
};

export const updateExpense = async (id: number, expense: any) => {
    const response = await api.put(`/expenses/${id}`, expense);
    return response.data;
};

export const deleteExpense = async (id: number) => {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
};
