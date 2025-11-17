'use client';

import { useEffect, useState } from 'react';
import { authApi } from '@/lib/api';
import axios from 'axios';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    checkAdminAndFetchUsers();
  }, [statusFilter]);

  const checkAdminAndFetchUsers = async () => {
    try {
      const profileResponse = await authApi.getProfile();
      if (profileResponse.data.role !== 'ADMIN') {
        window.location.href = '/dashboard';
        return;
      }
      await fetchUsers();
    } catch (error) {
      window.location.href = '/login';
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Fetch all users
      const response = await axios.get('http://localhost:8080/api/v1/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
        params: statusFilter ? { status: statusFilter } : {},
      });

      setUsers(response.data?.data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string, reason?: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:8080/api/v1/admin/users/${userId}/status`,
        { status: newStatus, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchUsers();
      setShowDetailsModal(false);
      alert(`User ${newStatus.toLowerCase()} successfully`);
    } catch (error: any) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status: ' + (error.response?.data?.message || error.message));
    }
  };

  const openDetailsModal = (user: any) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: any = {
      ADMIN: 'bg-red-100 text-red-800',
      HUB_HOST: 'bg-purple-100 text-purple-800',
      CUSTOMER: 'bg-blue-100 text-blue-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: any = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      ACTIVE: 'bg-green-100 text-green-800',
      SUSPENDED: 'bg-red-100 text-red-800',
      REJECTED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <a
            href="/admin"
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
          >
            Back to Admin Dashboard
          </a>
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
                <option value="">All Users</option>
                <option value="PENDING">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                Showing {users.length} user{users.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Pending Users Alert */}
        {statusFilter === 'PENDING' && users.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">
              <strong>⚠️ {users.length} user{users.length !== 1 ? 's' : ''} pending approval</strong>
              <br />
              Review and approve or reject user registrations below.
            </p>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registered
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                    {user.phone && (
                      <div className="text-xs text-gray-500">{user.phone}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded ${getRoleBadgeColor(user.role)}`}>
                      {user.role?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded ${getStatusBadgeColor(user.status || 'ACTIVE')}`}>
                      {user.status || 'ACTIVE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => openDetailsModal(user)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View
                    </button>
                    {(!user.status || user.status === 'PENDING') && (
                      <>
                        <button
                          onClick={() => handleStatusChange(user.id, 'APPROVED')}
                          className="text-green-600 hover:text-green-800 font-medium"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatusChange(user.id, 'REJECTED', 'Did not meet requirements')}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {user.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleStatusChange(user.id, 'SUSPENDED', 'Policy violation')}
                        className="text-orange-600 hover:text-orange-800 font-medium"
                      >
                        Suspend
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No users found for the selected filter
            </div>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-gray-900">{selectedUser.fullName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{selectedUser.email}</p>
                </div>
                {selectedUser.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-gray-900">{selectedUser.phone}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Role</label>
                  <p className="text-gray-900">
                    <span className={`px-2 py-1 text-xs rounded ${getRoleBadgeColor(selectedUser.role)}`}>
                      {selectedUser.role?.replace('_', ' ')}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="text-gray-900">
                    <span className={`px-2 py-1 text-xs rounded ${getStatusBadgeColor(selectedUser.status || 'ACTIVE')}`}>
                      {selectedUser.status || 'ACTIVE'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Registered</label>
                  <p className="text-gray-900">{new Date(selectedUser.createdAt).toLocaleString()}</p>
                </div>
                {selectedUser.role === 'HUB_HOST' && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Hub Information</label>
                    <p className="text-gray-600 text-sm">
                      Check the "Manage Hubs" section for this user's hubs
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {(!selectedUser.status || selectedUser.status === 'PENDING') && (
                <div className="flex gap-3 mt-6 pt-6 border-t">
                  <button
                    onClick={() => handleStatusChange(selectedUser.id, 'APPROVED')}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 font-medium"
                  >
                    Approve User
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedUser.id, 'REJECTED', 'Did not meet requirements')}
                    className="flex-1 bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 font-medium"
                  >
                    Reject User
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
