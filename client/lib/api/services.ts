import { apiClient } from './client';

// ── Types ─────────────────────────────────────────────────────

export interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;          // in dollars (converted from cents by server)
  is_active: boolean;
  created_at: string;
}

export interface ServiceListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// ── API calls ──────────────────────────────────────────────────

/**
 * GET /api/services
 * Returns a paginated, searchable list of all active services.
 * Public — no authentication required.
 */
export const fetchServices = async (
  params: ServiceListParams = {}
): Promise<{ services: Service[]; meta: PaginationMeta }> => {
  const { data } = await apiClient.get<{
    success: boolean;
    data: Service[];
    meta: PaginationMeta;
  }>('/api/services', { params });
  return { services: data.data, meta: data.meta };
};

/**
 * GET /api/services/:id
 * Returns a single service by UUID.
 * Public — no authentication required.
 */
export const fetchServiceById = async (id: string): Promise<Service> => {
  const { data } = await apiClient.get<{ success: boolean; data: Service }>(
    `/api/services/${id}`
  );
  return data.data;
};
