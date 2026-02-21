import api from './api';

// Get all users (admin only)
export const getAllUsers = async () => {
  const response = await api.get('/users/');
  return response.data;
};

// Get current user
export const getCurrentUser = async () => {
  const response = await api.get('/users/me');
  return response.data;
};

// Add user (admin only)
export const addUser = async (user: { username: string; password: string; role: string }) => {
  const response = await api.post('/users/', user);
  return response.data;
};

// Update user (admin only)
export const updateUser = async (userId: number, user: { username?: string; email?: string; password?: string; role?: string }) => {
  const response = await api.put(`/users/${userId}`, user);
  return response.data;
};

// Send verification email
export const sendVerificationEmail = async (userId: number) => {
  const response = await api.post(`/users/${userId}/send-verification`);
  return response.data;
};

// Verify email
export const verifyEmail = async (token: string) => {
  const response = await api.get(`/verify-email/${token}`);
  return response.data;
};
