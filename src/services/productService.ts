import api from './api';

export interface Product {
    id: number;
    name: string;
    sku: string;
    description?: string;
    price: number;
    cost_price: number;
    stock_quantity: number;
    min_stock_level: number;
}

export const getProducts = async () => {
    const response = await api.get<Product[]>('/products/');
    return response.data;
};

export const createProduct = async (product: Omit<Product, 'id' | 'stock_quantity'>) => {
    const response = await api.post<Product>('/products/', product);
    return response.data;
};

export const updateProduct = async (id: number, product: Omit<Product, 'id' | 'stock_quantity'>) => {
    const response = await api.put<Product>(`/products/${id}`, product);
    return response.data;
};

export const deleteProduct = async (id: number) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
};
