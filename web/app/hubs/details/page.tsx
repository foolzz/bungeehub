'use client';

import { useState, useEffect } from 'react';
import { hubsApi } from '../../../lib/api';

export default function HubDetailsPage() {
  const [hub, setHub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hubId, setHubId] = useState<string>('');

  useEffect(() => {
    // Get hub ID from URL
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      setHubId(id);
      fetchHubDetails(id);
    } else {
      setError('No hub ID provided');
      setLoading(false);
    }
  }, []);

  const fetchHubDetails = async (id: string) => {
    try {
      setLoading(true);
      const response = await hubsApi.getById(id);
      setHub(response.data);
    } catch (error: any) {
      console.error('Error fetching hub details:', error);
      setError('Failed to load hub details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading hub details...</div>
      </div>
    );
  }

  if (error || !hub) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-red-600 mb-4">{error || 'Hub not found'}</div>
          <a
            href="/dashboard"
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">{hub.name}</h1>
          <a
            href="/dashboard"
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
          >
            Back to Dashboard
          </a>
        </div>

        {/* Hub Overview */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Hub Information</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Address</h3>
              <p className="mt-1 text-gray-900">{hub.address}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <p className="mt-1">
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                  {hub.status}
                </span>
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Tier</h3>
              <p className="mt-1">
                <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                  {hub.tier?.replace('_', ' ')}
                </span>
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Capacity</h3>
              <p className="mt-1 text-gray-900">{hub.capacity} packages</p>
            </div>
            {hub.latitude && hub.longitude && (
              <>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Latitude</h3>
                  <p className="mt-1 text-gray-900">{hub.latitude}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Longitude</h3>
                  <p className="mt-1 text-gray-900">{hub.longitude}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Total Deliveries</h3>
            <p className="text-3xl font-bold text-primary-600">{hub.totalDeliveries || 0}</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Rating</h3>
            <p className="text-3xl font-bold text-yellow-600">
              ★ {hub.rating ? parseFloat(hub.rating).toFixed(1) : '0.0'}
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Active Packages</h3>
            <p className="text-3xl font-bold text-blue-600">{hub._count?.packages || 0}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Quick Actions</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <a
              href={`/packages?hubId=${hub.id}`}
              className="block p-4 border-2 border-primary-600 rounded-lg hover:bg-primary-50 transition"
            >
              <h3 className="font-semibold text-primary-600 mb-1">View Packages</h3>
              <p className="text-sm text-gray-600">
                See all packages assigned to this hub
              </p>
            </a>
            <button
              className="block p-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition text-left"
              onClick={() => alert('Edit functionality coming soon!')}
            >
              <h3 className="font-semibold mb-1 text-gray-900">Edit Hub</h3>
              <p className="text-sm text-gray-600">
                Update hub information and settings
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
