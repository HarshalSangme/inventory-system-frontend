// Add user (admin only)
export const addUser = async (user: { username: string; password: string; role: string }) => {
  const response = await api.post('/users/', user);
  return response.data;
};
import api from './api';

export const getCurrentUser = async () => {
  const response = await api.get('/users/me');
  return response.data;
};

// Get all users (admin only)
export const getAllUsers = async () => {
  const response = await api.get('/users/');
  return response.data;
};
