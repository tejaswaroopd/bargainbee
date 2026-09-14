import api from './client';
import { Order } from '../types';

export const fetchMyOrders = async () => {
  const { data } = await api.get('/orders/my');
  return data.orders as Order[];
};

export const fetchOrder = async (id: string) => {
  const { data } = await api.get(`/orders/${id}`);
  return data;
};

export const createOrder = async (listingId: string) => {
  const { data } = await api.post('/orders', { listingId });
  return data;
};

export const verifyPayment = async (orderId: string, payload: {
  razorpayPaymentId: string;
  razorpaySignature: string;
}) => {
  const { data } = await api.post(`/orders/${orderId}/verify-payment`, payload);
  return data;
};

export const confirmOrder = async (orderId: string) => {
  const { data } = await api.post(`/orders/${orderId}/confirm`);
  return data;
};

export const raiseDispute = async (orderId: string, payload: { reason: string; evidence?: string }) => {
  const { data } = await api.post(`/orders/${orderId}/dispute`, payload);
  return data;
};
