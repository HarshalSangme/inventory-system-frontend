import api from './api';

export interface Category {
    id: number;
    name: string;
    description?: string;
    margin_percent?: number;
}

export const getCategories = async () => {
    const response = await api.get<Category[]>('/categories/');
    return response.data;
};

export const createCategory = async (category: Omit<Category, 'id'>) => {
    const response = await api.post<Category>('/categories/', category);
    return response.data;
};

export const updateCategory = async (id: number, category: Omit<Category, 'id'>) => {
    const response = await api.put<Category>(`/categories/${id}`, category);
    return response.data;
};

export const deleteCategory = async (id: number) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
};
