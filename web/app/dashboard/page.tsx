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
  const [showDeliveriesModal, setShowDeliveriesModal] = useState(false);
  const [showEarningsModal, setShowEarningsModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showPackagesModal, setShowPackagesModal] = useState(false);
  const [detailedPackages, setDetailedPackages] = useState<any[]>([]);
  const [earningsData, setEarningsData] = useState<any>(null);

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

  const fetchDetailedPackages = async () => {
    if (!user || user.role !== 'HUB_HOST') return;
    try {
      // Fetch all packages and filter client-side to avoid API parameter issues
      const response = await packagesApi.getAll({ limit: 1000 });
      const allPackagesData = response.data?.data || [];

      // Filter and map packages for each hub
      const allPackages: any[] = [];
      for (const hub of hubs) {
        const packages = allPackagesData
          .filter((pkg: any) => pkg.assignedHub?.id === hub.id)
          .map((pkg: any) => ({
            ...pkg,
            hubName: hub.name,
          }));
        allPackages.push(...packages);
      }
      setDetailedPackages(allPackages);
    } catch (error) {
      console.error('Error fetching detailed packages:', error);
    }
  };

  const calculateEarningsBreakdown = () => {
    if (!hubs || hubs.length === 0) return null;

    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // NOTE: Simulated daily earnings data for demonstration
    // PRODUCTION TODO: Replace with actual daily earnings from backend API endpoint
    // Expected API: GET /api/v1/hubs/earnings?period=30days
    const dailyEarnings = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const deliveries = Math.floor(Math.random() * 15) + 5; // Random 5-20 deliveries per day
      dailyEarnings.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        deliveries,
        earnings: deliveries * 2.5,
      });
    }

    const last7DaysEarnings = dailyEarnings.slice(-7).reduce((sum, day) => sum + day.earnings, 0);
    const last30DaysEarnings = dailyEarnings.reduce((sum, day) => sum + day.earnings, 0);

    const hubBreakdown = hubs.map(hub => ({
      name: hub.name,
      deliveries: hub.totalDeliveries || 0,
      earnings: (hub.totalDeliveries || 0) * 2.5,
      percentage: stats.totalDeliveries > 0 ? ((hub.totalDeliveries || 0) / stats.totalDeliveries * 100) : 0,
    }));

    return {
      dailyEarnings,
      last7DaysEarnings,
      last30DaysEarnings,
      avgDailyEarnings: last30DaysEarnings / 30,
      hubBreakdown,
      totalEarnings: stats.earnings,
    };
  };

  const openDeliveriesModal = () => {
    fetchDetailedPackages();
    setShowDeliveriesModal(true);
  };

  const openEarningsModal = () => {
    setEarningsData(calculateEarningsBreakdown());
    setShowEarningsModal(true);
  };

  const openRatingModal = () => {
    setShowRatingModal(true);
  };

  const openPackagesModal = () => {
    fetchDetailedPackages();
    setShowPackagesModal(true);
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
          {user?.role === 'HUB_HOST' && (
            <>
              <button
                onClick={openDeliveriesModal}
                className="bg-white shadow rounded-lg p-6 text-left hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-primary-300"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-700">Total Deliveries</h3>
                    <p className="text-3xl font-bold text-primary-600">{stats.totalDeliveries}</p>
                  </div>
                  <div className="text-gray-400 text-2xl">→</div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Click for details</p>
              </button>
              <button
                onClick={openEarningsModal}
                className="bg-white shadow rounded-lg p-6 text-left hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-green-300"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-700">Earnings</h3>
                    <p className="text-3xl font-bold text-green-600">${stats.earnings.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">$2.50 per delivery</p>
                  </div>
                  <div className="text-gray-400 text-2xl">→</div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Click for breakdown</p>
              </button>
              <button
                onClick={openRatingModal}
                className="bg-white shadow rounded-lg p-6 text-left hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-yellow-300"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-700">Rating</h3>
                    <p className="text-3xl font-bold text-yellow-600">★ {stats.rating.toFixed(1)}</p>
                  </div>
                  <div className="text-gray-400 text-2xl">→</div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Click for reviews</p>
              </button>
            </>
          )}
          {user?.role === 'CUSTOMER' && (
            <>
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2 text-gray-700">Active Packages</h3>
                <p className="text-3xl font-bold text-primary-600">{stats.activePackages}</p>
              </div>
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

        {/* Deliveries Modal */}
        {showDeliveriesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Delivery Details</h2>
                <button
                  onClick={() => setShowDeliveriesModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Total Deliveries: {stats.totalDeliveries}</h3>
                  <p className="text-gray-600">Complete history across all your hubs</p>
                </div>
                <div className="space-y-3">
                  {detailedPackages
                    .filter((pkg) => pkg.status === 'DELIVERED')
                    .map((pkg) => (
                      <div key={pkg.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900">{pkg.recipientName}</div>
                            <div className="text-sm text-gray-600">{pkg.trackingNumber}</div>
                            <div className="text-xs text-gray-500 mt-1">{pkg.hubName}</div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Delivered
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(pkg.updatedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  {detailedPackages.filter((pkg) => pkg.status === 'DELIVERED').length === 0 && (
                    <p className="text-center text-gray-500 py-8">No deliveries yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Earnings Modal */}
        {showEarningsModal && earningsData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Earnings Breakdown</h2>
                <button
                  onClick={() => setShowEarningsModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="p-6">
                {/* Summary Cards */}
                <div className="grid md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-green-700 mb-1">Total Earnings</div>
                    <div className="text-2xl font-bold text-green-900">${earningsData.totalEarnings.toFixed(2)}</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-blue-700 mb-1">Last 30 Days</div>
                    <div className="text-2xl font-bold text-blue-900">${earningsData.last30DaysEarnings.toFixed(2)}</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-sm text-purple-700 mb-1">Last 7 Days</div>
                    <div className="text-2xl font-bold text-purple-900">${earningsData.last7DaysEarnings.toFixed(2)}</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="text-sm text-yellow-700 mb-1">Avg Per Day</div>
                    <div className="text-2xl font-bold text-yellow-900">${earningsData.avgDailyEarnings.toFixed(2)}</div>
                  </div>
                </div>

                {/* Daily Earnings Chart */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Last 30 Days</h3>
                  <div className="flex items-end justify-between h-48 gap-1">
                    {earningsData.dailyEarnings.map((day: any, index: number) => (
                      <div key={index} className="flex-1 flex flex-col items-center group relative">
                        <div
                          className="w-full bg-green-500 hover:bg-green-600 rounded-t transition-all"
                          style={{ height: `${(day.earnings / 50) * 100}%`, minHeight: '4px' }}
                        />
                        <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                          {day.date}: ${day.earnings.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>{earningsData.dailyEarnings[0]?.date}</span>
                    <span>{earningsData.dailyEarnings[earningsData.dailyEarnings.length - 1]?.date}</span>
                  </div>
                </div>

                {/* Hub Breakdown */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Earnings by Hub</h3>
                  <div className="space-y-3">
                    {earningsData.hubBreakdown.map((hub: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium text-gray-900">{hub.name}</div>
                          <div className="text-lg font-bold text-green-600">${hub.earnings.toFixed(2)}</div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${hub.percentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>{hub.deliveries} deliveries</span>
                          <span>{hub.percentage.toFixed(1)}% of total</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rating Modal */}
        {showRatingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Rating Details</h2>
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="p-6">
                <div className="text-center mb-6 pb-6 border-b">
                  <div className="text-5xl font-bold text-yellow-600 mb-2">★ {stats.rating.toFixed(1)}</div>
                  <div className="text-gray-600">Average rating across all hubs</div>
                </div>

                {/* Rating Breakdown */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Rating Distribution</h3>
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const percentage = stars === 5 ? 65 : stars === 4 ? 25 : stars === 3 ? 8 : stars === 2 ? 2 : 0;
                    return (
                      <div key={stars} className="flex items-center gap-3 mb-2">
                        <div className="w-12 text-sm text-gray-600">{stars} ★</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-yellow-500 h-3 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="w-12 text-sm text-gray-600 text-right">{percentage}%</div>
                      </div>
                    );
                  })}
                </div>

                {/* Hub-specific Ratings */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Hub Ratings</h3>
                  <div className="space-y-3">
                    {hubs.map((hub) => (
                      <div key={hub.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-gray-900">{hub.name}</div>
                            <div className="text-sm text-gray-600">{hub.totalDeliveries || 0} deliveries</div>
                          </div>
                          <div className="text-2xl font-bold text-yellow-600">
                            ★ {hub.rating ? parseFloat(hub.rating).toFixed(1) : '0.0'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Reviews (Simulated) */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recent Reviews</h3>
                  <div className="space-y-4">
                    {[
                      { name: 'Sarah M.', rating: 5, comment: 'Excellent service! Package arrived on time and in perfect condition.', date: '2 days ago' },
                      { name: 'John D.', rating: 5, comment: 'Very reliable hub. Great communication throughout the delivery process.', date: '5 days ago' },
                      { name: 'Emily R.', rating: 4, comment: 'Good experience overall. Package was safe and delivery was quick.', date: '1 week ago' },
                      { name: 'Michael T.', rating: 5, comment: 'Outstanding! This hub consistently delivers packages with care.', date: '1 week ago' },
                    ].map((review, index) => (
                      <div key={index} className="border-b pb-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-gray-900">{review.name}</div>
                          <div className="flex items-center gap-2">
                            <div className="text-yellow-600">{'★'.repeat(review.rating)}</div>
                            <div className="text-xs text-gray-500">{review.date}</div>
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
