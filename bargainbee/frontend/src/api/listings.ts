import api from './client';
import { VoucherListing } from '../types';

export interface ListingsFilter {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minDiscount?: number;
  sort?: string;
  page?: number;
  limit?: number;
  featured?: boolean;
  search?: string;
}

export const fetchListings = async (filters: ListingsFilter = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v !== undefined) params.set(k, String(v)); });
  const { data } = await api.get(`/listings?${params}`);
  return data;
};

export const fetchListing = async (id: string) => {
  const { data } = await api.get(`/listings/${id}`);
  return data.listing as VoucherListing;
};

export const fetchMyListings = async () => {
  const { data } = await api.get('/listings/my/listings');
  return data.listings as VoucherListing[];
};

export const createListing = async (formData: FormData) => {
  const { data } = await api.post('/listings', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.listing as VoucherListing;
};

export const deleteListing = async (id: string) => {
  const { data } = await api.delete(`/listings/${id}`);
  return data;
};
