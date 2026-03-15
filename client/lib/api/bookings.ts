import { apiClient } from './client';
import type { PaginationMeta } from './services';

// ── Types ─────────────────────────────────────────────────────

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'no_show';

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export interface Booking {
  id: string;
  user_id: string;
  service_id: string;
  service_name: string;
  date: string;             // YYYY-MM-DD
  start_time: string;       // HH:MM
  end_time: string;         // HH:MM
  status: BookingStatus;
  payment_status: PaymentStatus;
  price_snapshot: number;   // price at time of booking
  notes: string | null;
  created_at: string;
}

export interface CreateBookingPayload {
  service_id: string;
  date: string;             // YYYY-MM-DD
  start_time: string;       // HH:MM
  notes?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
}

export interface BookingListParams {
  page?: number;
  limit?: number;
  status?: BookingStatus;
  payment_status?: PaymentStatus;
  date?: string;
  from?: string;
  to?: string;
}

// ── API calls ──────────────────────────────────────────────────

/**
 * POST /api/bookings
 * Creates a new booking for the authenticated user.
 * The end_time is computed server-side from the service's duration.
 */
export const createBooking = async (
  payload: CreateBookingPayload
): Promise<Booking> => {
  const { data } = await apiClient.post<{ success: boolean; data: Booking }>(
    '/api/bookings',
    payload
  );
  return data.data;
};

/**
 * GET /api/bookings
 * Lists the current user's bookings.
 * Admins see all bookings and can filter by user_id.
 */
export const fetchBookings = async (
  params: BookingListParams = {}
): Promise<{ bookings: Booking[]; meta: PaginationMeta }> => {
  const { data } = await apiClient.get<{
    success: boolean;
    data: Booking[];
    meta: PaginationMeta;
  }>('/api/bookings', { params });
  return { bookings: data.data, meta: data.meta };
};

/**
 * GET /api/bookings/:id
 * Returns a single booking. Users can only access their own.
 */
export const fetchBookingById = async (id: string): Promise<Booking> => {
  const { data } = await apiClient.get<{ success: boolean; data: Booking }>(
    `/api/bookings/${id}`
  );
  return data.data;
};

/**
 * DELETE /api/bookings/:id
 * Cancels a booking. Users can only cancel their own pending/confirmed bookings.
 */
export const cancelBooking = async (id: string): Promise<Booking> => {
  const { data } = await apiClient.delete<{ success: boolean; data: Booking }>(
    `/api/bookings/${id}`
  );
  return data.data;
};

/**
 * GET /api/bookings/booked-slots?service_id=...&date=YYYY-MM-DD
 * Returns start_time values already booked for a service on a given date.
 */
export const fetchBookedSlots = async (
  serviceId: string,
  date: string
): Promise<string[]> => {
  const { data } = await apiClient.get<{ success: boolean; data: string[] }>(
    '/api/bookings/booked-slots',
    { params: { service_id: serviceId, date } }
  );
  return data.data;
};

export interface Recommendation {
  rank: number;
  date: string;
  start_time: string;
  end_time: string;
  score: number;
  label: string;
}

export const fetchRecommendedSlots = async (
  serviceId: string
): Promise<Recommendation[]> => {
  const { data } = await apiClient.get<{
    success: boolean;
    data: { recommendations: Recommendation[] };
  }>('/api/bookings/recommended-slots', {
    params: { service_id: serviceId, top_n: 5 },
  });
  return data.data.recommendations;
};
