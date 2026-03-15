'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';

const navItems = [
  { href: '/dashboard/bookings', label: 'Bookings', icon: '📅' },
  { href: '/dashboard/services', label: 'Services',  icon: '🛎️' },
  { href: '/dashboard/profile',  label: 'Profile',   icon: '👤' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, isAuthenticated, fetchMe, logout } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.replace('/auth/login'); return; }
    if (!isAuthenticated) fetchMe();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <span className="text-xl font-bold text-indigo-600">BookIt</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(href)
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{icon}</span>
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          {user && (
            <div className="mb-3 px-3">
              <p className="text-sm font-medium text-gray-800">{user.first_name} {user.last_name}</p>
              <p className="text-xs text-gray-400 capitalize">{user.role}</p>
            </div>
          )}
          <button onClick={handleLogout} className="btn-secondary w-full text-sm">
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
