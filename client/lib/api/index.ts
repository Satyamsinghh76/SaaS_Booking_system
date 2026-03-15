export { apiClient } from './client';

export { login, logout, signup, getMe, googleLogin } from './auth';
export type { User, LoginPayload, SignupPayload, AuthResponse } from './auth';

export { fetchServices, fetchServiceById } from './services';
export type { Service, ServiceListParams, PaginationMeta } from './services';

export { createBooking, fetchBookings, fetchBookingById, cancelBooking, fetchBookedSlots, fetchRecommendedSlots } from './bookings';
export type {
  Booking,
  BookingStatus,
  PaymentStatus,
  CreateBookingPayload,
  BookingListParams,
} from './bookings';

export { paymentsApi } from './payments';
export type { 
  PaymentResponse, 
  PaymentStatusResponse, 
  BookingPaymentDetails 
} from './payments';

// Default export —
//   • Spreads the Axios instance so `api.get(...)`, `api.post(...)` etc. work
//     (supports legacy code that uses the client directly).
//   • Augments with domain namespaces for new code.
import { login, logout, signup, getMe, googleLogin } from './auth';
import { fetchServices, fetchServiceById } from './services';
import { createBooking, fetchBookings, fetchBookingById, cancelBooking, fetchBookedSlots, fetchRecommendedSlots } from './bookings';
import { paymentsApi } from './payments';
import { apiClient } from './client';

const api = Object.assign(apiClient, {
  auth:     { login, signup, logout, getMe, googleLogin },
  services: { fetchServices, fetchServiceById },
  bookings: { createBooking, fetchBookings, fetchBookingById, cancelBooking, fetchBookedSlots, fetchRecommendedSlots },
  payments: paymentsApi,
});

export default api;
