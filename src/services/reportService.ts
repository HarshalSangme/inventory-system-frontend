import api from './api';

export const exportReport = async (reportType: string, format: 'excel' | 'csv', fromDate?: string, toDate?: string, search?: string) => {
    const params: any = { format };
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    if (search) params.search = search;

    const response = await api.get(`/reports/${reportType}/export`, {
        params,
        responseType: 'blob'
    });
    return response.data;
};
