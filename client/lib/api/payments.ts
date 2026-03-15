import api from './index';

export interface PaymentResponse {
  success: boolean;
  message?: string;
  data?: {
    bookingId: string;
    status: string;
    payment_status: string;
    paid_at: string;
    amount: number;
    currency: string;
    demo_mode: boolean;
  };
}

export interface PaymentStatusResponse {
  success: boolean;
  message?: string;
  data?: {
    bookingId: string;
    paymentStatus: string;
    status: string;
    amount: number;
    currency: string;
    demo_mode: boolean;
  };
}

export interface BookingPaymentDetails {
  success: boolean;
  message?: string;
  data?: {
    booking_id: string;
    payment_status: string;
    stripe_session_id?: string;
    stripe_payment_intent?: string;
    amount?: number;
    currency?: string;
    paid_at?: string;
    receipt_url?: string;
  };
}

export const paymentsApi = {
  // Simulate payment for demo mode
  simulatePayment: async (bookingId: string): Promise<PaymentResponse> => {
    const response = await api.post('/payments/simulate', { bookingId });
    return response.data;
  },

  // Get payment status for a booking
  getPaymentStatus: async (bookingId: string): Promise<PaymentStatusResponse> => {
    const response = await api.get(`/payments/status/${bookingId}`);
    return response.data;
  },

  // Get booking payment details
  getBookingPaymentDetails: async (bookingId: string): Promise<BookingPaymentDetails> => {
    const response = await api.get(`/payments/booking/${bookingId}`);
    return response.data;
  },

  // Create Stripe checkout session (for future use)
  createCheckoutSession: async (bookingId: string): Promise<any> => {
    const response = await api.post('/payments/checkout', { booking_id: bookingId });
    return response.data;
  },

  // Get Stripe session status
  getSessionStatus: async (sessionId: string): Promise<any> => {
    const response = await api.get(`/payments/session/${sessionId}`);
    return response.data;
  },
};

export default paymentsApi;
