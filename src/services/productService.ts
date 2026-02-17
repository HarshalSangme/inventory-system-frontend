import api from './api';


import type { Category } from './categoryService';

export interface Product {
    id: number;
    name: string;
    sku: string;
    description?: string;
    price: number;
    cost_price: number;
    stock_quantity: number;
    min_stock_level: number;
    category_id?: number | null;
    category?: Category | null;
}

export interface ProductForm {
    name: string;
    sku: string;
    description?: string;
    price: number;
    cost_price: number;
    stock_quantity: number;
    min_stock_level: number;
    category_id?: number | null;
}


export const getProducts = async () => {
    const response = await api.get<Product[]>('/products/');
    return response.data;
};


export const createProduct = async (product: ProductForm) => {
    const response = await api.post<Product>('/products/', product);
    return response.data;
};


export const updateProduct = async (id: number, product: ProductForm) => {
    const response = await api.put<Product>(`/products/${id}`, product);
    return response.data;
};

export const deleteProduct = async (id: number) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
};

export const bulkDeleteProducts = async (ids: number[]) => {
    const response = await api.post('/products/bulk-delete', ids);
    return response.data;
};

export const importProducts = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post<{ message: string; imported: number }>('/import-products/', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};
