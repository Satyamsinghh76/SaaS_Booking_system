import api, { apiClient } from '@/lib/api';
import type {
  Booking,
  LoginPayload,
  Service,
  SignupPayload,
  User,
} from '@/lib/api';

export { apiClient };

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export interface CreateBookingPayload {
  service_id: string;
  date: string;
  time: string;
  notes?: string;
}

export const login = async (payload: LoginPayload): Promise<ApiEnvelope<User>> => {
  const user = await api.auth.login(payload);
  return { success: true, data: user };
};

export const signup = async (payload: SignupPayload): Promise<ApiEnvelope<User>> => {
  const user = await api.auth.signup(payload);
  return { success: true, data: user };
};

export const getServices = async (): Promise<ApiEnvelope<Service[]>> => {
  const { services } = await api.services.fetchServices();
  return { success: true, data: services };
};

export const createBooking = async (
  payload: CreateBookingPayload,
  _accessToken?: string
): Promise<ApiEnvelope<Booking>> => {
  const booking = await api.bookings.createBooking({
    service_id: payload.service_id,
    date: payload.date,
    start_time: payload.time,
    notes: payload.notes,
  });
  return { success: true, data: booking };
};

export const getBookings = async (_accessToken?: string): Promise<ApiEnvelope<Booking[]>> => {
  const { bookings } = await api.bookings.fetchBookings();
  return { success: true, data: bookings };
};
