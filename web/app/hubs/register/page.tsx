'use client';

import { useState, useEffect } from 'react';
import { authApi, hubsApi } from '@/lib/api';

export default function RegisterHubPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    capacity: '100',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authApi.getProfile();
        const userData = response.data;

        // Only HUB_HOST can register hubs
        if (userData.role !== 'HUB_HOST') {
          window.location.href = '/dashboard';
          return;
        }

        setUser(userData);
      } catch (error) {
        window.location.href = '/login';
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Prepare hub data
      const hubData: any = {
        name: formData.name,
        address: formData.address,
        capacity: parseInt(formData.capacity),
      };

      // Add coordinates if provided
      if (formData.latitude) {
        hubData.latitude = parseFloat(formData.latitude);
      }
      if (formData.longitude) {
        hubData.longitude = parseFloat(formData.longitude);
      }

      await hubsApi.create(hubData);
      setSuccess(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register hub. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-8 text-center">
          <div className="text-green-600 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Hub Registered Successfully!</h2>
          <p className="text-gray-600 mb-4">
            Your hub application has been submitted and is pending admin approval.
          </p>
          <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Register Your Delivery Hub</h1>
            <p className="mt-2 text-gray-600">
              Fill out the information below to register your hub. Your application will be reviewed by our admin team.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Hub Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900"
                placeholder="e.g., Downtown Hub, Main Street Hub"
                value={formData.name}
                onChange={handleChange}
              />
              <p className="mt-1 text-xs text-gray-500">
                Choose a descriptive name for your delivery hub
              </p>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Full Address <span className="text-red-500">*</span>
              </label>
              <textarea
                id="address"
                name="address"
                required
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900"
                placeholder="123 Main St, San Francisco, CA 94102"
                value={formData.address}
                onChange={handleChange}
              />
              <p className="mt-1 text-xs text-gray-500">
                Include street address, city, state, and ZIP code
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">
                  Latitude (Optional)
                </label>
                <input
                  id="latitude"
                  name="latitude"
                  type="number"
                  step="any"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900"
                  placeholder="37.7749"
                  value={formData.latitude}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">
                  Longitude (Optional)
                </label>
                <input
                  id="longitude"
                  name="longitude"
                  type="number"
                  step="any"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900"
                  placeholder="-122.4194"
                  value={formData.longitude}
                  onChange={handleChange}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              You can find coordinates using{' '}
              <a
                href="https://www.google.com/maps"
                target="_blank"
                className="text-primary-600 hover:underline"
              >
                Google Maps
              </a>
              {' '}(right-click on location → coordinates)
            </p>

            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                Package Capacity <span className="text-red-500">*</span>
              </label>
              <input
                id="capacity"
                name="capacity"
                type="number"
                required
                min="10"
                max="1000"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900"
                placeholder="100"
                value={formData.capacity}
                onChange={handleChange}
              />
              <p className="mt-1 text-xs text-gray-500">
                Maximum number of packages your hub can handle at once (minimum: 10)
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">What happens next?</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Your hub application will be submitted for admin review</li>
                <li>An admin will verify your information and approve your hub</li>
                <li>Once approved, your hub will be ACTIVE and start receiving packages</li>
                <li>You'll be able to manage packages and view earnings from your dashboard</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => window.location.href = '/dashboard'}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 font-medium disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Register Hub'}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Hub Host Information</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Name:</strong> {user?.fullName}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Phone:</strong> {user?.phone || 'Not provided'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
