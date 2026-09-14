import api from './client';

export const login = async (email: string, password: string) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

export const register = async (payload: {
  email: string;
  name: string;
  password: string;
  role?: string;
}) => {
  const { data } = await api.post('/auth/register', payload);
  return data;
};

export const getMe = async () => {
  const { data } = await api.get('/auth/me');
  return data.user;
};

export const updateProfile = async (payload: { name?: string; avatar?: string; role?: string }) => {
  const { data } = await api.put('/auth/me', payload);
  return data.user;
};
