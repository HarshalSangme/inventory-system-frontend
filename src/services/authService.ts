import api from './api';

export const login = async (username: string, password: string) => {
    // API expects form-data for OAuth2 spec
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await api.post<{ access_token: string }>('/token', formData);
    if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
    }
    return response.data;
};

export const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
};

export const isAuthenticated = () => {
    return !!localStorage.getItem('token');
};

export const getCurrentUsername = (): string => {
    const token = localStorage.getItem('token');
    if (!token) return '';
    
    try {
        // JWT tokens are base64 encoded in 3 parts: header.payload.signature
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        return decoded.sub || ''; // 'sub' is typically the username in JWT
    } catch {
        return '';
    }
};
