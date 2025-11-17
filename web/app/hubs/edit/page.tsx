'use client';

import { useState, useEffect } from 'react';
import { hubsApi, authApi } from '../../../lib/api';
import axios from 'axios';

export default function EditHubPage() {
  const [hub, setHub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hubId, setHubId] = useState<string>('');
  const [isOwner, setIsOwner] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    capacity: '',
  });

  useEffect(() => {
    const init = async () => {
      // Get hub ID from URL
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');

      if (!id) {
        setError('No hub ID provided');
        setLoading(false);
        return;
      }

      setHubId(id);
      await checkOwnershipAndFetchHub(id);
    };

    init();
  }, []);

  const checkOwnershipAndFetchHub = async (id: string) => {
    try {
      setLoading(true);

      // Check if user is logged in and get profile
      const profileResponse = await authApi.getProfile();
      const user = profileResponse.data;

      // Fetch hub details
      const hubResponse = await hubsApi.getById(id);
      const hubData = hubResponse.data;

      // Check if user is the hub owner or admin
      if (user.id !== hubData.hostId && user.role !== 'ADMIN') {
        setError('You do not have permission to edit this hub');
        setLoading(false);
        return;
      }

      setIsOwner(true);
      setHub(hubData);
      setFormData({
        name: hubData.name || '',
        address: hubData.address || '',
        latitude: hubData.latitude?.toString() || '',
        longitude: hubData.longitude?.toString() || '',
        capacity: hubData.capacity?.toString() || '',
      });
    } catch (error: any) {
      console.error('Error:', error);
      if (error.response?.status === 401) {
        window.location.href = '/login';
      } else {
        setError('Failed to load hub details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:8080/api/v1/hubs/${hubId}`,
        {
          name: formData.name,
          address: formData.address,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          capacity: parseInt(formData.capacity),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert('Hub updated successfully!');
      window.location.href = `/hubs/details?id=${hubId}`;
    } catch (error: any) {
      console.error('Error updating hub:', error);
      alert('Failed to update hub: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error || !isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-red-600 mb-4">{error || 'Access denied'}</div>
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Edit Hub</h1>
          <a
            href={`/hubs/details?id=${hubId}`}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
          >
            Cancel
          </a>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hub Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  required
                  placeholder="123 Main St, City, Province Postal"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude
                  </label>
                  <input
                    type="number"
                    name="latitude"
                    step="0.000001"
                    value={formData.latitude}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    required
                    placeholder="43.8828"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude
                  </label>
                  <input
                    type="number"
                    name="longitude"
                    step="0.000001"
                    value={formData.longitude}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    required
                    placeholder="-79.4403"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity (packages)
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  required
                  min="1"
                  placeholder="100"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Changes to your hub may require admin approval before they take effect.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 font-medium"
                >
                  Save Changes
                </button>
                <a
                  href={`/hubs/details?id=${hubId}`}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 font-medium"
                >
                  Cancel
                </a>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
