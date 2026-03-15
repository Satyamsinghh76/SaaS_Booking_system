'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { format } from 'date-fns';

type Booking = {
  id: string;
  service_name: string;
  start_time: string;
  end_time: string;
  status: string;
  total_price: number;
  customer_first_name?: string;
  customer_email?: string;
};

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800',
  no_show:   'bg-gray-100 text-gray-600',
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    api.get('/bookings').then((res) => {
      setBookings(res.data.data);
    }).catch(() => {
      setError('Failed to load bookings.');
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400">Loading bookings…</p>;
  if (error)   return <p className="text-red-500">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
      </div>

      {bookings.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">📅</p>
          <p>No bookings yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="card flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-800">{b.service_name}</p>
                <p className="text-sm text-gray-400">
                  {format(new Date(b.start_time), 'MMM d, yyyy · h:mm a')}
                </p>
                {b.customer_email && (
                  <p className="text-xs text-gray-400">{b.customer_first_name} · {b.customer_email}</p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold text-gray-700">${Number(b.total_price).toFixed(2)}</span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-600'}`}>
                  {b.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
