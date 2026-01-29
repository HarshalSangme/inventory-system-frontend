import api from './api';

export interface Partner {
    id: number;
    name: string;
    type: 'customer' | 'vendor'; // PartnerType
    email?: string;
    phone?: string;
    address?: string;
}

export const getPartners = async () => {
    const response = await api.get<Partner[]>('/partners/');
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
