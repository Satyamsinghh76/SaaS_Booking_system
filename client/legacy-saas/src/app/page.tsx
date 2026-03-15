import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-white px-4">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-5xl font-bold text-indigo-600 tracking-tight">BookIt</h1>
        <p className="text-xl text-gray-600">
          Simple, powerful booking management for modern businesses. Accept appointments, manage services, and grow your schedule — all in one place.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/register" className="btn-primary px-8 py-3 text-base">
            Get started free
          </Link>
          <Link href="/auth/login" className="btn-secondary px-8 py-3 text-base">
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
