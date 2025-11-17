'use client';

import { useEffect, useState } from 'react';
import { authApi } from '@/lib/api';
import axios from 'axios';

export default function AdminHubsPage() {
  const [hubs, setHubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingHub, setEditingHub] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    checkAdminAndFetchHubs();
  }, [statusFilter]);

  const checkAdminAndFetchHubs = async () => {
    try {
      const profileResponse = await authApi.getProfile();
      if (profileResponse.data.role !== 'ADMIN') {
        window.location.href = '/dashboard';
        return;
      }
      await fetchHubs();
    } catch (error) {
      window.location.href = '/login';
    }
  };

  const fetchHubs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = statusFilter ? { status: statusFilter } : {};

      const response = await axios.get('http://localhost:8080/api/v1/admin/hubs', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setHubs(response.data?.data || []);
    } catch (error: any) {
      console.error('Error fetching hubs:', error);
      setError('Failed to load hubs');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (hubId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:8080/api/v1/admin/hubs/${hubId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchHubs();
      alert('Hub status updated successfully');
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert('Failed to update hub status: ' + (error.response?.data?.message || error.message));
    }
  };

  const openEditModal = (hub: any) => {
    setEditingHub({...hub});
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:8080/api/v1/admin/hubs/${editingHub.id}`,
        {
          name: editingHub.name,
          address: editingHub.address,
          latitude: parseFloat(editingHub.latitude),
          longitude: parseFloat(editingHub.longitude),
          capacity: parseInt(editingHub.capacity),
          tier: editingHub.tier,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowEditModal(false);
      await fetchHubs();
      alert('Hub updated successfully');
    } catch (error: any) {
      console.error('Error updating hub:', error);
      alert('Failed to update hub: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading hubs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Hub Management</h1>
          <div className="flex gap-2">
            <a
              href="/admin"
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              Back to Admin Dashboard
            </a>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="APPROVED">Approved</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                Showing {hubs.length} hub{hubs.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Hubs Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hub Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Host
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {hubs.map((hub) => (
                <tr key={hub.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{hub.name}</div>
                    <div className="text-xs text-gray-500">{hub.address}</div>
                    <div className="text-xs text-gray-500">Capacity: {hub.capacity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{hub.host?.fullName || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{hub.host?.email || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={hub.status}
                      onChange={(e) => handleStatusChange(hub.id, e.target.value)}
                      className="text-xs px-2 py-1 rounded border border-gray-300"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="UNDER_REVIEW">Under Review</option>
                      <option value="APPROVED">Approved</option>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="SUSPENDED">Suspended</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {hub.tier}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs text-gray-900">Rating: ★ {hub.rating || 0}</div>
                    <div className="text-xs text-gray-500">Deliveries: {hub.totalDeliveries || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => openEditModal(hub)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingHub && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Edit Hub</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hub Name
                  </label>
                  <input
                    type="text"
                    value={editingHub.name}
                    onChange={(e) => setEditingHub({...editingHub, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={editingHub.address}
                    onChange={(e) => setEditingHub({...editingHub, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={editingHub.latitude}
                      onChange={(e) => setEditingHub({...editingHub, latitude: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={editingHub.longitude}
                      onChange={(e) => setEditingHub({...editingHub, longitude: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    value={editingHub.capacity}
                    onChange={(e) => setEditingHub({...editingHub, capacity: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tier
                  </label>
                  <select
                    value={editingHub.tier}
                    onChange={(e) => setEditingHub({...editingHub, tier: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="NEW_HUB">New Hub</option>
                    <option value="ACTIVE_HUB">Active Hub</option>
                    <option value="TOP_HUB">Top Hub</option>
                    <option value="SUPER_HUB">Super Hub</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
