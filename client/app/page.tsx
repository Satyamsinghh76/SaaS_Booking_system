import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-2xl w-full mx-auto px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-600 mb-4">
            BookFlow SaaS Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your booking platform is running successfully!
          </p>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4 text-slate-800">System Status</h2>
            <div className="text-left space-y-2 text-gray-700">
              <p>Frontend: Running</p>
              <p>Backend: Port 5000</p>
              <p>Database: SQLite</p>
              <p>Authentication: JWT</p>
            </div>
            <div className="mt-6 flex gap-4 justify-center">
              <Link
                href="/login"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Get Started
              </Link>
              <Link
                href="/services"
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                View Services
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
