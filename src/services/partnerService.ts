import api from './api';

export interface Partner {
    id: number;
    name: string;
    type: 'customer' | 'vendor'; // PartnerType
    email?: string;
    phone?: string;
    address?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
}

export const getPartners = async (skip: number = 0, limit: number = 100, type?: string, search?: string, name?: string, email?: string, phone?: string, address?: string) => {
    const response = await api.get<PaginatedResponse<Partner>>('/partners/', { params: { skip, limit, type, search, name, email, phone, address } });
    return response.data;
};

export const createPartner = async (partner: Omit<Partner, 'id'>) => {
    const response = await api.post<Partner>('/partners/', partner);
    return response.data;
};

export const updatePartner = async (id: number, partner: Omit<Partner, 'id'>) => {
    const response = await api.put<Partner>(`/partners/${id}`, partner);
    return response.data;
};

export const deletePartner = async (id: number) => {
    const response = await api.delete(`/partners/${id}`);
    return response.data;
};
