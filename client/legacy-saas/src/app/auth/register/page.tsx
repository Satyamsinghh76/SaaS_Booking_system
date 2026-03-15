'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', role: 'customer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form as any);
      router.push('/dashboard/bookings');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [key]: e.target.value }),
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="card w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-indigo-600">BookIt</h1>
          <p className="text-gray-500 mt-1">Create your account</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">First name</label>
              <input type="text" className="input" {...field('first_name')} required />
            </div>
            <div>
              <label className="label">Last name</label>
              <input type="text" className="input" {...field('last_name')} required />
            </div>
          </div>
          <div>
            <label className="label">Email address</label>
            <input type="email" className="input" {...field('email')} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" {...field('password')} minLength={8} required />
          </div>
          <div>
            <label className="label">I am a…</label>
            <select className="input" {...field('role')}>
              <option value="customer">Customer (book services)</option>
              <option value="provider">Provider (offer services)</option>
            </select>
          </div>
          <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-indigo-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
