'use client';

import { Suspense, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, CheckCircle } from 'lucide-react';
import { paymentsApi, fetchBookingById } from '@/lib/api';
import type { Booking } from '@/lib/api/bookings';

function formatTime12h(time24: string) {
  const [h, m] = time24.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${hour12}:${m.toString().padStart(2, '0')} ${suffix}`
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <PaymentPageContent />
    </Suspense>
  );
}

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');


  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  useEffect(() => {
    if (!bookingId) {
      setError('No booking ID provided');
      setLoading(false);
      return;
    }

    fetchBookingById(bookingId)
      .then((b) => {
        if (b.payment_status === 'paid') {
          setError('This booking has already been paid.');
        }
        setBooking(b);
      })
      .catch((err: any) => setError(err.response?.data?.message || 'Failed to load booking details'))
      .finally(() => setLoading(false));
  }, [bookingId]);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/[^0-9]/g, '').slice(0, 4);
    if (v.length === 0) return '';
    // Clamp month: first digit > 1 → prefix with 0
    let month = v.slice(0, 2);
    if (v.length === 1 && parseInt(v) > 1) {
      month = '0' + v;
    }
    if (v.length >= 2) {
      const m = parseInt(month);
      if (m > 12) month = '12';
      if (m === 0) month = '01';
    }
    if (v.length <= 2) return month;
    return month + '/' + v.slice(2, 4);
  };

  const formatCvc = (value: string) => {
    return value.replace(/[^0-9]/g, '').slice(0, 3);
  };

  const validateExpiry = (): string | null => {
    if (!expiry || expiry.length < 4) return 'Enter a valid expiry date (MM/YY).';
    const parts = expiry.replace('/', '').match(/^(\d{2})(\d{2})$/);
    if (!parts) return 'Enter a valid expiry date (MM/YY).';
    const month = parseInt(parts[1]);
    const year = parseInt(parts[2]) + 2000;
    if (month < 1 || month > 12) return 'Month must be between 01 and 12.';
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return 'Card has expired. Please use a valid card.';
    }
    return null;
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!booking) return;

    // Validate expiry
    const expiryError = validateExpiry();
    if (expiryError) {
      setError(expiryError);
      return;
    }

    // Validate CVC
    if (cvc.length !== 3) {
      setError('CVC must be exactly 3 digits.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Simulate payment processing
      const response = await paymentsApi.simulatePayment(booking.id);

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard/bookings');
        }, 2000);
      } else {
        setError(response.message || 'Payment failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading booking details...</p>
        </motion.div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">Redirecting to your bookings...</p>
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        {/* Demo Mode Banner */}
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <AlertDescription className="text-blue-800">
            <strong>Demo Payment Mode</strong> – No real transaction will be processed. 
            Use any card details to simulate payment.
          </AlertDescription>
        </Alert>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Booking Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Booking Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {booking && (
                <>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Service</Label>
                    <p className="font-semibold">{booking.service_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Date</Label>
                    <p className="font-semibold">{new Date(booking.date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Time</Label>
                    <p className="font-semibold">{formatTime12h(booking.start_time)} – {formatTime12h(booking.end_time)}</p>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total Amount</span>
                      <span className="text-2xl font-bold text-blue-600">
                        ${booking.price_snapshot}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePayment} className="space-y-4">
                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    type="text"
                    placeholder="4242 4242 4242 4242"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    maxLength={19}
                    required
                    disabled={processing}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Demo: Use 4242 4242 4242 4242
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      type="text"
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      maxLength={5}
                      required
                      disabled={processing}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Any future date
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="cvc">CVC</Label>
                    <Input
                      id="cvc"
                      type="text"
                      placeholder="123"
                      value={cvc}
                      onChange={(e) => setCvc(formatCvc(e.target.value))}
                      maxLength={3}
                      required
                      disabled={processing}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Demo: Use 123
                    </p>
                  </div>
                </div>

                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={processing || !cardNumber || expiry.length < 5 || cvc.length !== 3 || booking?.payment_status === 'paid'}
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    `Pay $${booking?.price_snapshot || 0}`
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
