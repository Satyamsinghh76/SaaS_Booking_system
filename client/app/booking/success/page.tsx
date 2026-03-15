'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar, CreditCard, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

interface BookingDetails {
  id: string;
  service_name: string;
  date: string;
  start_time: string;
  end_time: string;
  amount: number;
  currency: string;
  status: string;
  payment_status: string;
}

export default function BookingSuccessPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the most recent booking for this user
    fetchRecentBooking();
  }, []);

  const fetchRecentBooking = async () => {
    try {
      // Since we don't have the booking ID, we'll get user's recent bookings
      const response = await api.get('/bookings/my-bookings');
      if (response.data.success) {
        // Find the most recently confirmed booking
        const recentBooking = response.data.data
          .filter((b: BookingDetails) => b.payment_status === 'paid')
          .sort((a: BookingDetails, b: BookingDetails) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          )[0];
        
        setBooking(recentBooking);
      }
    } catch (err) {
      console.error('Failed to fetch booking details:', err);
    } finally {
      setLoading(false);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking details...</p>
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
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center mb-8"
        >
          <CheckCircle className="h-20 w-20 text-green-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-xl text-gray-600">
            Your booking has been confirmed
          </p>
        </motion.div>

        {/* Booking Details */}
        {booking && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Booking Confirmed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Service</p>
                      <p className="font-semibold text-lg">{booking.service_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date</p>
                      <p className="font-semibold">
                        {new Date(booking.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Time</p>
                      <p className="font-semibold">
                        {booking.start_time} - {booking.end_time}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Booking ID</p>
                      <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                        {booking.id}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {booking.status}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {booking.payment_status}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Amount Paid</p>
                      <p className="font-bold text-2xl text-green-600">
                        ${booking.amount} {booking.currency?.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Payment Confirmation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">
                    Payment processed successfully
                  </p>
                  <p className="text-sm text-green-600">
                    A confirmation email has been sent to your registered email address.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Button
            onClick={() => router.push('/dashboard')}
            className="flex-1"
            variant="default"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Dashboard
          </Button>
          
          <Button
            onClick={() => router.push('/services')}
            variant="outline"
            className="flex-1"
          >
            Book Another Service
          </Button>
        </motion.div>

        {/* Demo Mode Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-gray-500">
            This was a demo payment. No real transaction was processed.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
