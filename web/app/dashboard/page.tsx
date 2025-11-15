'use client';

import { useEffect, useState } from 'react';
import { authApi, hubsApi, packagesApi } from '@/lib/api';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [stats, setStats] = useState<any>({
    totalDeliveries: 0,
    earnings: 0,
    rating: 0,
    activePackages: 0,
  });
  const [hubs, setHubs] = useState<any[]>([]);
  const [hubsLoaded, setHubsLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileResponse = await authApi.getProfile();
        const userData = profileResponse.data;
        setUser(userData);

        console.log('User data:', userData);

        // Fetch role-specific data
        if (userData.role === 'HUB_HOST') {
          try {
            console.log('Fetching hubs for hub host...');
            const hubsResponse = await hubsApi.getMyHubs();
            console.log('Hubs response:', hubsResponse.data);

            const userHubs = hubsResponse.data?.data || [];
            console.log('User hubs:', userHubs);
            setHubs(userHubs);
            setHubsLoaded(true);

            // Calculate stats from hubs
            const totalDeliveries = userHubs.reduce((sum: number, hub: any) =>
              sum + (hub.totalDeliveries || 0), 0);
            const avgRating = userHubs.length > 0
              ? userHubs.reduce((sum: number, hub: any) => sum + (parseFloat(hub.rating) || 0), 0) / userHubs.length
              : 0;

            setStats({
              totalDeliveries,
              earnings: totalDeliveries * 2.5, // Estimate $2.50 per delivery
              rating: avgRating,
              activePackages: userHubs.reduce((sum: number, hub: any) =>
                sum + (hub._count?.packages || 0), 0),
            });
          } catch (error: any) {
            console.error('Error fetching hubs:', error);
            setError(`Failed to load hubs: ${error.response?.data?.message || error.message}`);
            setHubsLoaded(true);
          }
        } else if (userData.role === 'CUSTOMER') {
          // For customers, we could fetch their packages
          try {
            const packagesResponse = await packagesApi.getAll({ limit: 5 });
            const packages = packagesResponse.data?.data || [];
            setStats({
              activePackages: packages.filter((p: any) =>
                ['IN_TRANSIT', 'AT_HUB', 'OUT_FOR_DELIVERY'].includes(p.status)
              ).length,
              totalDeliveries: packages.filter((p: any) => p.status === 'DELIVERED').length,
              rating: 0,
              earnings: 0,
            });
          } catch (error) {
            console.error('Error fetching packages:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Redirect to login if not authenticated
        window.location.href = '/login';
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
            <h3 className="text-lg font-semibold mb-2 text-gray-700">
              {user?.role === 'HUB_HOST' ? 'Total Deliveries' : 'Active Packages'}
            </h3>
            <p className="text-3xl font-bold text-primary-600">
              {user?.role === 'HUB_HOST' ? stats.totalDeliveries : stats.activePackages}
            </p>
          </div>
          {user?.role === 'HUB_HOST' && (
            <>
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2 text-gray-700">Earnings</h3>
                <p className="text-3xl font-bold text-green-600">${stats.earnings.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">Estimated at $2.50/delivery</p>
              </div>
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2 text-gray-700">Rating</h3>
                <p className="text-3xl font-bold text-yellow-600">★ {stats.rating.toFixed(1)}</p>
              </div>
            </>
          )}
          {user?.role === 'CUSTOMER' && (
            <>
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2 text-gray-700">Delivered</h3>
                <p className="text-3xl font-bold text-green-600">{stats.totalDeliveries}</p>
              </div>
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2 text-gray-700">Track Package</h3>
                <a
                  href="/packages/track"
                  className="inline-block mt-2 bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
                >
                  Track Now
                </a>
              </div>
            </>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        {user?.role === 'HUB_HOST' && hubsLoaded && hubs.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">No Hubs Registered Yet</h3>
            <p className="text-yellow-800 mb-4">
              You haven't registered any hubs yet. Click the "Register Your Hub" button below to get started and start earning!
            </p>
            <a
              href="/hubs/register"
              className="inline-block bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 font-medium"
            >
              Register Your First Hub
            </a>
          </div>
        )}

        {user?.role === 'HUB_HOST' && hubs.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">My Hubs ({hubs.length})</h2>
            <div className="space-y-3">
              {hubs.map((hub: any) => (
                <a
                  key={hub.id}
                  href={`/hubs/details?id=${hub.id}`}
                  className="block border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{hub.name}</h3>
                      <p className="text-sm text-gray-600">{hub.address}</p>
                      <div className="flex gap-4 mt-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {hub.status}
                        </span>
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          {hub.tier?.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        ★ {hub.rating ? parseFloat(hub.rating).toFixed(1) : '0.0'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {hub.totalDeliveries || 0} deliveries
                      </div>
                      <div className="text-sm text-gray-600">
                        {hub._count?.packages || 0} active packages
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Quick Actions</h2>
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
                  <h3 className="font-semibold mb-1 text-gray-900">View Packages</h3>
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
                  <h3 className="font-semibold mb-1 text-gray-900">Find Hubs</h3>
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
