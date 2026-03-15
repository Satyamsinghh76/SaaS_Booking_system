'use client';
import { useAuthStore } from '@/lib/store';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);

  if (!user) return <p className="text-gray-400">Loading…</p>;

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
      <div className="card space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-xl font-bold text-indigo-600">
            {user.first_name[0]}{user.last_name[0]}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{user.first_name} {user.last_name}</p>
            <p className="text-sm text-gray-400 capitalize">{user.role}</p>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <div>
            <p className="label">Email</p>
            <p className="text-sm text-gray-700">{user.email}</p>
          </div>
          <div>
            <p className="label">Account ID</p>
            <p className="text-xs text-gray-400 font-mono">{user.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
