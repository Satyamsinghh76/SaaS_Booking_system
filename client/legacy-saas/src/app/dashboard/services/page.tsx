'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

type Service = {
  id: string;
  name: string;
  description: string;
  duration_mins: number;
  price: number;
  currency: string;
  is_active: boolean;
  provider_first_name: string;
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading]   = useState(true);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    api.get('/services').then((res) => setServices(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400">Loading services…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Services</h1>
        {(user?.role === 'provider' || user?.role === 'admin') && (
          <button className="btn-primary">+ Add service</button>
        )}
      </div>

      {services.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">🛎️</p>
          <p>No services available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {services.map((s) => (
            <div key={s.id} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-800">{s.name}</h3>
                <span className="text-indigo-600 font-bold">${Number(s.price).toFixed(2)}</span>
              </div>
              <p className="text-sm text-gray-400 mb-3 line-clamp-2">{s.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>⏱ {s.duration_mins} min</span>
                <span>By {s.provider_first_name}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
