'use client';

import { useEffect, useState } from 'react';
import { authApi } from '@/lib/api';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authApi.getProfile();
        setUser(response.data);
      } catch (error) {
        // Redirect to login if not authenticated
        window.location.href = '/login';
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {user?.fullName}!
              </h1>
              <p className="text-gray-600 mt-1">
                Role: <span className="font-medium">{user?.role?.replace('_', ' ')}</span>
              </p>
              <p className="text-gray-600">
                Email: <span className="font-medium">{user?.email}</span>
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Total Deliveries</h3>
            <p className="text-3xl font-bold text-primary-600">0</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Earnings</h3>
            <p className="text-3xl font-bold text-green-600">$0</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Rating</h3>
            <p className="text-3xl font-bold text-yellow-600">★ 0.0</p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {user?.role === 'HUB_HOST' && (
              <>
                <a
                  href="/hubs/register"
                  className="block p-4 border-2 border-primary-600 rounded-lg hover:bg-primary-50 transition"
                >
                  <h3 className="font-semibold text-primary-600 mb-1">Register Your Hub</h3>
                  <p className="text-sm text-gray-600">
                    Set up your delivery hub and start earning
                  </p>
                </a>
                <a
                  href="/packages"
                  className="block p-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <h3 className="font-semibold mb-1">View Packages</h3>
                  <p className="text-sm text-gray-600">
                    See packages assigned to your hub
                  </p>
                </a>
              </>
            )}
            {user?.role === 'CUSTOMER' && (
              <>
                <a
                  href="/packages/track"
                  className="block p-4 border-2 border-primary-600 rounded-lg hover:bg-primary-50 transition"
                >
                  <h3 className="font-semibold text-primary-600 mb-1">Track Package</h3>
                  <p className="text-sm text-gray-600">
                    Enter tracking number to see status
                  </p>
                </a>
                <a
                  href="/hubs"
                  className="block p-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <h3 className="font-semibold mb-1">Find Hubs</h3>
                  <p className="text-sm text-gray-600">
                    Locate nearby delivery hubs
                  </p>
                </a>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            <strong>Note:</strong> This is a basic dashboard. Full functionality coming soon! Check out the{' '}
            <a href="http://localhost:8080/api-docs" target="_blank" className="underline">
              API documentation
            </a>{' '}
            for all available endpoints.
          </p>
        </div>
      </div>
    </div>
  );
}
