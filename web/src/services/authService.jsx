import axiosInstance from './axiosInstance';

export const login = async (username, password) => {
  try {
    const response = await axiosInstance.post('/auth/login', { username, password });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Authentication failed';
    throw new Error(message);
  }
};

export const register = async (userData) => {
  try {
    const response = await axiosInstance.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Registration failed';
    throw new Error(message);
  }
};

export const forgotPassword = async (email) => {
  try {
    const response = await axiosInstance.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to process request';
    throw new Error(message);
  }
};

export const resetPassword = async (token, newPassword) => {
  try {
    const response = await axiosInstance.post('/auth/reset-password', { token, newPassword });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Password reset failed';
    throw new Error(message);
  }
};
