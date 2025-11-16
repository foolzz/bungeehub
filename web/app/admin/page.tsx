'use client';

import { useEffect, useState } from 'react';
import { authApi, adminApi } from '@/lib/api';

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [pendingApplications, setPendingApplications] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileResponse = await authApi.getProfile();
        const userData = profileResponse.data;

        // Check if user is admin
        if (userData.role !== 'ADMIN') {
          window.location.href = '/dashboard';
          return;
        }

        setUser(userData);

        // Fetch admin dashboard stats
        try {
          const dashboardResponse = await adminApi.getDashboard();
          setStats(dashboardResponse.data);
        } catch (error) {
          console.error('Error fetching dashboard stats:', error);
        }

        // Fetch pending applications
        try {
          const applicationsResponse = await adminApi.getPendingApplications(1, 10);
          setPendingApplications(applicationsResponse.data?.data || []);
        } catch (error) {
          console.error('Error fetching applications:', error);
        }
      } catch (error) {
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
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Welcome, {user?.fullName}!
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

        {stats && (
          <div className="grid md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-700">Total Hubs</h3>
              <p className="text-3xl font-bold text-primary-600">{stats.totalHubs || 0}</p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-700">Active Hubs</h3>
              <p className="text-3xl font-bold text-green-600">{stats.activeHubs || 0}</p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-700">Pending Applications</h3>
              <p className="text-3xl font-bold text-yellow-600">{stats.pendingApplications || 0}</p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-700">Total Packages</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.totalPackages || 0}</p>
            </div>
          </div>
        )}

        {pendingApplications.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Pending Hub Applications</h2>
            <div className="space-y-3">
              {pendingApplications.map((hub: any) => (
                <div
                  key={hub.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{hub.name}</h3>
                      <p className="text-sm text-gray-600">{hub.address}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Host: {hub.host?.fullName} ({hub.host?.email})
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          {hub.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`http://localhost:8080/api-docs#/admin/AdminController_getApplicationDetails`}
                        target="_blank"
                        className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                      >
                        Review
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Admin Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <a
              href="/admin/hubs"
              className="block p-4 border-2 border-primary-600 rounded-lg hover:bg-primary-50 transition"
            >
              <h3 className="font-semibold text-primary-600 mb-1">Manage Hubs</h3>
              <p className="text-sm text-gray-600">
                View, edit, approve, and manage all delivery hubs
              </p>
            </a>
            <a
              href="/packages"
              className="block p-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <h3 className="font-semibold mb-1 text-gray-900">View Packages</h3>
              <p className="text-sm text-gray-600">
                Monitor all packages in the system
              </p>
            </a>
            <a
              href="http://localhost:8080/api-docs"
              target="_blank"
              className="block p-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <h3 className="font-semibold mb-1 text-gray-900">API Documentation</h3>
              <p className="text-sm text-gray-600">
                Access full API documentation
              </p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
